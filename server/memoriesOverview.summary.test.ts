import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  weeks: vi.fn(),
  memories: vi.fn(),
  summaries: vi.fn(),
}));

vi.mock("./db", () => ({ getAllFlightWeeks: mocks.weeks }));
vi.mock("./memoriesDb", () => ({
  getMemoriesForYear: mocks.memories,
  getFlightMemorySummariesForYear: mocks.summaries,
}));
vi.mock("../shared/flightDistance", () => ({
  getFlightDistanceKm: () => 512,
  getSaoPauloDate: () => "2026-03-17",
}));

import { getMemoriesOverview } from "./memoriesOverview";

describe("getMemoriesOverview summaries", () => {
  it("anexa ao cartão a leitura do resumo salvo para a mesma semana", async () => {
    mocks.weeks.mockResolvedValue([
      {
        year: 2026,
        weekNumber: 12,
        isTicketIssued: 1,
        isDeleted: 0,
        departureAirport: "GRU",
        returnAirport: "NVT",
        departureDate: "2026-03-16",
        returnDate: "2026-03-20",
        departureFlightDatetime: "2026-03-16T08:00:00.000Z",
        returnFlightDatetime: "2026-03-20T18:00:00.000Z",
        departureAirline: "Azul",
        returnAirline: "Azul",
        departureFlightNumber: "AD 1234",
        returnFlightNumber: "AD 1235",
        departureCancelled: 0,
        returnCancelled: 0,
        ticketType: "roundtrip",
      },
    ]);
    mocks.memories.mockResolvedValue([]);
    mocks.summaries.mockResolvedValue([
      { id: 3, year: 2026, weekNumber: 12, summary: "Resumo salvo.", model: "gemini-2.5-flash" },
    ]);

    const overview = await getMemoriesOverview(2026);

    expect(overview.trips[0]?.summary).toMatchObject({ id: 3, summary: "Resumo salvo." });
  });
});
