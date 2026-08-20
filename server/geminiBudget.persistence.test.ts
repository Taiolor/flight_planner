import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const settings = {
    id: 1,
    monthlyBudgetCents: 1_000,
    inputCostCentsPerMillion: 165,
    outputCostCentsPerMillion: 1_375,
    warningThresholdPercent: 70,
    criticalThresholdPercent: 90,
    limitThresholdPercent: 100,
    emailAlertsEnabled: 1,
    pushAlertsEnabled: 1,
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  };

  const state = {
    settings,
    monthly: { requestsCount: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostCents: 0 },
    usageEvents: [] as Array<Record<string, unknown>>,
    alertClaims: new Set<string>(),
    claimedDeliveryKeys: [] as string[],
    sentEmail: vi.fn(),
    sentPush: vi.fn(),
    getDb: vi.fn(),
  };

  const tableName = (table: any) => table?.[Symbol.for("drizzle:Name")] ?? table?._?.name;
  const rowsFor = (name: string) => {
    if (name === "gemini_budget_settings") return [state.settings];
    if (name === "gemini_monthly_usage") return state.monthly.requestsCount ? [state.monthly] : [];
    return [];
  };
  const getSqlValues = (value: unknown): unknown[] => {
    if (!value || typeof value !== "object") return [];
    const candidate = value as { value?: unknown; values?: unknown[]; queryChunks?: unknown[] };
    if (Array.isArray(candidate.values)) return candidate.values;
    if (Object.prototype.hasOwnProperty.call(candidate, "value")) return [candidate.value];
    return (candidate.queryChunks ?? []).flatMap(getSqlValues);
  };

  const db: any = {
    select: () => ({
      from: (table: any) => {
        const rows = rowsFor(tableName(table));
        return {
          where: () => ({
            limit: async () => rows,
            orderBy: async () => rows,
          }),
          orderBy: async () => rows,
        };
      },
    }),
    insert: (table: any) => ({
      values: async (values: Record<string, unknown>) => {
        if (tableName(table) === "gemini_usage_events") state.usageEvents.push(values);
        return { affectedRows: 1 };
      },
    }),
    update: () => ({
      set: () => ({ where: async () => ({ affectedRows: 1 }) }),
    }),
    execute: async (statement: unknown) => {
      const values = getSqlValues(statement);
      const deliveryKey = values.find(value =>
        typeof value === "string" && /^\d{4}-\d{2}:\d+$/.test(value)
      ) as string | undefined;

      if (!deliveryKey) {
        state.monthly = {
          requestsCount: state.monthly.requestsCount + 1,
          inputTokens: state.monthly.inputTokens + 1_000_000,
          outputTokens: state.monthly.outputTokens + 1_000_000,
          totalTokens: state.monthly.totalTokens + 2_000_000,
          estimatedCostCents: state.monthly.estimatedCostCents + 1_540,
        };
        return [{ affectedRows: 1 }];
      }

      const alreadyClaimed = state.alertClaims.has(deliveryKey);
      state.alertClaims.add(deliveryKey);
      state.claimedDeliveryKeys.push(deliveryKey);
      return [{ affectedRows: alreadyClaimed ? 0 : 1 }];
    },
  };

  state.getDb.mockResolvedValue(db);
  state.sentEmail.mockResolvedValue(true);
  state.sentPush.mockResolvedValue(true);
  return state;
});

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    sql: (_strings: TemplateStringsArray, ...values: unknown[]) => ({ values }),
  };
});

vi.mock("./db", () => ({ getDb: state.getDb }));
vi.mock("./_core/env", () => ({ ENV: { authEmail: "admin@smartfly.test" } }));
vi.mock("./_core/emailNotification", () => ({ sendGeminiBudgetAlertEmail: state.sentEmail }));
vi.mock("./_core/notification", () => ({ notifyOwner: state.sentPush }));

import { recordGeminiUsage } from "./geminiBudget";

afterEach(() => {
  state.monthly = { requestsCount: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostCents: 0 };
  state.usageEvents.length = 0;
  state.alertClaims.clear();
  state.claimedDeliveryKeys.length = 0;
  state.sentEmail.mockClear();
  state.sentPush.mockClear();
});

describe("recordGeminiUsage", () => {
  it("persiste o evento e devolve o agregado mensal com custo estimado", async () => {
    const snapshot = await recordGeminiUsage(
      "gemini-3.6-flash",
      { inputTokens: 1_000_000, outputTokens: 1_000_000, totalTokens: 2_000_000 },
      "2026-08"
    );

    expect(state.usageEvents).toEqual([
      expect.objectContaining({
        yearMonth: "2026-08",
        model: "gemini-3.6-flash",
        estimatedCostCents: 1_540,
      }),
    ]);
    expect(snapshot).toMatchObject({
      yearMonth: "2026-08",
      requestsCount: 1,
      totalTokens: 2_000_000,
      estimatedCostCents: 1_540,
      isAtLimit: true,
    });
  });

  it("usa deliveryKey real e não reenvia alertas no mesmo mês e faixa", async () => {
    const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000, totalTokens: 2_000_000 };

    await recordGeminiUsage("gemini-3.6-flash", usage, "2026-08");
    await recordGeminiUsage("gemini-3.6-flash", usage, "2026-08");

    expect(state.claimedDeliveryKeys).toEqual([
      "2026-08:70",
      "2026-08:90",
      "2026-08:100",
      "2026-08:70",
      "2026-08:90",
      "2026-08:100",
    ]);
    expect(state.sentEmail).toHaveBeenCalledTimes(3);
    expect(state.sentPush).toHaveBeenCalledTimes(3);
    expect(state.sentEmail).toHaveBeenNthCalledWith(1, "admin@smartfly.test", expect.objectContaining({
      thresholdPercent: 70,
      yearMonth: "2026-08",
      estimatedCostCents: 1_540,
      monthlyBudgetCents: 1_000,
    }));
    expect(state.sentPush).toHaveBeenNthCalledWith(3, expect.objectContaining({
      title: "Fly.IA: 100% do orçamento atingido",
      content: expect.stringContaining("2026-08"),
    }));
  });
});
