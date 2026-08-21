import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getAllFlightWeeks: vi.fn(),
  makeRequest: vi.fn(),
}));

vi.mock("./db", () => ({ getAllFlightWeeks: state.getAllFlightWeeks }));
vi.mock("./_core/map", () => ({ makeRequest: state.makeRequest }));

import { extractTravelOrigin, getFlyIaTravelGuidanceAnswer } from "./flyIaTravelGuidance";

const issuedGruFlight = [{
  year: 2026,
  weekNumber: 17,
  isTicketIssued: 1,
  isDeleted: 0,
  departureFlightDatetime: "2026-10-26T22:05",
  returnFlightDatetime: null,
  departureAirport: "GRU",
  returnAirport: "NVT",
  departureAirline: "LATAM",
  returnAirline: null,
  departureFlightNumber: "LA1234",
  returnFlightNumber: null,
  departureTerminal: "2",
  returnTerminal: null,
  departureCancelled: 0,
  returnCancelled: 0,
  departureRescheduled: 0,
  returnRescheduled: 0,
  ticketType: "oneway",
}];

afterEach(() => {
  state.getAllFlightWeeks.mockReset();
  state.makeRequest.mockReset();
});

describe("flyIaTravelGuidance", () => {
  it("extrai a origem somente de perguntas explícitas de deslocamento", () => {
    expect(extractTravelOrigin([{ role: "user", content: "Quanto tempo eu demoro para chegar no aeroporto, saindo do local Paulista, São Paulo?" }])).toBe("Paulista, São Paulo");
    expect(extractTravelOrigin([{ role: "user", content: "Qual é meu próximo voo?" }])).toBeNull();
  });

  it("consulta a rota externa e preserva a data e a hora da base SmartFly", async () => {
    state.getAllFlightWeeks.mockResolvedValue(issuedGruFlight);
    state.makeRequest.mockResolvedValue({
      routes: [{ legs: [{ distance: { text: "32 km", value: 32000 }, duration: { text: "55 min", value: 3300 }, duration_in_traffic: { text: "1 h 10 min", value: 4200 } }] }],
    });

    const answer = await getFlyIaTravelGuidanceAnswer(2026, [{ role: "user", content: "Quanto tempo eu demoro para chegar no aeroporto, saindo da Paulista, São Paulo?" }]);

    expect(state.makeRequest).toHaveBeenCalledWith("/maps/api/directions/json", expect.objectContaining({ origin: "Paulista, São Paulo", mode: "driving" }));
    expect(answer).toContain("1 h 10 min");
    expect(answer).toContain("26/10/2026 às 22:05");
    expect(answer).toContain("Google Maps — rotas");
    expect(answer).toContain("não altera a data, a hora ou o status cadastrados");
  });

  it("devolve uma falha segura se a rota externa não responder", async () => {
    state.getAllFlightWeeks.mockResolvedValue(issuedGruFlight);
    state.makeRequest.mockRejectedValue(new Error("offline"));

    await expect(getFlyIaTravelGuidanceAnswer(2026, [{ role: "user", content: "Quanto tempo eu demoro para chegar no aeroporto, saindo da Paulista?" }])).resolves.toContain("Não consegui consultar a estimativa de rota agora");
  });
});
