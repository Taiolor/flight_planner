import { describe, expect, it } from "vitest";
import { buildOperationalInsights } from "./operationalInsights";

describe("buildOperationalInsights", () => {
  it("prioriza compra urgente, retorno ausente e crédito próximo ao vencimento", () => {
    const decisions = buildOperationalInsights(
      [
        { weekNumber: 8, departureDate: "2026-08-30", returnDate: "2026-09-04", isTicketIssued: 0, isDeleted: 0, ticketType: "roundtrip", returnFlightDatetime: null, returnCancelled: 0 },
        { weekNumber: 9, departureDate: "2026-09-06", returnDate: "2026-09-11", isTicketIssued: 1, isDeleted: 0, ticketType: "roundtrip", returnFlightDatetime: null, returnCancelled: 0 },
      ],
      [],
      [{ id: 4, airline: "Latam", creditType: "voucher", availableCents: 50000, expiresAt: new Date("2026-09-02T12:00:00"), status: "ativo", linkedWeekNumber: null }],
      new Map(),
      new Date("2026-08-25T12:00:00")
    );

    expect(decisions.map(decision => decision.id)).toEqual([
      "purchase-8",
      "conflict-9",
      "credit-4",
    ]);
  });
});
