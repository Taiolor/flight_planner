/**
 * financial.ts
 * tRPC router para a página de Gestão Financeira.
 * Expõe endpoints de agregação financeira (por semana, mês, ano) e projeções.
 */
import { protectedProcedure, router } from "../_core/trpc";
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
  1: 1.25,  // Janeiro – alta temporada (verão/férias)
  2: 1.15,  // Fevereiro – Carnaval
  3: 0.90,  // Março – baixa temporada
  4: 0.85,  // Abril – baixa temporada
  5: 0.88,  // Maio – baixa temporada
  6: 1.05,  // Junho – Festa Junina, férias escolares
  7: 1.20,  // Julho – férias escolares
  8: 0.85,  // Agosto – baixa temporada
  9: 0.85,  // Setembro – baixa temporada
  10: 0.90, // Outubro – baixa temporada
  11: 1.05, // Novembro – Black Friday
  12: 1.25, // Dezembro – alta temporada (festas)
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const financialRouter = router({
  /**
   * Retorna todos os dados financeiros por semana para um dado ano.
   */
  getWeeklyData: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2030).default(2026) }))
    .query(async ({ input }) => {
      return getFinancialDataByYear(input.year);
    }),

  /**
   * Retorna o resumo financeiro por mês para um dado ano.
   */
  getMonthlySummary: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2030).default(2026) }))
    .query(async ({ input }) => {
      return getFinancialSummaryByMonth(input.year);
    }),

  /**
   * Retorna o resumo financeiro anual completo (inclui por mês e por companhia).
   */
  getYearSummary: protectedProcedure
    .input(z.object({ year: z.number().int().min(2020).max(2030).default(2026) }))
    .query(async ({ input }) => {
      return getFinancialYearSummary(input.year);
    }),

  /**
   * Retorna projeções financeiras para o próximo ano.
   * Considera: média histórica, sazonalidade, inflação e frequência de viagens.
   */
  getProjections: protectedProcedure
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

      // Média de gasto por viagem no ano base (apenas viagens com preço registrado)
      const weeksWithPrice = (await getFinancialDataByYear(baseYear)).filter(
        w => w.isTicketIssued === 1 && w.paidPriceTotal !== null && w.paidPriceTotal > 0
      );

      const avgPricePerTrip =
        weeksWithPrice.length > 0
          ? weeksWithPrice.reduce((s, w) => s + (w.paidPriceTotal ?? 0), 0) /
            weeksWithPrice.length
          : 0;

      // Média de milhas por viagem no ano base
      const weeksWithMiles = (await getFinancialDataByYear(baseYear)).filter(
        w => w.isTicketIssued === 1 && (w.totalMiles ?? 0) > 0
      );
      const avgMilesPerTrip =
        weeksWithMiles.length > 0
          ? weeksWithMiles.reduce((s, w) => s + (w.totalMiles ?? 0), 0) /
            weeksWithMiles.length
          : 0;

      // Gerar projeção por mês para o ano alvo
      const projectedMonths = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const seasonFactor = SEASONALITY_FACTORS[month] ?? 1.0;
        const inflationFactor = 1 + inflationRate;

        // Preço base ajustado por inflação e sazonalidade
        const projectedPricePerTrip = avgPricePerTrip * inflationFactor * seasonFactor;
        const projectedMilesPerTrip = avgMilesPerTrip * seasonFactor;

        // Histórico do mês no ano base (para comparação)
        const historicMonth = monthData.find(m => m.month === month);
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
              ? ((projectedPricePerTrip * tripsPerMonth - historicCash) / historicCash) * 100
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
