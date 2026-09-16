import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  validateAuthSession: vi.fn(),
}));

vi.mock("./financialDb", () => ({
  copyFinancialMonthlyBudgets: vi.fn(),
  getFinancialDataByYear: vi.fn(),
  getFinancialMonthlyBudgets: vi.fn(),
  getFinancialSummaryByMonth: vi.fn(),
  getFinancialYearSummary: vi.fn(),
  upsertFinancialMonthlyBudget: vi.fn(),
}));

import { financialRouter } from "./routers/financial";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: { cookie: "flight_session=valid-session" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const EMPTY_YEAR_SUMMARY = {
  year: 2026,
  totalCashBRL: 0,
  totalSmilesPoints: 0,
  totalLatamPassPoints: 0,
  totalMiles: 0,
  weeksCount: 0,
  issuedCount: 0,
  avgCashBRL: 0,
  byAirline: {},
  byMonth: [],
};

describe("financial router by planning year", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import("./db");
    const financialDb = await import("./financialDb");

    (db.validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "taiolor@gmail.com",
    });
    (financialDb.getFinancialDataByYear as ReturnType<typeof vi.fn>)
      .mockResolvedValue([]);
    (financialDb.getFinancialSummaryByMonth as ReturnType<typeof vi.fn>)
      .mockResolvedValue([]);
    (financialDb.getFinancialMonthlyBudgets as ReturnType<typeof vi.fn>)
      .mockResolvedValue([]);
    (financialDb.getFinancialYearSummary as ReturnType<typeof vi.fn>)
      .mockResolvedValue(EMPTY_YEAR_SUMMARY);
    (financialDb.copyFinancialMonthlyBudgets as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ copiedCount: 12, targetYear: 2029 });
    (financialDb.upsertFinancialMonthlyBudget as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ month: 1, budgetCents: 150_000 });
  });

  it("encaminha o ano selecionado para dados semanais, mensais e anuais", async () => {
    const financialDb = await import("./financialDb");
    const caller = financialRouter.createCaller(createAuthenticatedContext());

    await caller.getWeeklyData({ year: 2027 });
    await caller.getMonthlySummary({ year: 2028 });
    await caller.getYearSummary({ year: 2029 });

    expect(financialDb.getFinancialDataByYear).toHaveBeenCalledWith(2027);
    expect(financialDb.getFinancialSummaryByMonth).toHaveBeenCalledWith(2028);
    expect(financialDb.getFinancialYearSummary).toHaveBeenCalledWith(2029);
  });

  it("isola o orçamento mensal pelo ano e valida mês e centavos", async () => {
    const financialDb = await import("./financialDb");
    const caller = financialRouter.createCaller(createAuthenticatedContext());

    await caller.getMonthlyBudgets({ year: 2028 });
    await caller.upsertMonthlyBudget({
      year: 2028,
      month: 3,
      budgetCents: 275_050,
    });

    expect(financialDb.getFinancialMonthlyBudgets).toHaveBeenCalledWith(2028);
    expect(financialDb.upsertFinancialMonthlyBudget).toHaveBeenCalledWith(
      2028,
      3,
      275_050
    );
    await expect(
      (caller.upsertMonthlyBudget as any)({
        year: 2028,
        month: 13,
        budgetCents: 100,
      })
    ).rejects.toThrow();
  });

  it("copia o orçamento entre exercícios com ajuste percentual validado", async () => {
    const financialDb = await import("./financialDb");
    const caller = financialRouter.createCaller(createAuthenticatedContext());

    await caller.copyMonthlyBudgets({
      sourceYear: 2028,
      targetYear: 2029,
      adjustmentPercent: 5,
    });

    expect(financialDb.copyFinancialMonthlyBudgets).toHaveBeenCalledWith(
      2028,
      2029,
      5
    );
    await expect(
      (caller.copyMonthlyBudgets as any)({
        sourceYear: 2028,
        targetYear: 2028,
        adjustmentPercent: 0,
      })
    ).rejects.toThrow("O ano de destino deve ser diferente do ano de origem.");
  });

  it("calcula a projeção somente a partir do exercício base selecionado", async () => {
    const financialDb = await import("./financialDb");
    const caller = financialRouter.createCaller(createAuthenticatedContext());

    const result = await caller.getProjections({
      baseYear: 2028,
      targetYear: 2029,
      inflationRate: 0.05,
      tripsPerMonth: 4,
    });

    expect(result.baseYear).toBe(2028);
    expect(result.targetYear).toBe(2029);
    expect(financialDb.getFinancialYearSummary).toHaveBeenCalledWith(2028, []);
    expect(financialDb.getFinancialDataByYear).toHaveBeenCalledWith(2028);
  });

  it("rejeita contratos sem ano e projeções que misturam exercícios", async () => {
    const caller = financialRouter.createCaller(createAuthenticatedContext());

    await expect((caller.getWeeklyData as any)({})).rejects.toThrow();
    await expect((caller.getMonthlySummary as any)({})).rejects.toThrow();
    await expect((caller.getYearSummary as any)({})).rejects.toThrow();
    await expect(
      (caller.getProjections as any)({ baseYear: 2027, targetYear: 2030 })
    ).rejects.toThrow("O ano projetado deve ser o ano seguinte ao exercício base.");
  });
});
