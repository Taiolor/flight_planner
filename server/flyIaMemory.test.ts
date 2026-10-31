import { describe, expect, it } from "vitest";
import {
  FLY_IA_MEMORY_MAX_CHARS,
  FLY_IA_MEMORY_TTL_MS,
  buildFlyIaMemoryDashboardResult,
  buildFlyIaSessionMemoryRecord,
  createFlyIaSessionKey,
  isFlyIaSessionMemoryActive,
  mergeFlyIaSessionMemory,
  sanitizeFlyIaSessionMemory,
} from "./flyIaMemory";

describe("flyIaMemory", () => {
  it("deriva uma chave estável sem revelar e-mail ou token", () => {
    const key = createFlyIaSessionKey("Piloto@SmartFly.test", "secret-session-token");
    expect(key).toHaveLength(64);
    expect(key).not.toContain("piloto");
    expect(key).not.toContain("secret");
    expect(key).toBe(createFlyIaSessionKey("piloto@smartfly.test", "secret-session-token"));
    expect(key).not.toBe(createFlyIaSessionKey("piloto@smartfly.test", "another-session-token"));
  });

  it("redige identificadores e limita a memória persistida", () => {
    const summary = sanitizeFlyIaSessionMemory(
      `Localizador: ABCD-1234. Contato piloto@smartfly.test. ${"x".repeat(FLY_IA_MEMORY_MAX_CHARS + 60)}`
    );
    expect(summary).not.toContain("ABCD-1234");
    expect(summary).not.toContain("piloto@smartfly.test");
    expect(summary.length).toBeLessThanOrEqual(FLY_IA_MEMORY_MAX_CHARS);
  });

  it("mantém fatos já apresentados pelo assistente sem persistir perguntas do usuário", () => {
    const summary = mergeFlyIaSessionMemory("Voo de ida confirmado.", "A volta ocorre em 01/05 às 19:10.");
    expect(summary).toContain("ida confirmado");
    expect(summary).toContain("volta ocorre");
  });

  it("cria uma persistência isolada por exercício e expira após a retenção configurada", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    const record = buildFlyIaSessionMemoryRecord({
      sessionKey: "hashed-session",
      year: 2026,
      existingSummary: "Resumo anterior.",
      answer: "Novo fato da viagem.",
      sourceResponsesCount: 3,
      now,
    });

    expect(record.year).toBe(2026);
    expect(record.sourceResponsesCount).toBe(4);
    expect(record.expiresAt.getTime()).toBe(now.getTime() + FLY_IA_MEMORY_TTL_MS);
    expect(isFlyIaSessionMemoryActive(record.expiresAt, now)).toBe(true);
    expect(isFlyIaSessionMemoryActive(record.expiresAt, record.expiresAt)).toBe(false);

    const otherYear = buildFlyIaSessionMemoryRecord({ ...record, existingSummary: null, answer: "Outro exercício.", sourceResponsesCount: 0, year: 2027, now });
    expect(otherYear.year).toBe(2027);
    expect(otherYear.sessionKey).toBe(record.sessionKey);
    expect(otherYear.summary).not.toBe(record.summary);
  });

  it("normaliza os indicadores agregados sem expor conteúdo de conversas", () => {
    const dashboard = buildFlyIaMemoryDashboardResult({
      activeSessions: "3",
      metrics: {
        requests: "12",
        unanswered: "2",
        averageLatencyMs: "623.5",
        averageTokens: "341.4",
        averageContextChars: "1800.1",
        averageSavedChars: "950.6",
      },
    });

    expect(dashboard).toEqual({
      activeSessions: 3,
      retentionHours: 8,
      metrics: { requests: 12, unanswered: 2, averageLatencyMs: 624, averageTokens: 341, averageContextChars: 1800, averageSavedChars: 951 },
    });
  });
});
