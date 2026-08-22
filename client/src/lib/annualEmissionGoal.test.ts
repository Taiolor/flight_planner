// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  getAnnualGoalPace,
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

  it("compara o ritmo atual com o avanço esperado no exercício", () => {
    expect(getAnnualGoalPace(2026, 80, new Date("2026-08-22T12:00:00"))).toMatchObject({
      expectedPercent: 64,
      deltaPercentagePoints: 16,
      label: "16 p.p. acima do ritmo esperado.",
    });
    expect(getAnnualGoalPace(2027, 0, new Date("2026-08-22T12:00:00"))).toMatchObject({
      expectedPercent: null,
      label: "Exercício futuro: a meta começa a ser acompanhada no próximo ano.",
    });
  });
});
