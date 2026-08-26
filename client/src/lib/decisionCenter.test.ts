import { describe, expect, it } from "vitest";
import { buildDecisionItems, getNextDecisionTrip } from "./decisionCenter";

const now = new Date(2026, 7, 20);

describe("decisionCenter", () => {
  it("prioriza cancelamento, emissão próxima e remarcação de forma explicável", () => {
    const items = buildDecisionItems(
      [
        { weekNumber: 30, departureDate: "30/08/2026", returnDate: "04/09/2026", isDeleted: 0, isTicketIssued: 0, departureAirport: "GRU", returnAirport: "NVT" },
        { weekNumber: 29, departureDate: "24/08/2026", returnDate: "28/08/2026", isDeleted: 0, isTicketIssued: 1, departureAirport: "GRU", returnAirport: "NVT", departureRescheduled: 1 },
        { weekNumber: 28, departureDate: "22/08/2026", returnDate: "24/08/2026", isDeleted: 0, isTicketIssued: 1, departureAirport: "GRU", returnAirport: "NVT", departureCancelled: 1 },
      ],
      { 30: { GOL: "612.35" } },
      now
    );

    expect(items.map(item => item.weekNumber)).toEqual([28, 30, 29]);
    expect(items[0]).toMatchObject({ severity: "critical", destination: "calendar", actionLabel: "Abrir no Calendário" });
    expect(items[1].reason).toContain("Menor preço registrado: R$");
    expect(items[2]).toMatchObject({ severity: "warning", destination: "calendar" });
  });

  it("ignora semanas removidas e não mostra viagens já passadas", () => {
    const items = buildDecisionItems(
      [
        { weekNumber: 1, departureDate: "01/01/2026", returnDate: "03/01/2026", isDeleted: 0, isTicketIssued: 0 },
        { weekNumber: 2, departureDate: "23/08/2026", returnDate: "25/08/2026", isDeleted: 1, isTicketIssued: 0 },
      ],
      {},
      now
    );

    expect(items).toEqual([]);
  });

  it("encontra a próxima viagem com rota e status derivados de dados reais", () => {
    const trip = getNextDecisionTrip(
      [
        { weekNumber: 20, departureDate: "01/06/2026", returnDate: "05/06/2026", isDeleted: 0, isTicketIssued: 1 },
        { weekNumber: 31, departureDate: "06/09/2026", returnDate: "10/09/2026", isDeleted: 0, isTicketIssued: 1, departureAirport: "GRU", returnAirport: "NVT", departureAirline: "GOL" },
      ],
      now
    );

    expect(trip).toEqual(expect.objectContaining({ weekNumber: 31, route: "GRU → NVT", airline: "GOL", status: "issued" }));
  });
});
