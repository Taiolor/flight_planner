import { afterEach, describe, expect, it, vi } from "vitest";
import {
  askFlyIa,
  buildFlyIaPayload,
  createFlyIaRateLimiter,
  FlyIaProviderError,
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

  it("retorna texto válido do Gemini e traduz falhas do provedor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Resposta do Fly.IA" }] } }],
        }),
      })
    );

    await expect(
      askFlyIa(context as never, [{ role: "user", content: "Olá" }])
    ).resolves.toBe("Resposta do Fly.IA");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(
      askFlyIa(context as never, [{ role: "user", content: "Olá" }])
    ).rejects.toBeInstanceOf(FlyIaProviderError);
  });
});
