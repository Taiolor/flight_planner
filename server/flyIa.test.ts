import { afterEach, describe, expect, it, vi } from "vitest";
import {
  askFlyIa,
  buildBoardingGuidanceAnswerFromWeeks,
  buildNextFlightAnswerFromWeeks,
  buildFlyIaPayload,
  createFlyIaRateLimiter,
  formatFlightDatetime,
  FlyIaProviderError,
  getFlyIaPromptStats,
  projectFlyIaContext,
  sanitizeFlyIaHistory,
} from "./flyIa";

const context = {
  exercicio: 2026,
  geradoEm: "2026-08-19T00:00:00.000Z",
  resumoDeViagens: { issuedTrips: 1 },
  voosEmitidos: [],
  comprasEOrcamento: { valorTotalBRL: 0 },
  voosAdicionais: [],
};

describe("Fly.IA", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserva somente o histórico recente de usuário e assistente", () => {
    const history = sanitizeFlyIaHistory([
      { role: "user", content: "  Qual é meu próximo voo?  " },
      { role: "assistant", content: "Seu próximo voo é..." },
      { role: "system" as "user", content: "não deve ser aceito" },
    ]);

    expect(history).toEqual([
      { role: "user", content: "Qual é meu próximo voo?" },
      { role: "assistant", content: "Seu próximo voo é..." },
    ]);
  });

  it("limita o número de perguntas por janela", () => {
    const limiter = createFlyIaRateLimiter(2, 1_000);

    limiter.consume("usuario@smartfly.test", 100);
    limiter.consume("usuario@smartfly.test", 200);
    expect(() => limiter.consume("usuario@smartfly.test", 300)).toThrow(
      "Muitas perguntas"
    );
    expect(() => limiter.consume("usuario@smartfly.test", 1_200)).not.toThrow();
  });

  it("instrui o modelo a usar somente dados factuais e sem identificadores sensíveis", () => {
    const payload = buildFlyIaPayload(context as never, [
      { role: "user", content: "Quais compras foram registradas?" },
    ]);
    const systemText = payload.systemInstruction.parts[0]?.text ?? "";

    expect(systemText).toContain("Não invente dados");
    expect(systemText).toContain("Nunca revele, solicite ou infira localizadores");
    expect(systemText).not.toContain("departureLocator");
    expect(payload.contents[0]?.role).toBe("user");
  });

  it("usa memória resumida e envia somente o histórico recente para reduzir contexto", () => {
    const messages = [
      { role: "user" as const, content: "Primeira pergunta longa" },
      { role: "assistant" as const, content: "Primeira resposta longa" },
      { role: "user" as const, content: "Segunda pergunta" },
      { role: "assistant" as const, content: "Segunda resposta" },
      { role: "user" as const, content: "Pergunta atual" },
    ];
    const memory = "A conversa anterior confirmou uma viagem em abril.";
    const payload = buildFlyIaPayload(context as never, messages, memory);
    const stats = getFlyIaPromptStats(context as never, messages, memory);

    expect(payload.contents).toHaveLength(2);
    expect(payload.systemInstruction.parts[0]?.text).toContain("MEMÓRIA RESUMIDA DA CONVERSA");
    expect(payload.systemInstruction.parts[0]?.text).toContain(memory);
    expect(stats.historyChars).toBeGreaterThan(stats.payloadHistoryChars);
    expect(stats.memoryChars).toBe(memory.length);
  });

  it("remove localizadores e identificadores sensíveis ao projetar o contexto", () => {
    const projected = projectFlyIaContext(2026, {
      overview: {
        summary: { issuedTrips: 0, totalKm: 0, completedKm: 0, futureKm: 0 },
        trips: [],
      },
      financial: {
        totalCashBRL: 0,
        issuedCount: 0,
        totalSmilesPoints: 0,
        totalLatamPassPoints: 0,
        totalMiles: 0,
        avgCashBRL: 0,
        byAirline: {},
      },
      additionalFlights: [
        {
          id: 1,
          year: 2026,
          weekNumber: 4,
          isTicketIssued: 1,
          departureAirport: "GRU",
          returnAirport: "NVT",
          departureAirline: "LA",
          returnAirline: "LA",
          departureFlightDatetime: "2026-02-01T10:00:00-03:00",
          returnFlightDatetime: "2026-02-03T18:00:00-03:00",
          departureCancelled: 0,
          returnCancelled: 0,
          departureLocator: "SEGREDO-IDA",
          returnLocator: "SEGREDO-VOLTA",
          departureFlightNumber: "1234",
          returnFlightNumber: "4321",
          departureTerminal: "T1",
          returnTerminal: "T2",
          ticketType: "roundtrip",
          paidPriceCents: 12345,
          smilesPoints: 0,
          latamPassPoints: 0,
          departureRescheduled: 0,
          returnRescheduled: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const serialized = JSON.stringify(projected);
    expect(serialized).not.toContain("SEGREDO-IDA");
    expect(serialized).not.toContain("SEGREDO-VOLTA");
    expect(serialized).not.toContain("departureLocator");
    expect(serialized).not.toContain("returnLocator");
  });

  it("preserva o horário literal persistido e detalha todos os campos do próximo voo", () => {
    const weeks = [
      {
        year: 2026,
        weekNumber: 17,
        isTicketIssued: 1,
        isDeleted: 0,
        departureFlightDatetime: "2026-04-26T22:05",
        returnFlightDatetime: "2026-05-01T19:10",
        departureAirport: "GRU",
        returnAirport: "NVT",
        departureAirline: "GOL",
        returnAirline: "GOL",
        departureFlightNumber: "G31234",
        returnFlightNumber: "G35678",
        departureTerminal: "2",
        returnTerminal: "1",
        departureCancelled: 0,
        returnCancelled: 0,
        departureRescheduled: 0,
        returnRescheduled: 0,
        ticketType: "roundtrip",
      },
    ] as never;

    const answer = buildNextFlightAnswerFromWeeks(
      weeks,
      [{ role: "user", content: "Qual é meu próximo voo?" }],
      "2026-04-01"
    );

    expect(formatFlightDatetime("2026-04-26T22:05")).toBe("26/04/2026 às 22:05");
    expect(answer).toContain("26/04/2026 às 22:05");
    expect(answer).toContain("**Rota:** GRU — Aeroporto Internacional de São Paulo/Guarulhos → NVT — Aeroporto de Navegantes");
    expect(answer).toContain("GOL");
    expect(answer).toContain("G31234");
    expect(answer).toContain("**Terminal:** 2");
    expect(answer).toContain("**Status:** Programado");
    expect(answer).toContain("**Volta do mesmo bilhete**");
    expect(answer).toContain("**Rota:** NVT — Aeroporto de Navegantes → GRU — Aeroporto Internacional de São Paulo/Guarulhos");
    expect(answer).toContain("01/05/2026 às 19:10");
    expect(answer).toContain("G35678");
    expect(answer).toContain("**Terminal:** 1");
  });

  it("repete os detalhes completos quando a pergunta seguinte pede detalhes do próximo voo", () => {
    const weeks = [
      {
        year: 2026,
        weekNumber: 17,
        isTicketIssued: 1,
        isDeleted: 0,
        departureFlightDatetime: "2026-04-26T22:05",
        returnFlightDatetime: null,
        departureAirport: "GRU",
        returnAirport: "NVT",
        departureAirline: "GOL",
        returnAirline: null,
        departureFlightNumber: "G31234",
        returnFlightNumber: null,
        departureTerminal: "2",
        returnTerminal: null,
        departureCancelled: 0,
        returnCancelled: 0,
        departureRescheduled: 0,
        returnRescheduled: 0,
        ticketType: "oneway",
      },
    ] as never;

    const answer = buildNextFlightAnswerFromWeeks(
      weeks,
      [
        { role: "user", content: "Qual é meu próximo voo?" },
        { role: "assistant", content: "Seu voo é em 26/04." },
        { role: "user", content: "Quais são os detalhes?" },
      ],
      "2026-04-01"
    );

    expect(answer).toContain("26/04/2026 às 22:05");
    expect(answer).toContain("G31234");
    expect(answer).toContain("**Terminal:** 2");
  });

  it("preserva a partida registrada e calcula a chegada recomendada para embarque em GRU", () => {
    const weeks = [{
      year: 2026,
      weekNumber: 17,
      isTicketIssued: 1,
      isDeleted: 0,
      departureFlightDatetime: "2026-04-26T22:05",
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
    }] as never;

    const answer = buildBoardingGuidanceAnswerFromWeeks(
      weeks,
      [{ role: "user", content: "Qual é o meu horário de embarque?" }],
      "2026-04-01"
    );

    expect(answer).toContain("22:05");
    expect(answer).toContain("19:05");
    expect(answer).toContain("3 horas antes da partida");
    expect(answer).toContain("não altera o horário cadastrado");
    expect(answer).toContain("LATAM — antecedência de chegada ao aeroporto");
  });

  it("retorna texto válido do Gemini e traduz falhas do provedor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Resposta do Fly.IA" }] } }],
          usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 45, totalTokenCount: 165 },
        }),
      })
    );

    await expect(
      askFlyIa(context as never, [{ role: "user", content: "Olá" }])
    ).resolves.toEqual({
      text: "Resposta do Fly.IA",
      usage: { inputTokens: 120, outputTokens: 45, totalTokens: 165 },
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      askFlyIa(context as never, [{ role: "user", content: "Olá" }])
    ).rejects.toBeInstanceOf(FlyIaProviderError);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));
    await expect(
      askFlyIa(context as never, [{ role: "user", content: "Olá" }])
    ).rejects.toBeInstanceOf(FlyIaProviderError);
  });
});
