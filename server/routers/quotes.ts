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

/** Espera ms milissegundos */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retorna o yearMonth atual no formato YYYY-MM */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Chama a Sky Scrapper API para buscar o menor preço de voo.
 *
 * O endpoint searchFlights v2 é assíncrono: a primeira chamada retorna
 * context.status = "incomplete" com um sessionId. É necessário fazer
 * polling em /searchIncomplete até status = "complete" ou até ter itinerários.
 *
 * Nota: a API retorna price.raw como valor numérico em BRL (o símbolo
 * formatado pode aparecer incorretamente como ₹ — ignoramos o símbolo).
 */
async function fetchSkyScrapperPrice(
  departureDate: string,
  returnDate: string,
  apiKey: string
): Promise<{ lowestPrice: number; airline: string | null; rawResponse: string }> {
  const headers = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };

  // ── Passo 1: Iniciar a busca ──────────────────────────────────────────────
  const searchUrl = new URL(`https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights`);
  searchUrl.searchParams.set("originSkyId", GRU_SKY_ID);
  searchUrl.searchParams.set("destinationSkyId", NVT_SKY_ID);
  searchUrl.searchParams.set("originEntityId", GRU_ENTITY_ID);
  searchUrl.searchParams.set("destinationEntityId", NVT_ENTITY_ID);
  searchUrl.searchParams.set("date", departureDate);
  searchUrl.searchParams.set("returnDate", returnDate);
  searchUrl.searchParams.set("adults", "1");
  searchUrl.searchParams.set("currency", "BRL");
  searchUrl.searchParams.set("market", "pt-BR");
  searchUrl.searchParams.set("countryCode", "BR");
  searchUrl.searchParams.set("cabinClass", "economy");
  searchUrl.searchParams.set("sortBy", "best");

  const initResponse = await fetch(searchUrl.toString(), { headers });
  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Sky Scrapper API erro ${initResponse.status}: ${errorText}`,
    });
  }

  const initData = await initResponse.json();
  const sessionId: string | undefined = initData?.data?.context?.sessionId;

  if (!sessionId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Sky Scrapper API não retornou sessionId",
    });
  }

  // ── Passo 2: Polling até obter resultados completos ───────────────────────
  let itineraries: any[] = initData?.data?.itineraries ?? [];
  let contextStatus: string = initData?.data?.context?.status ?? "incomplete";
  let lastData = initData;
  const MAX_POLLS = 5;
  const POLL_DELAY_MS = 2000;

  for (let attempt = 0; attempt < MAX_POLLS && (contextStatus !== "complete" || itineraries.length === 0); attempt++) {
    await sleep(POLL_DELAY_MS);
    const pollUrl = new URL(`https://${RAPIDAPI_HOST}/api/v2/flights/searchIncomplete`);
    pollUrl.searchParams.set("sessionId", sessionId);

    const pollResponse = await fetch(pollUrl.toString(), { headers });
    if (!pollResponse.ok) continue; // Ignorar erros transitórios no polling

    const pollData = await pollResponse.json();
    contextStatus = pollData?.data?.context?.status ?? contextStatus;
    const newItins = pollData?.data?.itineraries ?? [];
    if (newItins.length > 0) {
      itineraries = newItins;
      lastData = pollData;
    }

    if (contextStatus === "complete" && itineraries.length > 0) break;
  }

  const rawResponse = JSON.stringify(lastData).slice(0, 5000);

  if (itineraries.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Nenhum voo encontrado para as datas selecionadas. Tente usar o Kayak para inserir o preço manualmente.",
    });
  }

  // ── Passo 3: Extrair menor preço ─────────────────────────────────────────
  // price.raw é o valor numérico em BRL (o símbolo formatado pode estar errado)
  let lowestPrice = Infinity;
  let airline: string | null = null;

  for (const itin of itineraries) {
    const priceRaw = itin?.price?.raw;
    if (typeof priceRaw === "number" && !isNaN(priceRaw) && priceRaw > 0 && priceRaw < lowestPrice) {
      lowestPrice = priceRaw;
      const legs = itin?.legs ?? [];
      if (legs.length > 0) {
        const carriers = legs[0]?.carriers?.marketing ?? [];
        if (carriers.length > 0) {
          airline = carriers[0]?.name ?? null;
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

      // Se a data de ida já passou, usar a data de hoje como data de ida
      // (a API não aceita datas passadas; isso ocorre na semana corrente)
      const todayIso = new Date().toISOString().slice(0, 10);
      const effectiveDeparture =
        input.departureDate < todayIso ? todayIso : input.departureDate;

      // Garantir que a data de retorno seja posterior à data de ida efetiva
      if (input.returnDate <= effectiveDeparture) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "A data de retorno já passou. Não é possível buscar voos para esta semana.",
        });
      }

      // Buscar preço na API
      const { lowestPrice, airline, rawResponse } = await fetchSkyScrapperPrice(
        effectiveDeparture,
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
