export const WEEKLY_PLANNING_FAVORITES_STORAGE_KEY =
  "viagens.home.weekly-planning-favorites.v1";

export function readWeeklyPlanningFavorites(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): number[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(WEEKLY_PLANNING_FAVORITES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((value): value is number => Number.isInteger(value) && value > 0 && value <= 53))]
      : [];
  } catch {
    return [];
  }
}

export function toggleWeeklyPlanningFavorite(
  favorites: number[],
  weekNumber: number
): number[] {
  return favorites.includes(weekNumber)
    ? favorites.filter(week => week !== weekNumber)
    : [...favorites, weekNumber];
}

export function persistWeeklyPlanningFavorites(
  favorites: number[],
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(
    WEEKLY_PLANNING_FAVORITES_STORAGE_KEY,
    JSON.stringify(favorites)
  );
}
