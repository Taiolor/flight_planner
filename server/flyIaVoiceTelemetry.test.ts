import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getDb: vi.fn(),
  inserted: [] as Array<Record<string, unknown>>,
  aggregate: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({ getDb: state.getDb }));

import { getFlyIaVoiceDashboard, recordFlyIaVoiceUsage } from "./flyIaVoiceTelemetry";

function createDb() {
  return {
    insert: () => ({
      values: async (value: Record<string, unknown>) => {
        state.inserted.push(value);
      },
    }),
    select: () => ({
      from: () => ({
        where: async () => state.aggregate,
      }),
    }),
  } as any;
}

afterEach(() => {
  state.inserted.length = 0;
  state.aggregate = [];
  state.getDb.mockReset();
});

describe("flyIaVoiceTelemetry", () => {
  it("registra somente metadados normalizados, sem conteúdo de áudio ou transcrição", async () => {
    state.getDb.mockResolvedValue(createDb());

    await expect(recordFlyIaVoiceUsage({ durationMs: 1250.3, audioBytes: 4096, latencyMs: 682.6, outcome: "transcribed" })).resolves.toBe(true);

    expect(state.inserted).toEqual([{ durationMs: 1250, audioBytes: 4096, latencyMs: 683, outcome: "transcribed" }]);
  });

  it("devolve indicadores agregados e arredondados para o painel administrativo", async () => {
    state.getDb.mockResolvedValue(createDb());
    state.aggregate = [{ requests: "5", transcribed: "4", failed: "1", totalDurationMs: "12500", averageDurationMs: "2500", averageAudioBytes: "12000", averageLatencyMs: "680" }];

    await expect(getFlyIaVoiceDashboard(new Date("2026-08-21T12:00:00.000Z"))).resolves.toEqual({
      periodDays: 30,
      requests: 5,
      transcribed: 4,
      failed: 1,
      totalDurationMs: 12500,
      averageDurationMs: 2500,
      averageAudioBytes: 12000,
      averageLatencyMs: 680,
    });
  });
});
