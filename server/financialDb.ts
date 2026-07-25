/**
 * financialDb.ts
 * Helpers de banco de dados para a página de Gestão Financeira.
 * Agrega dados de flight_weeks e flight_prices para análises financeiras.
 */
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { flightWeeks, flightPrices } from "../drizzle/schema";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WeekFinancialData {
  weekNumber: number;
  year: number;
  departureDate: string;
  returnDate: string;
  departureAirline: string | null;
  returnAirline: string | null;
  ticketType: string | null;
  isTicketIssued: number;
  departureRescheduled: number;
  returnRescheduled: number;
  // Preço pago (registrado em flight_prices)
  paidPriceDeparture: number | null; // R$ ida
  paidPriceReturn: number | null;    // R$ volta
  paidPriceTotal: number | null;     // R$ total
  // Milhas
  smilesPoints: number | null;
  latamPassPoints: number | null;
  totalMiles: number | null;
  // Mês derivado da data de ida
  month: number;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalCashBRL: number;
  totalSmilesPoints: number;
  totalLatamPassPoints: number;
  totalMiles: number;
  weeksCount: number;
  issuedCount: number;
  avgCashBRL: number;
  byAirline: Record<string, { cashBRL: number; miles: number; count: number }>;
}

export interface YearSummary {
  year: number;
  totalCashBRL: number;
  totalSmilesPoints: number;
  totalLatamPassPoints: number;
  totalMiles: number;
  weeksCount: number;
  issuedCount: number;
  avgCashBRL: number;
  byAirline: Record<string, { cashBRL: number; miles: number; count: number }>;
  byMonth: MonthSummary[];
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function parseMonth(dateStr: string): number {
  // Formato esperado: "YYYY-MM-DD" ou "DD/MM/YYYY"
  if (!dateStr) return 0;
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) return parseInt(parts[1], 10);
  }
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length >= 2) return parseInt(parts[1], 10);
  }
  return 0;
}

function parseYear(dateStr: string): number {
  if (!dateStr) return new Date().getFullYear();
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 1) return parseInt(parts[0], 10);
  }
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length >= 3) return parseInt(parts[2], 10);
  }
  return new Date().getFullYear();
}

// ─── Funções exportadas ───────────────────────────────────────────────────────

/**
 * Busca todos os dados financeiros agregados por semana para um dado ano.
 * Cruza flight_weeks com flight_prices para obter o preço pago.
 */
export async function getFinancialDataByYear(
  year: number
): Promise<WeekFinancialData[]> {
  const db = await getDb();
  if (!db) return [];

  // Buscar semanas ativas do ano
  const weeks = await db
    .select()
    .from(flightWeeks)
    .where(and(eq(flightWeeks.year, year), eq(flightWeeks.isDeleted, 0)));

  // Buscar todos os preços do ano
  const prices = await db
    .select()
    .from(flightPrices)
    .where(eq(flightPrices.year, year));

  // Indexar preços por semana+companhia
  const priceMap = new Map<string, number>();
  const weekPricesMap = new Map<number, number[]>(); // Todos os preços de uma semana
  
  for (const p of prices) {
    const key = `${p.weekNumber}:${p.airline}`;
    const val = parseFloat(p.price.replace(",", ".").replace(/[^0-9.]/g, ""));
    if (!isNaN(val)) {
      priceMap.set(key, val);
      
      // Agregar todos os preços da semana
      if (!weekPricesMap.has(p.weekNumber)) {
        weekPricesMap.set(p.weekNumber, []);
      }
      weekPricesMap.get(p.weekNumber)!.push(val);
    }
  }

  return weeks.map(w => {
    const depAirline = w.departureAirline ?? null;
    const retAirline = w.returnAirline ?? null;

    // Preço pago = soma de TODOS os preços de TODAS as companhias daquela semana
    // (representando o total de opções de passagens disponíveis)
    let paidTotal: number | null = null;
    const allWeekPrices = weekPricesMap.get(w.weekNumber) ?? [];
    if (allWeekPrices.length > 0) {
      paidTotal = allWeekPrices.reduce((sum, p) => sum + p, 0);
    }
    
    // Preços individuais de ida e volta (para referência)
    const paidDep = depAirline
      ? (priceMap.get(`${w.weekNumber}:${depAirline}`) ?? null)
      : null;
    const paidRet =
      w.ticketType === "roundtrip" && retAirline
        ? (priceMap.get(`${w.weekNumber}:${retAirline}`) ?? null)
        : null;

    const totalMiles = (w.smilesPoints ?? 0) + (w.latamPassPoints ?? 0);

    return {
      weekNumber: w.weekNumber,
      year: w.year,
      departureDate: w.departureDate,
      returnDate: w.returnDate,
      departureAirline: depAirline,
      returnAirline: retAirline,
      ticketType: w.ticketType,
      isTicketIssued: w.isTicketIssued,
      departureRescheduled: w.departureRescheduled,
      returnRescheduled: w.returnRescheduled,
      paidPriceDeparture: paidDep,
      paidPriceReturn: paidRet,
      paidPriceTotal: paidTotal,
      smilesPoints: w.smilesPoints ?? null,
      latamPassPoints: w.latamPassPoints ?? null,
      totalMiles: totalMiles > 0 ? totalMiles : null,
      month: parseMonth(w.departureDate),
    };
  });
}

/**
 * Agrega dados financeiros por mês para um dado ano.
 */
export async function getFinancialSummaryByMonth(
  year: number
): Promise<MonthSummary[]> {
  const weekData = await getFinancialDataByYear(year);
  const issued = weekData.filter(w => w.isTicketIssued === 1);

  const monthMap = new Map<number, MonthSummary>();

  for (const w of issued) {
    const m = w.month;
    if (!monthMap.has(m)) {
      monthMap.set(m, {
        month: m,
        year,
        totalCashBRL: 0,
        totalSmilesPoints: 0,
        totalLatamPassPoints: 0,
        totalMiles: 0,
        weeksCount: 0,
        issuedCount: 0,
        avgCashBRL: 0,
        byAirline: {},
      });
    }
    const ms = monthMap.get(m)!;
    ms.issuedCount++;
    ms.weeksCount++;

    const cash = w.paidPriceTotal ?? 0;
    ms.totalCashBRL += cash;
    ms.totalSmilesPoints += w.smilesPoints ?? 0;
    ms.totalLatamPassPoints += w.latamPassPoints ?? 0;
    ms.totalMiles += w.totalMiles ?? 0;

    // Agrega por companhia (usa a companhia de ida como referência)
    const airline = w.departureAirline ?? "desconhecida";
    if (!ms.byAirline[airline]) {
      ms.byAirline[airline] = { cashBRL: 0, miles: 0, count: 0 };
    }
    ms.byAirline[airline].cashBRL += cash;
    ms.byAirline[airline].miles += w.totalMiles ?? 0;
    ms.byAirline[airline].count++;
  }

  // Calcular médias
  monthMap.forEach(ms => {
    ms.avgCashBRL = ms.issuedCount > 0 ? ms.totalCashBRL / ms.issuedCount : 0;
  });

  const result: MonthSummary[] = [];
  monthMap.forEach(ms => result.push(ms));
  return result.sort((a, b) => a.month - b.month);
}

/**
 * Agrega dados financeiros para o ano inteiro.
 */
export async function getFinancialYearSummary(
  year: number
): Promise<YearSummary> {
  const byMonth = await getFinancialSummaryByMonth(year);
  const weekData = await getFinancialDataByYear(year);
  const issued = weekData.filter(w => w.isTicketIssued === 1);

  const byAirline: Record<string, { cashBRL: number; miles: number; count: number }> = {};

  for (const ms of byMonth) {
    for (const [airline, data] of Object.entries(ms.byAirline)) {
      if (!byAirline[airline]) byAirline[airline] = { cashBRL: 0, miles: 0, count: 0 };
      byAirline[airline].cashBRL += data.cashBRL;
      byAirline[airline].miles += data.miles;
      byAirline[airline].count += data.count;
    }
  }

  const totalCashBRL = byMonth.reduce((s, m) => s + m.totalCashBRL, 0);
  const totalSmilesPoints = byMonth.reduce((s, m) => s + m.totalSmilesPoints, 0);
  const totalLatamPassPoints = byMonth.reduce((s, m) => s + m.totalLatamPassPoints, 0);
  const totalMiles = byMonth.reduce((s, m) => s + m.totalMiles, 0);
  const issuedCount = issued.length;

  return {
    year,
    totalCashBRL,
    totalSmilesPoints,
    totalLatamPassPoints,
    totalMiles,
    weeksCount: weekData.length,
    issuedCount,
    avgCashBRL: issuedCount > 0 ? totalCashBRL / issuedCount : 0,
    byAirline,
    byMonth,
  };
}
