import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getDb: vi.fn(),
  memoryReads: [] as Array<Array<Record<string, unknown>>>,
  inserts: [] as Array<{ values: Record<string, unknown>; set: Record<string, unknown> }>,
  dashboardSessions: [{ count: "0" }] as Array<Record<string, unknown>>,
  dashboardMetrics: [{}] as Array<Record<string, unknown>>,
  deleteWhere: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: state.getDb }));

import {
  FLY_IA_MEMORY_TTL_MS,
  getFlyIaMemoryDashboard,
  getFlyIaSessionMemory,
  saveFlyIaSessionMemory,
} from "./flyIaMemory";

function memoryChain() {
  return {
    from: () => ({
      where: () => ({
        limit: async () => state.memoryReads.shift() ?? [],
      }),
    }),
  };
}

function createMockDb() {
  return {
    delete: () => ({ where: state.deleteWhere }),
    select: (fields?: Record<string, unknown>) => {
      if (!fields) return memoryChain();
      if ("count" in fields) {
        return { from: () => ({ where: async () => state.dashboardSessions }) };
      }
      return { from: () => ({ where: async () => state.dashboardMetrics }) };
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onDuplicateKeyUpdate: async ({ set }: { set: Record<string, unknown> }) => {
          state.inserts.push({ values, set });
        },
      }),
    }),
  };
}

afterEach(() => {
  state.getDb.mockReset();
  state.memoryReads = [];
  state.inserts = [];
  state.dashboardSessions = [{ count: "0" }];
  state.dashboardMetrics = [{}];
  state.deleteWhere.mockReset();
});

describe("flyIaMemory persistence", () => {
  it("isola leituras da mesma sessão entre exercícios e limpa registros vencidos", async () => {
    state.getDb.mockResolvedValue(createMockDb());
    state.memoryReads = [
      [{ sessionKey: "same-session", year: 2026, summary: "Resumo de 2026", expiresAt: new Date("2026-08-20T20:00:00Z") }],
      [{ sessionKey: "same-session", year: 2027, summary: "Resumo de 2027", expiresAt: new Date("2026-08-20T20:00:00Z") }],
    ];
    const now = new Date("2026-08-20T12:00:00Z");

    const currentYear = await getFlyIaSessionMemory("same-session", 2026, now);
    const otherYear = await getFlyIaSessionMemory("same-session", 2027, now);

    expect(currentYear).toMatchObject({ year: 2026, summary: "Resumo de 2026" });
    expect(otherYear).toMatchObject({ year: 2027, summary: "Resumo de 2027" });
    expect(state.deleteWhere).toHaveBeenCalledTimes(2);
  });

  it("grava e regrava a memória via upsert com expiração renovada", async () => {
    state.getDb.mockResolvedValue(createMockDb());
    const now = new Date("2026-08-20T12:00:00Z");

    await saveFlyIaSessionMemory({ sessionKey: "same-session", year: 2026, existingSummary: null, answer: "Primeiro fato.", sourceResponsesCount: 0, now });
    await saveFlyIaSessionMemory({ sessionKey: "same-session", year: 2026, existingSummary: "Primeiro fato.", answer: "Segundo fato.", sourceResponsesCount: 1, now });

    expect(state.inserts).toHaveLength(2);
    expect(state.inserts[0]?.values).toMatchObject({ year: 2026, sourceResponsesCount: 1, summary: "Primeiro fato." });
    expect(state.inserts[1]?.values).toMatchObject({ year: 2026, sourceResponsesCount: 2 });
    expect(state.inserts[1]?.set.summary).toContain("Segundo fato.");
    expect((state.inserts[1]?.set.expiresAt as Date).getTime()).toBe(now.getTime() + FLY_IA_MEMORY_TTL_MS);
  });

  it("agrega sessões e indicadores administrativos a partir das linhas retornadas pelo banco", async () => {
    state.getDb.mockResolvedValue(createMockDb());
    state.dashboardSessions = [{ count: "4" }];
    state.dashboardMetrics = [{
      requests: "19",
      unanswered: "3",
      averageLatencyMs: "711.6",
      averageTokens: "420.2",
      averageContextChars: "2010.9",
      averageSavedChars: "888.4",
    }];

    await expect(getFlyIaMemoryDashboard(new Date("2026-08-20T12:00:00Z"))).resolves.toEqual({
      activeSessions: 4,
      retentionHours: 8,
      metrics: { requests: 19, unanswered: 3, averageLatencyMs: 712, averageTokens: 420, averageContextChars: 2011, averageSavedChars: 888 },
    });
  });
});
