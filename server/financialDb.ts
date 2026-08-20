/**
 * financialDb.ts
 * Helpers de banco de dados para a página de Gestão Financeira.
 * Agrega dados de flight_weeks e flight_prices para análises financeiras.
 */
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  additionalFlights,
  financialMonthlyBudgets,
  flightWeeks,
  flightPrices,
} from "../drizzle/schema";

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
  paidPriceReturn: number | null; // R$ volta
  paidPriceTotal: number | null; // R$ total
  // Milhas
  smilesPoints: number | null;
  latamPassPoints: number | null;
  totalMiles: number | null;
  additionalFlightCount: number;
  additionalPaidPriceTotal: number;
  additionalCashByAirline: Record<string, { cashBRL: number; count: number }>;
  primaryTicketIssued: number;
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

export interface FinancialMonthlyBudgetData {
  month: number;
  budgetCents: number;
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

function roundBRL(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

  const additional = await db
    .select()
    .from(additionalFlights)
    .where(and(eq(additionalFlights.year, year), eq(additionalFlights.isTicketIssued, 1)));
  const additionalByWeek = new Map<number, typeof additional>();
  for (const flight of additional) {
    const rows = additionalByWeek.get(flight.weekNumber) ?? [];
    rows.push(flight);
    additionalByWeek.set(flight.weekNumber, rows);
  }

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

    const additionalForWeek = additionalByWeek.get(w.weekNumber) ?? [];
    const additionalCashByAirline: Record<string, { cashBRL: number; count: number }> = {};
    const additionalPaidPriceCents = additionalForWeek.reduce((sum, flight) => {
      const priceCents = flight.paidPriceCents ?? 0;
      const cashBRL = priceCents / 100;
      if (cashBRL > 0) {
        const airline = flight.departureAirline ?? flight.returnAirline ?? "viagem adicional";
        if (!additionalCashByAirline[airline]) {
          additionalCashByAirline[airline] = { cashBRL: 0, count: 0 };
        }
        additionalCashByAirline[airline].cashBRL = roundBRL(
          additionalCashByAirline[airline].cashBRL + cashBRL
        );
        additionalCashByAirline[airline].count += 1;
      }
      return sum + priceCents;
    }, 0);
    const additionalPaidPriceTotal = additionalPaidPriceCents / 100;
    const additionalSmiles = additionalForWeek.reduce((sum, flight) => sum + (flight.smilesPoints ?? 0), 0);
    const additionalLatam = additionalForWeek.reduce((sum, flight) => sum + (flight.latamPassPoints ?? 0), 0);
    const smilesPoints = (w.smilesPoints ?? 0) + additionalSmiles;
    const latamPassPoints = (w.latamPassPoints ?? 0) + additionalLatam;
    const totalMiles = smilesPoints + latamPassPoints;

    return {
      weekNumber: w.weekNumber,
      year: w.year,
      departureDate: w.departureDate,
      returnDate: w.returnDate,
      departureAirline: depAirline,
      returnAirline: retAirline,
      ticketType: w.ticketType,
      isTicketIssued: w.isTicketIssued || additionalForWeek.length > 0 ? 1 : 0,
      departureRescheduled: w.departureRescheduled,
      returnRescheduled: w.returnRescheduled,
      paidPriceDeparture: paidDep,
      paidPriceReturn: paidRet,
      paidPriceTotal: roundBRL((paidTotal ?? 0) + additionalPaidPriceTotal) || null,
      smilesPoints: smilesPoints > 0 ? smilesPoints : null,
      latamPassPoints: latamPassPoints > 0 ? latamPassPoints : null,
      totalMiles: totalMiles > 0 ? totalMiles : null,
      additionalFlightCount: additionalForWeek.length,
      additionalPaidPriceTotal,
      additionalCashByAirline,
      primaryTicketIssued: w.isTicketIssued,
      month: parseMonth(w.departureDate),
    };
  });
}

/**
 * Agrega dados financeiros por mês para um dado ano.
 */
export async function getFinancialSummaryByMonth(
  year: number,
  prefetchedWeekData?: WeekFinancialData[]
): Promise<MonthSummary[]> {
  const weekData = prefetchedWeekData ?? (await getFinancialDataByYear(year));
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
    ms.issuedCount += w.primaryTicketIssued + w.additionalFlightCount;
    ms.weeksCount++;

    const cash = w.paidPriceTotal ?? 0;
    const primaryCash = roundBRL(Math.max(0, cash - w.additionalPaidPriceTotal));
    ms.totalCashBRL = roundBRL(ms.totalCashBRL + cash);
    ms.totalSmilesPoints += w.smilesPoints ?? 0;
    ms.totalLatamPassPoints += w.latamPassPoints ?? 0;
    ms.totalMiles += w.totalMiles ?? 0;

    // Agrega por companhia (usa a companhia de ida como referência)
    if (w.primaryTicketIssued === 1) {
      const airline = w.departureAirline ?? "desconhecida";
      if (!ms.byAirline[airline]) {
        ms.byAirline[airline] = { cashBRL: 0, miles: 0, count: 0 };
      }
      ms.byAirline[airline].cashBRL = roundBRL(
        ms.byAirline[airline].cashBRL + primaryCash
      );
      ms.byAirline[airline].miles += w.totalMiles ?? 0;
      ms.byAirline[airline].count++;
    }
    for (const [airline, data] of Object.entries(w.additionalCashByAirline)) {
      if (!ms.byAirline[airline]) {
        ms.byAirline[airline] = { cashBRL: 0, miles: 0, count: 0 };
      }
      ms.byAirline[airline].cashBRL = roundBRL(
        ms.byAirline[airline].cashBRL + data.cashBRL
      );
      ms.byAirline[airline].count += data.count;
    }
  }

  // Calcular médias
  monthMap.forEach(ms => {
    ms.avgCashBRL = ms.issuedCount > 0
      ? roundBRL(ms.totalCashBRL / ms.issuedCount)
      : 0;
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
  const weekData = await getFinancialDataByYear(year);
  const byMonth = await getFinancialSummaryByMonth(year, weekData);
  const issued = weekData.filter(w => w.isTicketIssued === 1);

  const byAirline: Record<
    string,
    { cashBRL: number; miles: number; count: number }
  > = {};

  for (const ms of byMonth) {
    for (const [airline, data] of Object.entries(ms.byAirline)) {
      if (!byAirline[airline])
        byAirline[airline] = { cashBRL: 0, miles: 0, count: 0 };
      byAirline[airline].cashBRL = roundBRL(
        byAirline[airline].cashBRL + data.cashBRL
      );
      byAirline[airline].miles += data.miles;
      byAirline[airline].count += data.count;
    }
  }

  // ⚡ Bolt Optimization: Combine four separate .reduce() calls into a single loop to reduce CPU overhead
  let totalCashBRL = 0;
  let totalSmilesPoints = 0;
  let totalLatamPassPoints = 0;
  let totalMiles = 0;

  for (const m of byMonth) {
    totalCashBRL = roundBRL(totalCashBRL + m.totalCashBRL);
    totalSmilesPoints += m.totalSmilesPoints;
    totalLatamPassPoints += m.totalLatamPassPoints;
    totalMiles += m.totalMiles;
  }
  const issuedCount = issued.reduce(
    (sum, week) => sum + week.primaryTicketIssued + week.additionalFlightCount,
    0
  );

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

export async function getFinancialMonthlyBudgets(
  year: number
): Promise<FinancialMonthlyBudgetData[]> {
  const db = await getDb();
  if (!db) return [];

  const budgets = await db
    .select({
      month: financialMonthlyBudgets.month,
      budgetCents: financialMonthlyBudgets.budgetCents,
    })
    .from(financialMonthlyBudgets)
    .where(eq(financialMonthlyBudgets.year, year));

  return budgets.sort((a, b) => a.month - b.month);
}

export async function upsertFinancialMonthlyBudget(
  year: number,
  month: number,
  budgetCents: number
): Promise<FinancialMonthlyBudgetData> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  await db
    .insert(financialMonthlyBudgets)
    .values({ year, month, budgetCents })
    .onDuplicateKeyUpdate({
      set: { budgetCents, updatedAt: new Date() },
    });

  return { month, budgetCents };
}

export function adjustFinancialBudgetCents(
  budgetCents: number,
  adjustmentPercent: number
): number {
  return Math.max(0, Math.round(budgetCents * (1 + adjustmentPercent / 100)));
}

export async function copyFinancialMonthlyBudgets(
  sourceYear: number,
  targetYear: number,
  adjustmentPercent: number
): Promise<{ copiedCount: number; targetYear: number }> {
  if (sourceYear === targetYear) {
    throw new Error("O ano de origem deve ser diferente do ano de destino.");
  }

  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const sourceBudgets = await getFinancialMonthlyBudgets(sourceYear);
  if (sourceBudgets.length === 0) return { copiedCount: 0, targetYear };

  await db
    .insert(financialMonthlyBudgets)
    .values(
      sourceBudgets.map(budget => ({
        year: targetYear,
        month: budget.month,
        budgetCents: adjustFinancialBudgetCents(
          budget.budgetCents,
          adjustmentPercent
        ),
      }))
    )
    .onDuplicateKeyUpdate({
      set: {
        budgetCents: sql`values(${financialMonthlyBudgets.budgetCents})`,
        updatedAt: new Date(),
      },
    });

  return { copiedCount: sourceBudgets.length, targetYear };
}
