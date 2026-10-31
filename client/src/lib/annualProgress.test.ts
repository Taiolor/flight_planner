import { describe, expect, it } from "vitest";
import { getAnnualProgress } from "./annualProgress";

describe("progresso anual de planejamento", () => {
  const now = new Date(2026, 7, 19);

  it("calcula semanas emitidas, pendentes e urgentes sem incluir semanas removidas", () => {
    const progress = getAnnualProgress(
      [
        { departureDate: "24/08/2026", isTicketIssued: 0 },
        { departureDate: "20/09/2026", isTicketIssued: 0 },
        { departureDate: "10/08/2026", isTicketIssued: 1 },
        { departureDate: "26/08/2026", isTicketIssued: 0, isDeleted: 1 },
      ],
      now
    );

    expect(progress).toEqual({
      totalWeeks: 3,
      issuedWeeks: 1,
      pendingWeeks: 2,
      urgentWeeks: 1,
      completionPercent: 33,
    });
  });

  it("retorna progresso vazio quando não houver semanas ativas", () => {
    expect(getAnnualProgress([], now)).toEqual({
      totalWeeks: 0,
      issuedWeeks: 0,
      pendingWeeks: 0,
      urgentWeeks: 0,
      completionPercent: 0,
    });
  });
});
