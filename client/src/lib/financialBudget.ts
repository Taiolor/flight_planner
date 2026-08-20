export type BudgetedWeek = {
  month: number;
  isTicketIssued: number;
  paidPriceTotal: number | null;
};

export type MonthlyBudgetInput = {
  month: number;
  budgetCents: number;
};

export type MonthlyBudgetEnvelope = {
  month: number;
  budgetCents: number;
  realizedCents: number;
  projectedCents: number;
  pendingWithoutQuoteCount: number;
  varianceCents: number | null;
  status: "unconfigured" | "healthy" | "watch" | "exceeded";
};

export type BudgetInsight = {
  totalBudgetCents: number;
  totalRealizedCents: number;
  totalProjectedCents: number;
  pendingWithoutQuoteCount: number;
  largestPressureMonth: number | null;
  status: "unconfigured" | "healthy" | "watch" | "exceeded";
};

export type BudgetAlert = {
  month: number;
  status: "watch" | "exceeded";
  utilizationPercent: number;
};

function toCents(value: number | null): number {
  if (value === null || !Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

export function buildMonthlyBudgetEnvelopes(
  weeks: BudgetedWeek[],
  budgets: MonthlyBudgetInput[]
): MonthlyBudgetEnvelope[] {
  const budgetByMonth = new Map(budgets.map(budget => [budget.month, budget.budgetCents]));

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    let realizedCents = 0;
    let projectedPendingCents = 0;
    let pendingWithoutQuoteCount = 0;

    for (const week of weeks) {
      if (week.month !== month) continue;
      const priceCents = toCents(week.paidPriceTotal);
      if (week.isTicketIssued === 1) {
        realizedCents += priceCents;
      } else if (priceCents > 0) {
        projectedPendingCents += priceCents;
      } else {
        pendingWithoutQuoteCount++;
      }
    }

    const budgetCents = budgetByMonth.get(month) ?? 0;
    const projectedCents = realizedCents + projectedPendingCents;
    const varianceCents = budgetCents > 0 ? projectedCents - budgetCents : null;
    const utilization = budgetCents > 0 ? projectedCents / budgetCents : 0;
    const status =
      budgetCents === 0
        ? "unconfigured"
        : utilization > 1
          ? "exceeded"
          : utilization >= 0.9
            ? "watch"
            : "healthy";

    return {
      month,
      budgetCents,
      realizedCents,
      projectedCents,
      pendingWithoutQuoteCount,
      varianceCents,
      status,
    };
  });
}

export function getBudgetInsight(envelopes: MonthlyBudgetEnvelope[]): BudgetInsight {
  let totalBudgetCents = 0;
  let totalRealizedCents = 0;
  let totalProjectedCents = 0;
  let pendingWithoutQuoteCount = 0;
  let largestPressureMonth: number | null = null;
  let largestPressureCents = 0;

  for (const envelope of envelopes) {
    totalBudgetCents += envelope.budgetCents;
    totalRealizedCents += envelope.realizedCents;
    totalProjectedCents += envelope.projectedCents;
    pendingWithoutQuoteCount += envelope.pendingWithoutQuoteCount;
    if ((envelope.varianceCents ?? 0) > largestPressureCents) {
      largestPressureCents = envelope.varianceCents ?? 0;
      largestPressureMonth = envelope.month;
    }
  }

  const utilization = totalBudgetCents > 0 ? totalProjectedCents / totalBudgetCents : 0;
  const status =
    totalBudgetCents === 0
      ? "unconfigured"
      : utilization > 1
        ? "exceeded"
        : utilization >= 0.9
          ? "watch"
          : "healthy";

  return {
    totalBudgetCents,
    totalRealizedCents,
    totalProjectedCents,
    pendingWithoutQuoteCount,
    largestPressureMonth,
    status,
  };
}

export function getBudgetAlerts(
  envelopes: MonthlyBudgetEnvelope[]
): BudgetAlert[] {
  return envelopes
    .filter(
      (envelope): envelope is MonthlyBudgetEnvelope & {
        status: "watch" | "exceeded";
      } => envelope.status === "watch" || envelope.status === "exceeded"
    )
    .map(envelope => ({
      month: envelope.month,
      status: envelope.status,
      utilizationPercent: Math.round(
        (envelope.projectedCents / envelope.budgetCents) * 100
      ),
    }))
    .sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}
