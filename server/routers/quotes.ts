/**
 * Router de Cotações de Passagens Aéreas
 * Integra Sky Scrapper API (RapidAPI) com fallback para Kayak manual
 *
 * Rota fixa: GRU (Guarulhos) → NVT (Navegantes)
 * Ida: sempre domingo | Volta: sempre sexta-feira
 * Plano gratuito: 20 requisições/mês
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getAllFlightQuotes,
  getFlightQuotesByWeek,
  insertFlightQuote,
  deleteFlightQuote,
  getApiUsage,
  incrementApiUsage,
} from "../db";

// Constantes da rota GRU → NVT
const GRU_SKY_ID = "GRU";
const GRU_ENTITY_ID = "95673332";
const NVT_SKY_ID = "NVT";
const NVT_ENTITY_ID = "95673774";
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";

/** Retorna o yearMonth atual no formato YYYY-MM */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Chama a Sky Scrapper API para buscar o menor preço de voo */
async function fetchSkyScrapperPrice(
  departureDate: string,
  returnDate: string,
  apiKey: string
): Promise<{ lowestPrice: number; airline: string | null; rawResponse: string }> {
  const url = new URL(
    `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlightsComplete`
  );
  url.searchParams.set("originSkyId", GRU_SKY_ID);
  url.searchParams.set("destinationSkyId", NVT_SKY_ID);
  url.searchParams.set("originEntityId", GRU_ENTITY_ID);
  url.searchParams.set("destinationEntityId", NVT_ENTITY_ID);
  url.searchParams.set("date", departureDate);
  url.searchParams.set("returnDate", returnDate);
  url.searchParams.set("adults", "1");
  url.searchParams.set("currency", "BRL");
  url.searchParams.set("market", "BR");
  url.searchParams.set("locale", "pt-BR");
  url.searchParams.set("cabinClass", "economy");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Sky Scrapper API retornou erro ${response.status}: ${errorText}`,
    });
  }

  const data = await response.json();
  const rawResponse = JSON.stringify(data).slice(0, 5000); // Limitar tamanho

  // Extrair menor preço da resposta
  // A API retorna itinerários com preços em data.data.itineraries
  const itineraries = data?.data?.itineraries ?? [];

  if (!itineraries || itineraries.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Nenhum voo encontrado para as datas selecionadas",
    });
  }

  let lowestPrice = Infinity;
  let airline: string | null = null;

  for (const itin of itineraries) {
    const price = itin?.price?.raw ?? itin?.price?.formatted;
    if (price !== undefined && price !== null) {
      const priceNum = typeof price === "number" ? price : parseFloat(String(price).replace(/[^0-9.]/g, ""));
      if (!isNaN(priceNum) && priceNum < lowestPrice) {
        lowestPrice = priceNum;
        // Tentar extrair companhia aérea
        const legs = itin?.legs ?? [];
        if (legs.length > 0) {
          const carriers = legs[0]?.carriers?.marketing ?? [];
          if (carriers.length > 0) {
            airline = carriers[0]?.name ?? null;
          }
        }
      }
    }
  }

  if (lowestPrice === Infinity) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Não foi possível extrair preços da resposta da API",
    });
  }

  // Converter para centavos (armazenar como inteiro)
  const lowestPriceCents = Math.round(lowestPrice * 100);

  return { lowestPrice: lowestPriceCents, airline, rawResponse };
}

export const quotesRouter = router({
  /** Listar todas as cotações (mais recentes primeiro) */
  getAll: publicProcedure.query(async () => {
    return getAllFlightQuotes();
  }),

  /** Listar cotações de uma semana específica */
  getByWeek: publicProcedure
    .input(z.object({ weekNumber: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getFlightQuotesByWeek(input.weekNumber);
    }),

  /** Verificar uso atual da API no mês corrente */
  getApiUsage: publicProcedure.query(async () => {
    const yearMonth = getCurrentYearMonth();
    return getApiUsage(yearMonth);
  }),

  /**
   * Buscar preço via Sky Scrapper API
   * Verifica limite mensal antes de chamar a API
   */
  fetchFromApi: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().int().positive(),
        departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chave da API Sky Scrapper não configurada",
        });
      }

      // Verificar limite mensal
      const yearMonth = getCurrentYearMonth();
      const usage = await getApiUsage(yearMonth);

      if (usage.requestsUsed >= usage.requestsLimit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Limite mensal de ${usage.requestsLimit} requisições atingido. Use o Kayak para cotação manual.`,
        });
      }

      // Buscar preço na API
      const { lowestPrice, airline, rawResponse } = await fetchSkyScrapperPrice(
        input.departureDate,
        input.returnDate,
        apiKey
      );

      // Incrementar contador de uso
      const newUsage = await incrementApiUsage(yearMonth);

      // Salvar cotação no banco
      await insertFlightQuote({
        weekNumber: input.weekNumber,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        lowestPrice,
        currency: "BRL",
        source: "api",
        airline: airline ?? null,
        apiRequestsUsed: newUsage.requestsUsed,
        rawResponse,
        quotedAt: new Date(),
      });

      return {
        lowestPrice,
        lowestPriceFormatted: (lowestPrice / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        airline,
        source: "api" as const,
        requestsUsed: newUsage.requestsUsed,
        requestsLimit: newUsage.requestsLimit,
      };
    }),

  /**
   * Salvar preço inserido manualmente (via Kayak ou outra fonte)
   */
  saveManual: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().int().positive(),
        departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        price: z.number().positive("Preço deve ser positivo"),
        airline: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lowestPrice = Math.round(input.price * 100); // Converter para centavos

      await insertFlightQuote({
        weekNumber: input.weekNumber,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        lowestPrice,
        currency: "BRL",
        source: "manual",
        airline: input.airline ?? null,
        apiRequestsUsed: 0,
        rawResponse: null,
        quotedAt: new Date(),
      });

      return {
        lowestPrice,
        lowestPriceFormatted: (lowestPrice / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        source: "manual" as const,
      };
    }),

  /** Deletar uma cotação pelo ID */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await deleteFlightQuote(input.id);
      return { success: true };
    }),
});
