import { describe, expect, it } from "vitest";
import { getLatestMonthlyKpiComparisons } from "./monthlyKpiComparison";

describe("getLatestMonthlyKpiComparisons", () => {
  const monthlyData = [
    {
      month: 7,
      totalCashBRL: 1000,
      avgCashBRL: 500,
      totalSmilesPoints: 2000,
      totalLatamPassPoints: 1000,
    },
    {
      month: 8,
      totalCashBRL: 1250,
      avgCashBRL: 400,
      totalSmilesPoints: 1500,
      totalLatamPassPoints: 1500,
    },
  ];

  it("compara o último mês com lançamentos ao mês anterior", () => {
    const comparisons = getLatestMonthlyKpiComparisons(monthlyData);

    expect(comparisons.cash).toMatchObject({
      value: 25,
      currentMonth: 8,
      previousMonth: 7,
    });
    expect(comparisons.averageCash?.value).toBeCloseTo(-20);
    expect(comparisons.smiles?.value).toBeCloseTo(-25);
    expect(comparisons.latamPass?.value).toBeCloseTo(50);
  });

  it("omite uma tendência enganosa quando o mês anterior não tem base de comparação", () => {
    const comparisons = getLatestMonthlyKpiComparisons([
      { ...monthlyData[0], totalCashBRL: 0 },
      monthlyData[1],
    ]);

    expect(comparisons.cash).toBeUndefined();
  });
});
