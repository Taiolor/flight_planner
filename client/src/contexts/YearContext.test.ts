import { describe, expect, it } from "vitest";
import {
  AVAILABLE_PLANNING_YEARS,
  DEFAULT_PLANNING_YEAR,
  normalizePlanningYear,
} from "./YearContext";

describe("YearContext", () => {
  it("aceita os anos de planejamento configurados", () => {
    expect(normalizePlanningYear(2027)).toBe(2027);
    expect(normalizePlanningYear(AVAILABLE_PLANNING_YEARS.at(-1))).toBe(2030);
  });

  it("retorna o plano padrão para anos inválidos", () => {
    expect(normalizePlanningYear(2025)).toBe(DEFAULT_PLANNING_YEAR);
    expect(normalizePlanningYear(undefined)).toBe(DEFAULT_PLANNING_YEAR);
  });
});
