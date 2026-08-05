/**
 * financial.ts
 * tRPC router para a página de Gestão Financeira.
 * Expõe endpoints de agregação financeira (por semana, mês, ano) e projeções.
 */
import { router } from "../_core/trpc";
import { flightProtectedProcedure } from "../flightAuthMiddleware";
import { z } from "zod";
import {
  getFinancialDataByYear,
  getFinancialSummaryByMonth,
  getFinancialYearSummary,
  type WeekFinancialData,
  type MonthSummary,
  type YearSummary,
} from "../financialDb";

// ─── Constantes de projeção ───────────────────────────────────────────────────

// Índice de inflação acumulado estimado para 2027 (IPCA ~5%)
const INFLATION_RATE_DEFAULT = 0.05;

// Sazonalidade por mês: fator multiplicador sobre a média anual
// Baseado em padrões históricos de passagens aéreas no Brasil
const SEASONALITY_FACTORS: Record<number, number> = {
  1: 1.25, // Janeiro – alta temporada (verão/férias)
  2: 1.15, // Fevereiro – Carnaval
  3: 0.9, // Março – baixa temporada
  4: 0.85, // Abril – baixa temporada
  5: 0.88, // Maio – baixa temporada
  6: 1.05, // Junho – Festa Junina, férias escolares
  7: 1.2, // Julho – férias escolares
  8: 0.85, // Agosto – baixa temporada
  9: 0.85, // Setembro – baixa temporada
  10: 0.9, // Outubro – baixa temporada
  11: 1.05, // Novembro – Black Friday
  12: 1.25, // Dezembro – alta temporada (festas)
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const financialRouter = router({
  /**
   * Retorna todos os dados financeiros por semana para um dado ano.
   */
  getWeeklyData: flightProtectedProcedure
    .input(
      z.object({ year: z.number().int().min(2020).max(2030).default(2026) })
    )
    .query(async ({ input }) => {
      return getFinancialDataByYear(input.year);
    }),

  /**
   * Retorna o resumo financeiro por mês para um dado ano.
   */
  getMonthlySummary: flightProtectedProcedure
    .input(
      z.object({ year: z.number().int().min(2020).max(2030).default(2026) })
    )
    .query(async ({ input }) => {
      return getFinancialSummaryByMonth(input.year);
    }),

  /**
   * Retorna o resumo financeiro anual completo (inclui por mês e por companhia).
   */
  getYearSummary: flightProtectedProcedure
    .input(
      z.object({ year: z.number().int().min(2020).max(2030).default(2026) })
    )
    .query(async ({ input }) => {
      return getFinancialYearSummary(input.year);
    }),

  /**
   * Retorna projeções financeiras para o próximo ano.
   * Considera: média histórica, sazonalidade, inflação e frequência de viagens.
   */
  getProjections: flightProtectedProcedure
    .input(
      z.object({
        baseYear: z.number().int().min(2020).max(2030).default(2026),
        targetYear: z.number().int().min(2021).max(2031).default(2027),
        inflationRate: z.number().min(0).max(1).default(INFLATION_RATE_DEFAULT),
        // Frequência esperada de viagens por mês no próximo ano
        tripsPerMonth: z.number().min(0).max(10).default(4),
      })
    )
    .query(async ({ input }) => {
      const { baseYear, targetYear, inflationRate, tripsPerMonth } = input;

      const yearSummary = await getFinancialYearSummary(baseYear);
      const monthData = yearSummary.byMonth;

      // ⚡ Bolt Optimization: Eagerly initialize a Map for O(1) lookups instead of O(N) array .find() calls
      const monthDataMap = new Map(monthData.map(m => [m.month, m]));

      // Média de gasto por viagem no ano base (apenas viagens com preço registrado)
      // ⚡ Bolt Optimization: Cache getFinancialDataByYear to avoid duplicate DB calls and combine loops
      const baseYearData = await getFinancialDataByYear(baseYear);

      let priceTotal = 0;
      let priceCount = 0;
      let milesTotal = 0;
      let milesCount = 0;

      for (const w of baseYearData) {
        if (w.isTicketIssued === 1) {
          if (w.paidPriceTotal !== null && w.paidPriceTotal > 0) {
            priceTotal += w.paidPriceTotal;
            priceCount++;
          }
          if ((w.totalMiles ?? 0) > 0) {
            milesTotal += w.totalMiles ?? 0;
            milesCount++;
          }
        }
      }

      const avgPricePerTrip = priceCount > 0 ? priceTotal / priceCount : 0;
      const avgMilesPerTrip = milesCount > 0 ? milesTotal / milesCount : 0;

      // Gerar projeção por mês para o ano alvo
      const projectedMonths = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const seasonFactor = SEASONALITY_FACTORS[month] ?? 1.0;
        const inflationFactor = 1 + inflationRate;

        // Preço base ajustado por inflação e sazonalidade
        const projectedPricePerTrip =
          avgPricePerTrip * inflationFactor * seasonFactor;
        const projectedMilesPerTrip = avgMilesPerTrip * seasonFactor;

        // Histórico do mês no ano base (para comparação)
        const historicMonth = monthDataMap.get(month);
        const historicCash = historicMonth?.totalCashBRL ?? 0;
        const historicMiles = historicMonth?.totalMiles ?? 0;
        const historicTrips = historicMonth?.issuedCount ?? 0;

        return {
          month,
          targetYear,
          projectedTrips: tripsPerMonth,
          projectedCashBRL: projectedPricePerTrip * tripsPerMonth,
          projectedMiles: projectedMilesPerTrip * tripsPerMonth,
          seasonFactor,
          inflationFactor,
          avgPricePerTrip: projectedPricePerTrip,
          // Comparativo com histórico
          historicCash,
          historicMiles,
          historicTrips,
          variationVsHistoric:
            historicCash > 0
              ? ((projectedPricePerTrip * tripsPerMonth - historicCash) /
                  historicCash) *
                100
              : null,
        };
      });

      const totalProjectedCash = projectedMonths.reduce(
        (s, m) => s + m.projectedCashBRL,
        0
      );
      const totalProjectedMiles = projectedMonths.reduce(
        (s, m) => s + m.projectedMiles,
        0
      );
      const totalProjectedTrips = tripsPerMonth * 12;

      return {
        targetYear,
        baseYear,
        inflationRate,
        tripsPerMonth,
        avgPricePerTripBase: avgPricePerTrip,
        avgMilesPerTripBase: avgMilesPerTrip,
        totalProjectedCash,
        totalProjectedMiles,
        totalProjectedTrips,
        byMonth: projectedMonths,
        // Resumo do ano base para comparação
        baseSummary: {
          totalCashBRL: yearSummary.totalCashBRL,
          totalMiles: yearSummary.totalMiles,
          issuedCount: yearSummary.issuedCount,
          avgCashBRL: yearSummary.avgCashBRL,
        },
      };
    }),
});
