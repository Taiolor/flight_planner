import { describe, expect, it } from "vitest";
import { getIsoWeekNumber, getWeeklyPlanningWindow } from "./weeklyPlanningWindow";

describe("janela operacional do planejamento semanal", () => {
  it("calcula a semana ISO de referência", () => {
    expect(getIsoWeekNumber(new Date(2026, 0, 14))).toBe(3);
  });

  it("retorna sempre anterior, atual e próxima da semana de referência", () => {
    const weeks = [
      { weekNumber: 2 },
      { weekNumber: 3 },
      { weekNumber: 4 },
      { weekNumber: 5 },
    ];

    expect(getWeeklyPlanningWindow(weeks, 2026, new Date(2026, 0, 14))).toEqual([
      { item: { weekNumber: 2 }, position: "previous" },
      { item: { weekNumber: 3 }, position: "current" },
      { item: { weekNumber: 4 }, position: "next" },
    ]);
  });

  it("ignora semanas excluídas e usa a primeira disponível fora do ano atual", () => {
    const weeks = [
      { weekNumber: 1, isDeleted: 1 },
      { weekNumber: 2 },
      { weekNumber: 3 },
    ];

    expect(getWeeklyPlanningWindow(weeks, 2027, new Date(2026, 0, 14))).toEqual([
      { item: { weekNumber: 2 }, position: "current" },
      { item: { weekNumber: 3 }, position: "next" },
    ]);
  });
});
