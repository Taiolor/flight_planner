import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb }));

import { getPublicAdditionalFlightsForCalendar } from "./additionalFlightsDb";

function createDatabaseMock() {
  const database = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  };
  database.select.mockReturnValue(database);
  database.from.mockReturnValue(database);
  return database;
}

describe("getPublicAdditionalFlightsForCalendar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta apenas passagens emitidas e retorna a projeção pública do calendário", async () => {
    const database = createDatabaseMock();
    database.where.mockResolvedValue([
      {
        id: 12,
        weekNumber: 35,
        isTicketIssued: 1,
        ticketType: "oneway",
        departureAirline: "latam",
        returnAirline: null,
        departureFlightDatetime: "2026-10-25T08:00",
        returnFlightDatetime: null,
        departureAirport: "GRU",
        returnAirport: null,
        departureRescheduled: 0,
        returnRescheduled: 0,
        departureCancelled: 0,
        returnCancelled: 0,
      },
    ]);
    getDb.mockResolvedValue(database);

    const result = await getPublicAdditionalFlightsForCalendar(2026);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 12,
      weekNumber: 35,
      isTicketIssued: 1,
      departureFlightDatetime: "2026-10-25T08:00",
    });
    expect(result[0]).not.toHaveProperty("departureLocator");
    expect(result[0]).not.toHaveProperty("departureFlightNumber");
    expect(result[0]).not.toHaveProperty("departureTerminal");
    expect(result[0]).not.toHaveProperty("paidPriceCents");
  });
});
