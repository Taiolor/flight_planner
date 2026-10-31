import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getDb: vi.fn(),
  inserted: [] as Array<Record<string, unknown>>,
  aggregate: [] as Array<Record<string, unknown>>,
  timelineRows: [] as Array<Array<Record<string, unknown>>>,
}));

vi.mock("./db", () => ({ getDb: state.getDb }));

import { getFlyIaTelemetryTimeline, getFlyIaVoiceDashboard, recordFlyIaVoiceUsage } from "./flyIaVoiceTelemetry";

function createDb() {
  let selectCalls = 0;
  return {
    insert: () => ({
      values: async (value: Record<string, unknown>) => {
        state.inserted.push(value);
      },
    }),
    select: () => {
      const rows = state.timelineRows[selectCalls++] ?? state.aggregate;
      const chain: any = {
        from: () => chain,
        where: () => chain,
        groupBy: () => chain,
        orderBy: async () => rows,
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
      };
      return chain;
    },
  } as any;
}

afterEach(() => {
  state.inserted.length = 0;
  state.aggregate = [];
  state.timelineRows = [];
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

  it("preenche uma série diária contínua sem expor áudio, texto ou identidade", async () => {
    state.getDb.mockResolvedValue(createDb());
    state.timelineRows = [
      [{ day: "2026-08-20", totalTokens: "1250" }],
      [{ day: "2026-08-21", audioDurationMs: "3600" }],
    ];

    const timeline = await getFlyIaTelemetryTimeline(new Date("2026-08-21T12:00:00.000Z"));

    expect(timeline).toHaveLength(14);
    expect(timeline).toContainEqual({ date: "2026-08-20", label: "20/08", totalTokens: 1250, audioDurationMs: 0 });
    expect(timeline).toContainEqual({ date: "2026-08-21", label: "21/08", totalTokens: 0, audioDurationMs: 3600 });
    expect(timeline.every(point => Object.keys(point).every(key => ["date", "label", "totalTokens", "audioDurationMs"].includes(key)))).toBe(true);
  });
});
