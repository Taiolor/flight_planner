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
import { router } from "../_core/trpc";
import { flightProtectedProcedure as protectedProcedure } from "../flightAuthMiddleware";
import { ENV } from "../_core/env";
import {
  getAllFlightQuotes,
  getFlightQuotesByWeek,
  insertFlightQuote,
  deleteFlightQuote,
  getApiUsage,
  reserveApiUsage,
} from "../db";

// Constantes da rota GRU → NVT
const GRU_SKY_ID = "GRU";
const GRU_ENTITY_ID = "95673332";
const NVT_SKY_ID = "NVT";
const NVT_ENTITY_ID = "95673774";
const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const planningYearSchema = z.number().int().min(2020).max(2100);
const RAPIDAPI_TIMEOUT_MS = 12_000;
const RAPIDAPI_MAX_RESPONSE_BYTES = 512_000;
const QUOTE_RATE_LIMIT_MAX_REQUESTS = 4;
const QUOTE_RATE_LIMIT_WINDOW_MS = 60_000;

/** Espera ms milissegundos */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type QuoteRateLimitEntry = { count: number; resetAt: number };

export function createQuoteRequestLimiter(
  maxRequests = QUOTE_RATE_LIMIT_MAX_REQUESTS,
  windowMs = QUOTE_RATE_LIMIT_WINDOW_MS
) {
  const requests = new Map<string, QuoteRateLimitEntry>();

  return (key: string, now = Date.now()) => {
    const current = requests.get(key);
    if (!current || now >= current.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    if (current.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Aguarde um minuto antes de solicitar novas cotações.",
      });
    }
    current.count += 1;
  };
}

const enforceQuoteRequestRateLimit = createQuoteRequestLimiter();

async function fetchRapidApiJson(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RAPIDAPI_TIMEOUT_MS);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > RAPIDAPI_MAX_RESPONSE_BYTES) {
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "A resposta da cotação excedeu o tamanho permitido.",
      });
    }

    const rawBody = await response.text();
    if (Buffer.byteLength(rawBody, "utf8") > RAPIDAPI_MAX_RESPONSE_BYTES) {
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "A resposta da cotação excedeu o tamanho permitido.",
      });
    }
    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "O serviço de cotação não está disponível no momento.",
      });
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "O serviço de cotação retornou uma resposta inválida.",
      });
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (controller.signal.aborted) {
      throw new TRPCError({
        code: "TIMEOUT",
        message: "A consulta de cotação excedeu o tempo permitido.",
      });
    }
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Não foi possível consultar o serviço de cotações.",
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Retorna o yearMonth atual no formato YYYY-MM */
let cachedYearMonth = "";
let lastMonth = -1;
let lastYear = -1;
function getCurrentYearMonth(): string {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  if (currentMonth !== lastMonth || currentYear !== lastYear) {
    lastMonth = currentMonth;
    lastYear = currentYear;
    const month = String(currentMonth + 1).padStart(2, "0");
    cachedYearMonth = `${currentYear}-${month}`;
  }
  return cachedYearMonth;
}

interface FlightLegInfo {
  airline: string | null;
  departure: string | null; // ISO 8601 datetime ex: "2026-06-07T22:05:00"
  arrival: string | null; // ISO 8601 datetime
}

interface SkyScrapperResult {
  lowestPrice: number;
  airline: string | null; // companhia ida (compatível com campo legado)
  outboundAirline: string | null;
  returnAirline: string | null;
  outboundDeparture: string | null;
  outboundArrival: string | null;
  returnDeparture: string | null;
  returnArrival: string | null;
  rawResponse: string;
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
async function initiateFlightSearch(
  departureDate: string,
  returnDate: string,
  headers: Record<string, string>
) {
  const searchUrl = new URL(
    `https://${RAPIDAPI_HOST}/api/v2/flights/searchFlights`
  );
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

  const initData = await fetchRapidApiJson(searchUrl.toString(), headers);
  const sessionId: string | undefined = initData?.data?.context?.sessionId;

  if (!sessionId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Sky Scrapper API não retornou sessionId",
    });
  }

  return { initData, sessionId };
}

async function pollForResults(
  sessionId: string,
  headers: Record<string, string>,
  initData: any
) {
  let itineraries: any[] = initData?.data?.itineraries ?? [];
  let contextStatus: string = initData?.data?.context?.status ?? "incomplete";
  let lastData = initData;
  const MAX_POLLS = 5;

  const pollUrl = new URL(
    `https://${RAPIDAPI_HOST}/api/v2/flights/searchIncomplete`
  );
  pollUrl.searchParams.set("sessionId", sessionId);
  const pollUrlString = pollUrl.toString();

  for (
    let attempt = 0;
    attempt < MAX_POLLS &&
    (contextStatus !== "complete" || itineraries.length === 0);
    attempt++
  ) {
    const delay = 500 * Math.pow(2, attempt);
    await sleep(delay);

    let pollData: any;
    try {
      pollData = await fetchRapidApiJson(pollUrlString, headers);
    } catch {
      continue; // Ignorar falhas transitórias de polling sem expor detalhes.
    }
    contextStatus = pollData?.data?.context?.status ?? contextStatus;
    const newItins = pollData?.data?.itineraries ?? [];
    if (newItins.length > 0) {
      itineraries = newItins;
      lastData = pollData;
    }

    if (contextStatus === "complete" && itineraries.length > 0) break;
  }

  return { itineraries, lastData };
}

function extractBestFlightInfo(
  itineraries: any[],
  lastData: any
): SkyScrapperResult {
  const rawResponse = JSON.stringify(lastData).slice(0, 5000);

  if (itineraries.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        "Nenhum voo encontrado para as datas selecionadas. Tente usar o Kayak para inserir o preço manualmente.",
    });
  }

  // price.raw é o valor numérico em BRL (o símbolo formatado pode estar errado)
  let lowestPrice = Infinity;
  let outboundInfo: FlightLegInfo = {
    airline: null,
    departure: null,
    arrival: null,
  };
  let returnInfo: FlightLegInfo = {
    airline: null,
    departure: null,
    arrival: null,
  };

  /** Extrai companhia aérea e horários de um leg da API */
  const extractLegInfo = (leg: any): FlightLegInfo => {
    const carriers = leg?.carriers?.marketing ?? leg?.carriers?.operating ?? [];
    const airlineName =
      carriers.length > 0 ? (carriers[0]?.name ?? null) : null;
    return {
      airline: airlineName,
      departure: leg?.departure ?? null, // ISO 8601: "2026-06-07T22:05:00"
      arrival: leg?.arrival ?? null,
    };
  };

  for (const itin of itineraries) {
    const priceRaw = itin?.price?.raw;
    if (
      typeof priceRaw === "number" &&
      !isNaN(priceRaw) &&
      priceRaw > 0 &&
      priceRaw < lowestPrice
    ) {
      lowestPrice = priceRaw;
      const legs: any[] = itin?.legs ?? [];
      // leg[0] = voo de ida (GRU → NVT), leg[1] = voo de volta (NVT → GRU)
      if (legs.length >= 1) outboundInfo = extractLegInfo(legs[0]);
      if (legs.length >= 2) returnInfo = extractLegInfo(legs[1]);
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

  return {
    lowestPrice: lowestPriceCents,
    airline: outboundInfo.airline, // compatível com campo legado
    outboundAirline: outboundInfo.airline,
    returnAirline: returnInfo.airline,
    outboundDeparture: outboundInfo.departure,
    outboundArrival: outboundInfo.arrival,
    returnDeparture: returnInfo.departure,
    returnArrival: returnInfo.arrival,
    rawResponse,
  };
}

async function fetchSkyScrapperPrice(
  departureDate: string,
  returnDate: string,
  apiKey: string
): Promise<SkyScrapperResult> {
  const headers = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };

  // ── Passo 1: Iniciar a busca ──────────────────────────────────────────────
  const { initData, sessionId } = await initiateFlightSearch(
    departureDate,
    returnDate,
    headers
  );

  // ── Passo 2: Polling até obter resultados completos ───────────────────────
  const { itineraries, lastData } = await pollForResults(
    sessionId,
    headers,
    initData
  );

  // ── Passo 3: Extrair menor preço e dados detalhados ───────────────────────
  return extractBestFlightInfo(itineraries, lastData);
}

export const quotesRouter = router({
  /** Listar todas as cotações (mais recentes primeiro) */
  getAll: protectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .query(async ({ input }) => getAllFlightQuotes(input.year)),

  /** Listar cotações de uma semana específica */
  getByWeek: protectedProcedure
    .input(
      z.object({
        year: planningYearSchema,
        weekNumber: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      return getFlightQuotesByWeek(input.weekNumber, input.year);
    }),

  /** Verificar uso atual da API no mês corrente */
  getApiUsage: protectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .query(async ({ input }) => {
      // A franquia da RapidAPI é mensal e compartilhada; o ano mantém a
      // chave de consulta sincronizada ao planejamento selecionado.
      void input.year;
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
        year: planningYearSchema,
        weekNumber: z.number().int().positive(),
        departureDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        returnDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey = ENV.rapidapiKey;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Chave da API Sky Scrapper não configurada",
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

      enforceQuoteRequestRateLimit(ctx.flightSession.email.toLowerCase());
      const yearMonth = getCurrentYearMonth();
      const usage = await reserveApiUsage(yearMonth);
      if (!usage.reserved) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Limite mensal de ${usage.requestsLimit} requisições atingido. Use o Kayak para cotação manual.`,
        });
      }

      // Buscar preço na API com dados detalhados
      const result = await fetchSkyScrapperPrice(
        effectiveDeparture,
        input.returnDate,
        apiKey
      );

      // Salvar cotação no banco com todos os campos detalhados
      await insertFlightQuote({
        year: input.year,
        weekNumber: input.weekNumber,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        lowestPrice: result.lowestPrice,
        currency: "BRL",
        source: "api",
        airline: result.airline ?? null,
        outboundAirline: result.outboundAirline ?? null,
        returnAirline: result.returnAirline ?? null,
        outboundDeparture: result.outboundDeparture ?? null,
        outboundArrival: result.outboundArrival ?? null,
        returnDeparture: result.returnDeparture ?? null,
        returnArrival: result.returnArrival ?? null,
        apiRequestsUsed: usage.requestsUsed,
        rawResponse: result.rawResponse,
        quotedAt: new Date(),
      });

      return {
        lowestPrice: result.lowestPrice,
        lowestPriceFormatted: (result.lowestPrice / 100).toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          }
        ),
        airline: result.airline,
        outboundAirline: result.outboundAirline,
        returnAirline: result.returnAirline,
        outboundDeparture: result.outboundDeparture,
        outboundArrival: result.outboundArrival,
        returnDeparture: result.returnDeparture,
        returnArrival: result.returnArrival,
        source: "api" as const,
        requestsUsed: usage.requestsUsed,
        requestsLimit: usage.requestsLimit,
      };
    }),

  /**
   * Salvar preço inserido manualmente (via Kayak ou outra fonte)
   */
  saveManual: protectedProcedure
    .input(
      z.object({
        year: planningYearSchema,
        weekNumber: z.number().int().positive(),
        departureDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        returnDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
        price: z.number().positive("Preço deve ser positivo"),
        airline: z.string().optional(),
        outboundAirline: z.string().optional(),
        returnAirline: z.string().optional(),
        outboundDeparture: z.string().optional(),
        outboundArrival: z.string().optional(),
        returnDeparture: z.string().optional(),
        returnArrival: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lowestPrice = Math.round(input.price * 100); // Converter para centavos

      await insertFlightQuote({
        year: input.year,
        weekNumber: input.weekNumber,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        lowestPrice,
        currency: "BRL",
        source: "manual",
        airline: input.airline ?? null,
        outboundAirline: input.outboundAirline ?? null,
        returnAirline: input.returnAirline ?? null,
        outboundDeparture: input.outboundDeparture ?? null,
        outboundArrival: input.outboundArrival ?? null,
        returnDeparture: input.returnDeparture ?? null,
        returnArrival: input.returnArrival ?? null,
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
    .input(
      z.object({
        id: z.number().int().positive(),
        year: planningYearSchema,
      })
    )
    .mutation(async ({ input }) => {
      await deleteFlightQuote(input.id, input.year);
      return { success: true };
    }),
});
