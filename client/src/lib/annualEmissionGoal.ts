export function getAnnualEmissionGoalStorageKey(year: number) {
  return `viagens.annual-emission-goal.${year}`;
}

export function normalizeAnnualEmissionGoal(goal: number, totalWeeks: number) {
  if (totalWeeks <= 0) return 0;
  if (!Number.isFinite(goal)) return totalWeeks;
  return Math.min(totalWeeks, Math.max(1, Math.round(goal)));
}

export function readAnnualEmissionGoal(
  year: number,
  totalWeeks: number,
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  if (!storage) return totalWeeks;
  const raw = storage.getItem(getAnnualEmissionGoalStorageKey(year));
  if (!raw) return totalWeeks;
  return normalizeAnnualEmissionGoal(Number(raw), totalWeeks);
}

export function saveAnnualEmissionGoal(
  year: number,
  goal: number,
  totalWeeks: number,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  const normalized = normalizeAnnualEmissionGoal(goal, totalWeeks);
  storage?.setItem(getAnnualEmissionGoalStorageKey(year), String(normalized));
  return normalized;
}

export type AnnualGoalProgress = {
  percent: number;
  remaining: number;
  achieved: boolean;
};

export type AnnualGoalPace = {
  expectedPercent: number | null;
  deltaPercentagePoints: number | null;
  label: string;
};

export function getAnnualGoalProgress(issuedWeeks: number, goal: number) {
  if (goal <= 0) return { percent: 0, remaining: 0, achieved: false };
  const remaining = Math.max(goal - issuedWeeks, 0);
  return {
    percent: Math.min(100, Math.round((issuedWeeks / goal) * 100)),
    remaining,
    achieved: issuedWeeks >= goal,
  };
}

export function getAnnualGoalPace(
  year: number,
  percent: number,
  today: Date = new Date()
): AnnualGoalPace {
  const currentYear = today.getFullYear();

  if (year > currentYear) {
    return {
      expectedPercent: null,
      deltaPercentagePoints: null,
      label: "Exercício futuro: a meta começa a ser acompanhada no próximo ano.",
    };
  }

  if (year < currentYear) {
    return {
      expectedPercent: null,
      deltaPercentagePoints: null,
      label: `Exercício encerrado com ${percent}% da meta concluída.`,
    };
  }

  const startOfYear = new Date(year, 0, 1).getTime();
  const startOfNextYear = new Date(year + 1, 0, 1).getTime();
  const expectedPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(((today.getTime() - startOfYear) / (startOfNextYear - startOfYear)) * 100)
    )
  );
  const deltaPercentagePoints = percent - expectedPercent;

  if (deltaPercentagePoints >= 5) {
    return {
      expectedPercent,
      deltaPercentagePoints,
      label: `${deltaPercentagePoints} p.p. acima do ritmo esperado.`,
    };
  }

  if (deltaPercentagePoints <= -5) {
    return {
      expectedPercent,
      deltaPercentagePoints,
      label: `${Math.abs(deltaPercentagePoints)} p.p. abaixo do ritmo esperado.`,
    };
  }

  return {
    expectedPercent,
    deltaPercentagePoints,
    label: "No ritmo esperado para a meta anual.",
  };
}
