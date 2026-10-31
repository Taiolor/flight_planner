export type MonthlyKpiSummary = {
  month: number;
  totalCashBRL: number;
  avgCashBRL: number;
  totalSmilesPoints: number;
  totalLatamPassPoints: number;
};

export type MonthlyKpiComparison = {
  value: number;
  currentMonth: number;
  previousMonth: number;
};

export type MonthlyKpiComparisons = {
  cash: MonthlyKpiComparison | undefined;
  averageCash: MonthlyKpiComparison | undefined;
  smiles: MonthlyKpiComparison | undefined;
  latamPass: MonthlyKpiComparison | undefined;
};

function compareMonths(
  months: MonthlyKpiSummary[],
  metric: keyof Omit<MonthlyKpiSummary, "month">
): MonthlyKpiComparison | undefined {
  const ordered = [...months].sort((left, right) => left.month - right.month);
  if (ordered.length < 2) return undefined;

  const current = ordered.at(-1)!;
  const previous = ordered.at(-2)!;
  const previousValue = previous[metric];
  const currentValue = current[metric];

  if (!Number.isFinite(previousValue) || previousValue <= 0) return undefined;
  if (!Number.isFinite(currentValue)) return undefined;

  return {
    value: ((currentValue - previousValue) / previousValue) * 100,
    currentMonth: current.month,
    previousMonth: previous.month,
  };
}

/** Retorna a variação do último mês com lançamentos frente ao mês anterior disponível. */
export function getLatestMonthlyKpiComparisons(
  months: MonthlyKpiSummary[]
): MonthlyKpiComparisons {
  return {
    cash: compareMonths(months, "totalCashBRL"),
    averageCash: compareMonths(months, "avgCashBRL"),
    smiles: compareMonths(months, "totalSmilesPoints"),
    latamPass: compareMonths(months, "totalLatamPassPoints"),
  };
}
