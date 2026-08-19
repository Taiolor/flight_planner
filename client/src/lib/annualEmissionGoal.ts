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

export function getAnnualGoalProgress(issuedWeeks: number, goal: number) {
  if (goal <= 0) return { percent: 0, remaining: 0, achieved: false };
  const remaining = Math.max(goal - issuedWeeks, 0);
  return {
    percent: Math.min(100, Math.round((issuedWeeks / goal) * 100)),
    remaining,
    achieved: issuedWeeks >= goal,
  };
}
