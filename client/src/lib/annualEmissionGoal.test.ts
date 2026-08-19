// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  getAnnualGoalProgress,
  readAnnualEmissionGoal,
  saveAnnualEmissionGoal,
} from "./annualEmissionGoal";

describe("meta anual de emissões", () => {
  beforeEach(() => window.localStorage.clear());

  it("persiste a meta por ano e respeita o limite de semanas disponíveis", () => {
    expect(saveAnnualEmissionGoal(2026, 35, 44)).toBe(35);
    expect(readAnnualEmissionGoal(2026, 44)).toBe(35);
    expect(readAnnualEmissionGoal(2027, 44)).toBe(44);
    expect(saveAnnualEmissionGoal(2026, 99, 44)).toBe(44);
  });

  it("calcula emissões restantes e a conclusão da meta", () => {
    expect(getAnnualGoalProgress(28, 35)).toEqual({
      percent: 80,
      remaining: 7,
      achieved: false,
    });
    expect(getAnnualGoalProgress(36, 35)).toEqual({
      percent: 100,
      remaining: 0,
      achieved: true,
    });
  });
});
