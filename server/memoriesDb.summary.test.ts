import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const state = {
    selects: [] as Array<Array<Record<string, unknown>>>,
    inserted: [] as Array<Record<string, unknown>>,
    updates: [] as Array<Record<string, unknown>>,
    getDb: vi.fn(),
  };
  const db: any = {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.selects.shift() ?? [] }),
      }),
    }),
    insert: () => ({
      values: async (values: Record<string, unknown>) => {
        state.inserted.push(values);
        return [{ insertId: 2 }];
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        state.updates.push(values);
        return { where: async () => ({ affectedRows: 1 }) };
      },
    }),
  };
  state.getDb.mockResolvedValue(db);
  return state;
});

vi.mock("./db", () => ({ getDb: state.getDb }));

import { upsertFlightMemorySummary } from "./memoriesDb";

afterEach(() => {
  state.selects.length = 0;
  state.inserted.length = 0;
  state.updates.length = 0;
});

describe("upsertFlightMemorySummary", () => {
  const input = {
    year: 2026,
    weekNumber: 12,
    summary: "Resumo factual.",
    model: "gemini-3.6-flash",
    sourceFingerprint: "f".repeat(64),
  };

  it("insere o resumo com seus metadados e o recupera", async () => {
    const generatedAt = new Date("2026-03-16T10:00:00.000Z");
    state.selects.push([], [{ id: 2, ...input, generatedAt, updatedAt: generatedAt }]);

    await expect(upsertFlightMemorySummary(input)).resolves.toMatchObject({
      id: 2,
      summary: "Resumo factual.",
      model: "gemini-3.6-flash",
      sourceFingerprint: "f".repeat(64),
    });
    expect(state.inserted).toEqual([input]);
  });

  it("atualiza o texto e os metadados quando a viagem já possui resumo", async () => {
    const existingAt = new Date("2026-03-10T10:00:00.000Z");
    state.selects.push([{ id: 9, ...input, generatedAt: existingAt, updatedAt: existingAt }]);

    await expect(upsertFlightMemorySummary({ ...input, summary: "Versão atualizada." })).resolves.toMatchObject({
      id: 9,
      summary: "Versão atualizada.",
      model: "gemini-3.6-flash",
    });
    expect(state.updates[0]).toMatchObject({
      summary: "Versão atualizada.",
      sourceFingerprint: "f".repeat(64),
      generatedAt: expect.any(Date),
    });
  });
});
