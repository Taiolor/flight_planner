/**
 * Testes unitários para o módulo de agregação financeira (financialDb.ts)
 * Cobre: getFinancialSummaryByMonth, getFinancialYearSummary e casos de borda
 */

import { describe, it, expect } from "vitest";
import {
  getFinancialSummaryByMonth,
  getFinancialYearSummary,
  type WeekFinancialData,
} from "./financialDb";

const makeWeek = (
  overrides: Partial<WeekFinancialData> = {}
): WeekFinancialData => ({
  weekNumber: 1,
  year: 2026,
  departureDate: "2026-01-04",
  returnDate: "2026-01-09",
  departureAirline: "latam",
  returnAirline: "latam",
  ticketType: "roundtrip",
  isTicketIssued: 1,
  departureRescheduled: 0,
  returnRescheduled: 0,
  paidPriceDeparture: 400,
  paidPriceReturn: 450,
  paidPriceTotal: 850,
  smilesPoints: 0,
  latamPassPoints: 15000,
  totalMiles: 15000,
  month: 1,
  ...overrides,
});

describe("financialDb aggregations", () => {
  describe("getFinancialSummaryByMonth", () => {
    it("deve ignorar semanas com passagens não emitidas (isTicketIssued === 0)", async () => {
      const weeks: WeekFinancialData[] = [
        makeWeek({ weekNumber: 1, month: 1, isTicketIssued: 1, paidPriceTotal: 800 }),
        makeWeek({ weekNumber: 2, month: 1, isTicketIssued: 0, paidPriceTotal: 1200 }),
      ];

      const summary = await getFinancialSummaryByMonth(2026, weeks);

      expect(summary).toHaveLength(1);
      expect(summary[0].month).toBe(1);
      expect(summary[0].issuedCount).toBe(1);
      expect(summary[0].totalCashBRL).toBe(800);
      expect(summary[0].avgCashBRL).toBe(800);
    });

    it("deve agregar múltiplos meses ordenados cronologicamente e agrupar por companhia", async () => {
      const weeks: WeekFinancialData[] = [
        makeWeek({
          weekNumber: 10,
          month: 3,
          departureAirline: "gol",
          paidPriceTotal: 600,
          smilesPoints: 12000,
          latamPassPoints: 0,
          totalMiles: 12000,
        }),
        makeWeek({
          weekNumber: 2,
          month: 1,
          departureAirline: "latam",
          paidPriceTotal: 900,
          smilesPoints: 0,
          latamPassPoints: 18000,
          totalMiles: 18000,
        }),
        makeWeek({
          weekNumber: 3,
          month: 1,
          departureAirline: null,
          paidPriceTotal: 300,
          smilesPoints: 0,
          latamPassPoints: 0,
          totalMiles: null,
        }),
      ];

      const summary = await getFinancialSummaryByMonth(2026, weeks);

      expect(summary.map(m => m.month)).toEqual([1, 3]);
      expect(summary[0].totalCashBRL).toBe(1200);
      expect(summary[0].avgCashBRL).toBe(600);
      expect(summary[0].byAirline["latam"]).toEqual({
        cashBRL: 900,
        miles: 18000,
        count: 1,
      });
      expect(summary[0].byAirline["desconhecida"]).toEqual({
        cashBRL: 300,
        miles: 0,
        count: 1,
      });
    });
  });

  describe("getFinancialYearSummary", () => {
    it("deve consolidar totais anuais de dinheiro, milhas e média por viagem emitida", async () => {
      const weeks: WeekFinancialData[] = [
        makeWeek({
          weekNumber: 1,
          month: 1,
          departureAirline: "latam",
          paidPriceTotal: 1000,
          smilesPoints: 0,
          latamPassPoints: 10000,
          totalMiles: 10000,
        }),
        makeWeek({
          weekNumber: 6,
          month: 2,
          departureAirline: "gol",
          paidPriceTotal: 500,
          smilesPoints: 20000,
          latamPassPoints: 0,
          totalMiles: 20000,
        }),
        makeWeek({
          weekNumber: 7,
          month: 2,
          isTicketIssued: 0,
          paidPriceTotal: 9999,
        }),
      ];

      const yearSummary = await getFinancialYearSummary(2026, weeks);

      expect(yearSummary.year).toBe(2026);
      expect(yearSummary.weeksCount).toBe(3);
      expect(yearSummary.issuedCount).toBe(2);
      expect(yearSummary.totalCashBRL).toBe(1500);
      expect(yearSummary.avgCashBRL).toBe(750);
      expect(yearSummary.totalSmilesPoints).toBe(20000);
      expect(yearSummary.totalLatamPassPoints).toBe(10000);
      expect(yearSummary.totalMiles).toBe(30000);
      expect(yearSummary.byAirline["latam"].cashBRL).toBe(1000);
      expect(yearSummary.byAirline["gol"].miles).toBe(20000);
    });

    it("deve retornar valores zerados sem divisão por zero quando não há semanas emitidas", async () => {
      const yearSummary = await getFinancialYearSummary(2026, []);

      expect(yearSummary.issuedCount).toBe(0);
      expect(yearSummary.totalCashBRL).toBe(0);
      expect(yearSummary.avgCashBRL).toBe(0);
      expect(yearSummary.byMonth).toEqual([]);
      expect(yearSummary.byAirline).toEqual({});
    });
  });
});
