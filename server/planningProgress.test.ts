import { describe, expect, it } from "vitest";
import { summarizeYearPlanningProgress } from "./planningProgress";

describe("progresso anual de planejamento", () => {
  it("considera somente semanas ativas ao calcular emissões e pendências", () => {
    expect(
      summarizeYearPlanningProgress(2026, [
        { isTicketIssued: 1 },
        { isTicketIssued: 0 },
        { isTicketIssued: 1, isDeleted: 1 },
      ])
    ).toEqual({
      year: 2026,
      totalWeeks: 2,
      issuedWeeks: 1,
      pendingWeeks: 1,
      completionPercent: 50,
    });
  });

  it("mantém anos ainda não iniciados sem divisão por zero", () => {
    expect(summarizeYearPlanningProgress(2028, [])).toEqual({
      year: 2028,
      totalWeeks: 0,
      issuedWeeks: 0,
      pendingWeeks: 0,
      completionPercent: 0,
    });
  });
});
