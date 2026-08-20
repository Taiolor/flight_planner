import { describe, expect, it } from "vitest";
import { areAllMonthsExpanded, getNextExpandedMonths } from "./monthExpansion";

describe("expansão global dos meses", () => {
  const months = ["01", "02", "03"];

  it("identifica quando todos os meses visíveis estão expandidos", () => {
    expect(areAllMonthsExpanded(months, new Set(["01", "02", "03"]))).toBe(true);
    expect(areAllMonthsExpanded(months, new Set(["01"]))).toBe(false);
  });

  it("alterna entre expandir e recolher toda a lista mensal", () => {
    expect([...getNextExpandedMonths(months, new Set(["01"]))]).toEqual(months);
    expect([...getNextExpandedMonths(months, new Set(months))]).toEqual([]);
  });
});
