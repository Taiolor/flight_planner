import { describe, expect, it } from "vitest";
import {
  buildMonthlyBudgetEnvelopes,
  getBudgetAlerts,
  getBudgetInsight,
} from "./financialBudget";

describe("envelopes financeiros mensais", () => {
  it("separa o realizado das cotações pendentes e preserva centavos", () => {
    const envelopes = buildMonthlyBudgetEnvelopes(
      [
        { month: 1, isTicketIssued: 1, paidPriceTotal: 1200.45 },
        { month: 1, isTicketIssued: 0, paidPriceTotal: 340.1 },
        { month: 1, isTicketIssued: 0, paidPriceTotal: null },
      ],
      [{ month: 1, budgetCents: 150_000 }]
    );

    expect(envelopes[0]).toMatchObject({
      budgetCents: 150_000,
      realizedCents: 120_045,
      projectedCents: 154_055,
      pendingWithoutQuoteCount: 1,
      varianceCents: 4_055,
      status: "exceeded",
    });
  });

  it("identifica a maior pressão orçamentária sem inventar orçamento ausente", () => {
    const envelopes = buildMonthlyBudgetEnvelopes(
      [
        { month: 1, isTicketIssued: 0, paidPriceTotal: 1000 },
        { month: 2, isTicketIssued: 1, paidPriceTotal: 600 },
      ],
      [
        { month: 1, budgetCents: 80000 },
        { month: 2, budgetCents: 100000 },
      ]
    );

    expect(getBudgetInsight(envelopes)).toMatchObject({
      totalBudgetCents: 180_000,
      totalRealizedCents: 60_000,
      totalProjectedCents: 160_000,
      largestPressureMonth: 1,
      status: "healthy",
    });
    expect(envelopes[2].status).toBe("unconfigured");
  });

  it("retorna alertas somente a partir de 90% do envelope e acima do limite", () => {
    const envelopes = buildMonthlyBudgetEnvelopes(
      [
        { month: 1, isTicketIssued: 1, paidPriceTotal: 900 },
        { month: 2, isTicketIssued: 0, paidPriceTotal: 1200 },
        { month: 3, isTicketIssued: 0, paidPriceTotal: 500 },
      ],
      [
        { month: 1, budgetCents: 100_000 },
        { month: 2, budgetCents: 100_000 },
      ]
    );

    expect(getBudgetAlerts(envelopes)).toEqual([
      { month: 2, status: "exceeded", utilizationPercent: 120 },
      { month: 1, status: "watch", utilizationPercent: 90 },
    ]);
  });
});
