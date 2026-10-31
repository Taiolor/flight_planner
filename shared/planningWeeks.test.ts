import { describe, expect, it } from "vitest";
import { generatePlanningWeeks } from "./planningWeeks";

describe("generatePlanningWeeks", () => {
  it("gera todas as idas de domingo e retornos de sexta dentro do calendário anual", () => {
    const weeks = generatePlanningWeeks(2027);

    expect(weeks).toHaveLength(52);
    expect(weeks[0]).toMatchObject({
      weekNumber: 1,
      departureDate: "03/01/2027",
      returnDate: "08/01/2027",
      departureDayOfWeek: "Domingo",
      returnDayOfWeek: "Sexta",
    });
    expect(weeks.at(-1)).toMatchObject({
      weekNumber: 52,
      departureDate: "26/12/2027",
      returnDate: "31/12/2027",
    });
    expect(new Set(weeks.map(week => week.weekNumber)).size).toBe(weeks.length);
  });

  it("mantém o calendário correto em anos bissextos", () => {
    const weeks = generatePlanningWeeks(2028);

    expect(weeks[0]?.departureDate).toBe("02/01/2028");
    expect(weeks.every(week => week.departureDayOfWeek === "Domingo")).toBe(true);
    expect(weeks.every(week => week.returnDayOfWeek === "Sexta")).toBe(true);
  });

  it("rejeita anos fora da faixa suportada", () => {
    expect(() => generatePlanningWeeks(2019)).toThrow("Ano de planejamento inválido");
    expect(() => generatePlanningWeeks(2101)).toThrow("Ano de planejamento inválido");
  });
});
