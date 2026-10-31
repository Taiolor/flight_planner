import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getAllFlightWeeks: vi.fn(),
  makeRequest: vi.fn(),
}));

vi.mock("./db", () => ({ getAllFlightWeeks: state.getAllFlightWeeks }));
vi.mock("./_core/map", () => ({ makeRequest: state.makeRequest }));

import { extractTravelOrigin, getFlyIaTravelGuidanceAnswer } from "./flyIaTravelGuidance";
import { getAirportAddress } from "../shared/airportAddresses";

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

const question = [{
  role: "user" as const,
  content: "Quanto tempo eu demoro para chegar no aeroporto, saindo da Paulista, São Paulo?",
}];

const directions = {
  routes: [{ legs: [{
    distance: { text: "32 km", value: 32000 },
    duration: { text: "55 min", value: 3300 },
    duration_in_traffic: { text: "1 h 10 min", value: 4200 },
  }] }],
};

beforeEach(() => {
  // O voo da fixture precisa ser futuro independentemente do dia em que a CI roda.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-25T12:00:00-03:00"));
  state.getAllFlightWeeks.mockResolvedValue(issuedGruFlight);
  state.makeRequest.mockResolvedValue(directions);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  state.getAllFlightWeeks.mockReset();
  state.makeRequest.mockReset();
});

describe("flyIaTravelGuidance", () => {
  it("extrai a origem somente de perguntas explícitas de deslocamento", () => {
    expect(extractTravelOrigin([{ role: "user", content: "Quanto tempo eu demoro para chegar no aeroporto, saindo do local Paulista, São Paulo?" }])).toBe("Paulista, São Paulo");
    expect(extractTravelOrigin([{ role: "user", content: "Qual é meu próximo voo?" }])).toBeNull();
  });

  it("consulta a rota externa e preserva a data e a hora da base SmartFly", async () => {
    const originalFlight = structuredClone(issuedGruFlight);
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(state.getAllFlightWeeks).toHaveBeenCalledWith(2026);
    expect(state.makeRequest).toHaveBeenCalledWith("/maps/api/directions/json", expect.objectContaining({
      origin: "Paulista, São Paulo",
      destination: getAirportAddress("GRU"),
      mode: "driving",
      departure_time: Math.floor(Date.now() / 1000),
    }));
    expect(answer?.response).toContain("1 h 10 min");
    expect(answer?.response).toContain("26/10/2026 às 22:05");
    expect(answer?.response).toContain("Google Maps — rotas");
    expect(answer?.response).toContain("não altera a data, a hora ou o status cadastrados");
    const routeUrl = new URL(answer?.routeUrl ?? "");
    expect(routeUrl.origin).toBe("https://www.google.com");
    expect(routeUrl.pathname).toBe("/maps/dir/");
    expect(routeUrl.searchParams.get("origin")).toBe("Paulista, São Paulo");
    expect(routeUrl.searchParams.get("travelmode")).toBe("driving");
    expect(issuedGruFlight).toEqual(originalFlight);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("devolve uma falha segura se a rota externa não responder e limpa o timeout", async () => {
    state.makeRequest.mockRejectedValue(new Error("offline"));
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(state.makeRequest).toHaveBeenCalledOnce();
    expect(answer?.response).toContain("Não consegui consultar a estimativa de rota agora");
    expect(answer?.routeUrl).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["passado", { departureFlightDatetime: "2026-10-24T22:05" }],
    ["cancelado", { departureCancelled: 1 }],
    ["excluído", { isDeleted: 1 }],
    ["não emitido", { isTicketIssued: 0 }],
  ])("não consulta rota para voo %s", async (_name, changes) => {
    state.getAllFlightWeeks.mockResolvedValue([{ ...issuedGruFlight[0], ...changes }]);
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(answer?.response).toContain("Não há um próximo voo emitido e ativo");
    expect(state.makeRequest).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passa a usar o próximo voo futuro quando o calendário avança", async () => {
    vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
    state.getAllFlightWeeks.mockResolvedValue([
      issuedGruFlight[0],
      { ...issuedGruFlight[0], weekNumber: 18, departureFlightDatetime: "2026-11-02T09:30" },
    ]);
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(answer?.response).toContain("02/11/2026 às 09:30");
    expect(answer?.response).not.toContain("26/10/2026 às 22:05");
    expect(state.makeRequest).toHaveBeenCalledOnce();
  });

  it("considera a volta futura e o aeroporto correto quando a ida já passou", async () => {
    vi.setSystemTime(new Date("2026-11-01T12:00:00-03:00"));
    state.getAllFlightWeeks.mockResolvedValue([{
      ...issuedGruFlight[0],
      ticketType: "roundtrip",
      returnFlightDatetime: "2026-11-03T10:00",
      returnAirline: "LATAM",
    }]);
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(answer?.response).toContain("03/11/2026 às 10:00");
    expect(state.makeRequest).toHaveBeenCalledWith("/maps/api/directions/json", expect.objectContaining({
      destination: getAirportAddress("NVT"),
    }));
  });

  it("não consulta banco ou mapas para perguntas sem origem de deslocamento", async () => {
    await expect(getFlyIaTravelGuidanceAnswer(2026, [{ role: "user", content: "Qual é meu próximo voo?" }])).resolves.toBeNull();
    expect(state.getAllFlightWeeks).not.toHaveBeenCalled();
    expect(state.makeRequest).not.toHaveBeenCalled();
  });

  it("retorna uma falha segura quando não existe rota disponível", async () => {
    state.makeRequest.mockResolvedValue({ routes: [] });
    const answer = await getFlyIaTravelGuidanceAnswer(2026, question);

    expect(answer?.response).toContain("Não consegui consultar a estimativa de rota agora");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("interrompe a espera após dez segundos quando o serviço de mapas não conclui", async () => {
    state.makeRequest.mockImplementation(() => new Promise(() => {}));
    const answerPromise = getFlyIaTravelGuidanceAnswer(2026, question);
    await vi.advanceTimersByTimeAsync(9999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(answerPromise).resolves.toMatchObject({
      response: expect.stringContaining("Não consegui consultar a estimativa de rota agora"),
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
