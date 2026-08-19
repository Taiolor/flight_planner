import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  validateAuthSession: vi.fn(),
  dashboard: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock("./db", () => ({
  validateAuthSession: state.validateAuthSession,
}));

vi.mock("./geminiBudget", () => ({
  GeminiBudgetExceededError: class GeminiBudgetExceededError extends Error {},
  getGeminiBudgetDashboard: state.dashboard,
  getGeminiBudgetSnapshot: vi.fn(),
  recordGeminiUsage: vi.fn(),
  updateGeminiBudgetSettings: state.updateSettings,
}));

import { appRouter } from "./routers";

function createCaller(role: "user" | "admin") {
  state.validateAuthSession.mockResolvedValue({ email: "admin@smartfly.test", role });
  return appRouter.createCaller({
    user: null,
    req: { headers: { cookie: "flight_session=admin-session" } },
    res: {},
  } as any);
}

const validSettings = {
  monthlyBudgetCents: 10_000,
  inputCostCentsPerMillion: 165,
  outputCostCentsPerMillion: 1_375,
  warningThresholdPercent: 70,
  criticalThresholdPercent: 90,
  limitThresholdPercent: 100,
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
};

afterEach(() => {
  state.validateAuthSession.mockReset();
  state.dashboard.mockReset();
  state.updateSettings.mockReset();
});

describe("geminiBudget router", () => {
  it("impede leitura de consumo por usuários sem papel administrativo", async () => {
    const caller = createCaller("user");

    await expect(caller.geminiBudget.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.dashboard).not.toHaveBeenCalled();
  });

  it("retorna o painel para administradores", async () => {
    const expected = { snapshot: { yearMonth: "2026-08" }, history: [], alerts: [] };
    state.dashboard.mockResolvedValue(expected);
    const caller = createCaller("admin");

    await expect(caller.geminiBudget.dashboard()).resolves.toEqual(expected);
  });

  it("valida a ordem das faixas antes de salvar as configurações", async () => {
    const caller = createCaller("admin");

    await expect(caller.geminiBudget.updateSettings({
      ...validSettings,
      warningThresholdPercent: 95,
      criticalThresholdPercent: 90,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updateSettings).not.toHaveBeenCalled();
  });

  it("persiste switches de notificação como valores de banco", async () => {
    state.updateSettings.mockResolvedValue({ id: 1 });
    const caller = createCaller("admin");

    await caller.geminiBudget.updateSettings({ ...validSettings, emailAlertsEnabled: false });

    expect(state.updateSettings).toHaveBeenCalledWith(expect.objectContaining({
      emailAlertsEnabled: 0,
      pushAlertsEnabled: 1,
    }));
  });
});
