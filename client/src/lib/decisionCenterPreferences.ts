export const DECISION_CENTER_PREFERENCES_KEY_PREFIX =
  "viagens.home.decision-center";

const MAX_RELEVANCE_ADJUSTMENT = 160;
const RELEVANCE_STEP = 40;

export type DecisionCenterPreferences = {
  secondaryQueueOpen: boolean;
  relevanceByWeek: Record<number, number>;
};

const DEFAULT_PREFERENCES: DecisionCenterPreferences = {
  secondaryQueueOpen: false,
  relevanceByWeek: {},
};

function storageKey(year: number) {
  return `${DECISION_CENTER_PREFERENCES_KEY_PREFIX}.${year}.v1`;
}

function sanitizeRelevance(value: unknown): Record<number, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<number, number> = {};
  for (const [week, adjustment] of Object.entries(value as Record<string, unknown>)) {
    const weekNumber = Number(week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) continue;
    if (typeof adjustment !== "number" || !Number.isFinite(adjustment)) continue;
    const normalized = Math.max(
      -MAX_RELEVANCE_ADJUSTMENT,
      Math.min(MAX_RELEVANCE_ADJUSTMENT, Math.round(adjustment / RELEVANCE_STEP) * RELEVANCE_STEP)
    );
    if (normalized !== 0) result[weekNumber] = normalized;
  }
  return result;
}

export function readDecisionCenterPreferences(
  year: number,
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): DecisionCenterPreferences {
  if (!storage) return DEFAULT_PREFERENCES;
  try {
    const raw = storage.getItem(storageKey(year));
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<DecisionCenterPreferences>;
    return {
      secondaryQueueOpen:
        typeof parsed.secondaryQueueOpen === "boolean"
          ? parsed.secondaryQueueOpen
          : DEFAULT_PREFERENCES.secondaryQueueOpen,
      relevanceByWeek: sanitizeRelevance(parsed.relevanceByWeek),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function persistDecisionCenterPreferences(
  year: number,
  preferences: DecisionCenterPreferences,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  if (!storage) return;
  storage.setItem(
    storageKey(year),
    JSON.stringify({
      secondaryQueueOpen: Boolean(preferences.secondaryQueueOpen),
      relevanceByWeek: sanitizeRelevance(preferences.relevanceByWeek),
    })
  );
}

export function adjustDecisionWeekRelevance(
  preferences: DecisionCenterPreferences,
  weekNumber: number,
  direction: "raise" | "lower"
): DecisionCenterPreferences {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    return preferences;
  }
  const current = preferences.relevanceByWeek[weekNumber] ?? 0;
  const next = Math.max(
    -MAX_RELEVANCE_ADJUSTMENT,
    Math.min(MAX_RELEVANCE_ADJUSTMENT, current + (direction === "raise" ? RELEVANCE_STEP : -RELEVANCE_STEP))
  );
  const relevanceByWeek = { ...preferences.relevanceByWeek };
  if (next === 0) delete relevanceByWeek[weekNumber];
  else relevanceByWeek[weekNumber] = next;
  return { ...preferences, relevanceByWeek };
}
