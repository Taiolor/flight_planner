/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  authCheck: vi.fn(),
  dashboard: vi.fn(),
  memoryDashboard: vi.fn(),
  updateSettings: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ geminiBudget: { dashboard: { invalidate: mocks.invalidate } } }),
    flightAuth: { check: { useQuery: mocks.authCheck } },
    geminiBudget: {
      dashboard: { useQuery: mocks.dashboard },
      updateSettings: { useMutation: mocks.updateSettings },
    },
    flyIaMemory: { dashboard: { useQuery: mocks.memoryDashboard } },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import GeminiBudgetDashboard from "./GeminiBudgetDashboard";

afterEach(() => {
  cleanup();
  mocks.authCheck.mockReset();
  mocks.dashboard.mockReset();
  mocks.memoryDashboard.mockReset();
  mocks.updateSettings.mockReset();
  mocks.invalidate.mockReset();
});

const dashboardData = {
  snapshot: {
    yearMonth: "2026-08",
    requestsCount: 12,
    inputTokens: 4000,
    outputTokens: 1200,
    totalTokens: 5200,
    estimatedCostCents: 155,
    monthlyBudgetCents: 10000,
    usagePercent: 1.55,
    isAtLimit: false,
    settings: {
      monthlyBudgetCents: 10000,
      inputCostCentsPerMillion: 165,
      outputCostCentsPerMillion: 1375,
      warningThresholdPercent: 70,
      criticalThresholdPercent: 90,
      limitThresholdPercent: 100,
      emailAlertsEnabled: 1,
      pushAlertsEnabled: 1,
    },
  },
  settings: {
    monthlyBudgetCents: 10000,
    inputCostCentsPerMillion: 165,
    outputCostCentsPerMillion: 1375,
    warningThresholdPercent: 70,
    criticalThresholdPercent: 90,
    limitThresholdPercent: 100,
    emailAlertsEnabled: 1,
    pushAlertsEnabled: 1,
  },
  history: [],
  alerts: [],
};

describe("GeminiBudgetDashboard", () => {
  it("mantém o painel indisponível para sessão sem perfil administrativo", () => {
    mocks.authCheck.mockReturnValue({ data: { authenticated: true, isAdmin: false }, isLoading: false });

    render(<GeminiBudgetDashboard />);

    expect(screen.getByText("Painel administrativo protegido")).toBeTruthy();
    expect(mocks.dashboard).not.toHaveBeenCalled();
  });

  it("exibe estimativas e configurações para administradores", () => {
    mocks.authCheck.mockReturnValue({ data: { authenticated: true, isAdmin: true }, isLoading: false });
    mocks.dashboard.mockReturnValue({ data: dashboardData, isLoading: false, isFetching: false, error: null, refetch: vi.fn() });
    mocks.memoryDashboard.mockReturnValue({
      data: {
        activeSessions: 2,
        retentionHours: 8,
        metrics: { requests: 12, unanswered: 1, averageLatencyMs: 620, averageTokens: 340, averageContextChars: 1800, averageSavedChars: 950 },
      },
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mocks.updateSettings.mockReturnValue({ mutate: vi.fn(), isPending: false });

    render(<GeminiBudgetDashboard />);

    expect(screen.getByText("Custo estimado")).toBeTruthy();
    expect(screen.getAllByText(/R\$\s*1,55/).length).toBeGreaterThan(0);
    expect(screen.getByText("Configurar alertas")).toBeTruthy();
    expect(screen.getByText(/Memória de sessão/)).toBeTruthy();
    expect(screen.getByText("Contexto poupado")).toBeTruthy();
    expect(screen.getByText("Nenhum alerta de orçamento foi disparado ainda.")).toBeTruthy();
  });
});
