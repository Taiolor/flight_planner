import { describe, expect, it, vi } from "vitest";
import {
  persistWeeklyPlanningFavorites,
  readWeeklyPlanningFavorites,
  toggleWeeklyPlanningFavorite,
  WEEKLY_PLANNING_FAVORITES_STORAGE_KEY,
} from "./weeklyPlanningPreferences";

describe("favoritos do planejamento semanal", () => {
  it("restaura apenas números de semana válidos e não repetidos", () => {
    const storage = { getItem: vi.fn().mockReturnValue("[18, 18, 0, 54, 21]") };
    expect(readWeeklyPlanningFavorites(storage)).toEqual([18, 21]);
  });

  it("alterna e persiste uma semana favorita", () => {
    const storage = { setItem: vi.fn() };
    const favorites = toggleWeeklyPlanningFavorite([18], 21);

    expect(favorites).toEqual([18, 21]);
    expect(toggleWeeklyPlanningFavorite(favorites, 18)).toEqual([21]);
    persistWeeklyPlanningFavorites(favorites, storage);
    expect(storage.setItem).toHaveBeenCalledWith(
      WEEKLY_PLANNING_FAVORITES_STORAGE_KEY,
      "[18,21]"
    );
  });
});
