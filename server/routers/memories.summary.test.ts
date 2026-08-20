import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  validateAuthSession: vi.fn(),
  overview: vi.fn(),
  getMemories: vi.fn(),
  deleteMedia: vi.fn(),
  upsertMemory: vi.fn(),
  upsertSummary: vi.fn(),
  getBudget: vi.fn(),
  recordUsage: vi.fn(),
  generateSummary: vi.fn(),
  projectSummary: vi.fn(),
  fingerprint: vi.fn(),
  consume: vi.fn(),
}));

vi.mock("../db", () => ({ validateAuthSession: state.validateAuthSession }));
vi.mock("../memoriesOverview", () => ({ getMemoriesOverview: state.overview }));
vi.mock("../memoriesDb", () => ({
  getMemoriesForYear: state.getMemories,
  deleteFlightMemoryMedia: state.deleteMedia,
  upsertFlightMemory: state.upsertMemory,
  upsertFlightMemorySummary: state.upsertSummary,
}));
vi.mock("../geminiBudget", () => ({
  GeminiBudgetExceededError: class GeminiBudgetExceededError extends Error {},
  getGeminiBudgetSnapshot: state.getBudget,
  recordGeminiUsage: state.recordUsage,
}));
vi.mock("../flyIa", () => ({
  FLY_IA_MODEL: "gemini-2.5-flash",
  FlyIaProviderError: class FlyIaProviderError extends Error {},
  createFlyIaRateLimiter: () => ({ consume: state.consume }),
}));
vi.mock("../memorySummaries", () => ({
  generateFlightMemorySummary: state.generateSummary,
  projectFlightMemorySummaryContext: state.projectSummary,
  getFlightMemorySummaryFingerprint: state.fingerprint,
}));

import { memoriesRouter } from "./memories";

const trip = {
  year: 2026,
  weekNumber: 12,
  summary: null,
  segments: [],
};

function caller(authenticated = true) {
  state.validateAuthSession.mockResolvedValue(
    authenticated ? { email: "user@smartfly.test", role: "user" } : null
  );
  return memoriesRouter.createCaller({
    req: { headers: { cookie: authenticated ? "flight_session=session" : "" } },
    res: {},
  } as any);
}

afterEach(() => {
  Object.values(state).forEach(mock => mock.mockReset());
  state.getBudget.mockResolvedValue({ isAtLimit: false });
  state.recordUsage.mockResolvedValue(undefined);
  state.projectSummary.mockReturnValue({ exercise: 2026, weekNumber: 12 });
  state.fingerprint.mockReturnValue("f".repeat(64));
  state.generateSummary.mockResolvedValue({
    text: "Resumo factual.",
    usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  });
  state.upsertSummary.mockResolvedValue({ id: 1, summary: "Resumo factual." });
});

describe("memories.generateSummary", () => {
  it("exige sessão interna antes de acessar a geração", async () => {
    await expect(caller(false).generateSummary({ year: 2026, weekNumber: 12 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("retorna o resumo existente sem chamar o Gemini quando não há atualização", async () => {
    const existing = { id: 4, summary: "Já salvo." };
    state.overview.mockResolvedValue({ trips: [{ ...trip, summary: existing }] });

    await expect(caller().generateSummary({ year: 2026, weekNumber: 12 })).resolves.toEqual({
      summary: existing,
      generated: false,
    });
    expect(state.generateSummary).not.toHaveBeenCalled();
  });

  it("gera, persiste e registra o consumo para um voo disponível", async () => {
    state.overview.mockResolvedValue({ trips: [trip] });

    await expect(caller().generateSummary({ year: 2026, weekNumber: 12 })).resolves.toEqual({
      summary: { id: 1, summary: "Resumo factual." },
      generated: true,
    });
    expect(state.upsertSummary).toHaveBeenCalledWith(expect.objectContaining({
      year: 2026,
      weekNumber: 12,
      model: "gemini-2.5-flash",
    }));
    expect(state.recordUsage).toHaveBeenCalledWith("gemini-2.5-flash", {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    });
  });
});
