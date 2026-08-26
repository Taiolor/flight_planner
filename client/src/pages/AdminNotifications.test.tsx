/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YearProvider } from "@/contexts/YearContext";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  authCheck: vi.fn(),
  status: vi.fn(),
  logs: vi.fn(),
  dailySummary: vi.fn(),
  exportLogs: vi.fn(),
  downloadCsv: vi.fn(),
  performance: vi.fn(),
  reliability: vi.fn(),
  sendTest: vi.fn(),
  sendNextAlert: vi.fn(),
  recipients: vi.fn(),
  addRecipient: vi.fn(),
  removeRecipient: vi.fn(),
  sendTestEmail: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: { check: { useQuery: mocks.authCheck } },
    adminNotifications: {
      getStatus: { useQuery: mocks.status },
      getLogs: { useInfiniteQuery: mocks.logs },
      getDailySummary: { useQuery: mocks.dailySummary },
      exportLogs: { useQuery: mocks.exportLogs },
      sendNextAlert: { useMutation: mocks.sendNextAlert },
    },
    performanceMetrics: { getSummary: { useQuery: mocks.performance } },
    reliability: { getFlightWeeksSummary: { useQuery: mocks.reliability } },
    push: { sendTest: { useMutation: mocks.sendTest } },
    ticketNotifications: {
      getRecipients: { useQuery: mocks.recipients },
      addRecipient: { useMutation: mocks.addRecipient },
      removeRecipient: { useMutation: mocks.removeRecipient },
      sendTestEmail: { useMutation: mocks.sendTestEmail },
    },
  },
}));

vi.mock("@/lib/notificationHistoryCsv", () => ({
  downloadNotificationHistoryCsv: mocks.downloadCsv,
}));

import AdminNotifications from "./AdminNotifications";

const emptyStatus = {
  totalIssuedFlights: 0,
  totalSubscriptions: 0,
  avisos: [],
  scheduledAlerts: [],
  subscriptions: [],
  serverTime: new Date().toISOString(),
};

function renderPage() {
  return render(
    <YearProvider>
      <AdminNotifications />
    </YearProvider>
  );
}

function configureSharedQueries() {
  mocks.logs.mockReturnValue({
    data: { pages: [{ items: [] }] },
    refetch: vi.fn().mockResolvedValue({ error: null }),
    isFetching: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  });
  mocks.dailySummary.mockReturnValue({
    data: [],
    isLoading: false,
    refetch: vi.fn().mockResolvedValue({ error: null }),
  });
  mocks.exportLogs.mockReturnValue({
    isFetching: false,
    refetch: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  mocks.performance.mockReturnValue({
    data: [],
    refetch: vi.fn(),
    isFetching: false,
  });
  mocks.reliability.mockReturnValue({
    data: { transientFailures: 0, schemaFailures: 0, lastFailureAt: null },
    refetch: vi.fn(),
    isFetching: false,
    isError: false,
  });
  mocks.sendTest.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.sendNextAlert.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.recipients.mockReturnValue({ data: [], refetch: vi.fn() });
  mocks.addRecipient.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.removeRecipient.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.sendTestEmail.mockReturnValue({ mutate: vi.fn(), isPending: false });
}

describe("AdminNotifications", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mantém a ordem dos Hooks quando a sessão autenticada deixa o estado de carregamento", () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({ data: undefined, isLoading: true });
    mocks.status.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    const view = renderPage();
    expect(screen.getByText("Carregando painel...")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Admin · Notificações" })
    ).toBeTruthy();

    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    expect(() => view.rerender(
      <YearProvider>
        <AdminNotifications />
      </YearProvider>
    )).not.toThrow();
    expect(screen.getByText("Admin · Notificações · 2026")).toBeTruthy();
  });

  it("apresenta uma mensagem de falha quando a consulta administrativa autenticada não responde", () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Serviço de notificações indisponível."),
      refetch: vi.fn(),
      isFetching: false,
    });

    renderPage();

    expect(screen.getByText("Não foi possível carregar o painel")).toBeTruthy();
    expect(
      screen.getByText("Serviço de notificações indisponível.")
    ).toBeTruthy();
  });

  it("sinaliza ao administrador uma divergência permanente de schema", () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
    mocks.reliability.mockReturnValue({
      data: { transientFailures: 0, schemaFailures: 2, lastFailureAt: new Date() },
      refetch: vi.fn(),
      isFetching: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByRole("alert").textContent).toContain(
      "Divergência permanente de schema detectada"
    );
  });

  it("exibe confirmação visual ao alternar a atualização automática", () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue({ error: null }),
      isFetching: false,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Ativar atualização automática" }));

    expect(screen.getByRole("status").textContent).toContain(
      "Atualização automática ativada"
    );
  });

  it("informa a conclusão após atualizar manualmente os dados do painel", async () => {
    configureSharedQueries();
    const refetch = vi.fn().mockResolvedValue({ error: null });
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch,
      isFetching: false,
    });

    renderPage();
    fireEvent.click(screen.getByLabelText("Atualizar"));

    await waitFor(() => expect(refetch).toHaveBeenCalledOnce());
    expect(screen.getByRole("status").textContent).toContain("Dados do painel atualizados");
  });

  it("aplica o filtro de status ao histórico administrativo", async () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Histórico de Envios/ }));
    fireEvent.change(screen.getByLabelText("Filtrar por status"), {
      target: { value: "failed" },
    });

    await waitFor(() =>
      expect(mocks.logs.mock.calls.at(-1)?.[0]).toEqual({
        year: 2026,
        limit: 25,
        status: "failed",
      })
    );
  });

  it("pesquisa texto livre no histórico, resumo diário e exportação", async () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Histórico de Envios/ }));
    fireEvent.change(screen.getByLabelText("Pesquisar no histórico"), {
      target: { value: "token expirado" },
    });

    await waitFor(() => {
      expect(mocks.logs.mock.calls.at(-1)?.[0]).toEqual({
        year: 2026,
        limit: 25,
        status: undefined,
        search: "token expirado",
      });
      expect(mocks.dailySummary.mock.calls.at(-1)?.[0]).toEqual({
        year: 2026,
        status: undefined,
        search: "token expirado",
      });
      expect(mocks.exportLogs.mock.calls.at(-1)?.[0]).toEqual({
        year: 2026,
        status: undefined,
        search: "token expirado",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa do histórico" }));
    expect(
      (screen.getByLabelText("Pesquisar no histórico") as HTMLInputElement).value
    ).toBe("");
  });

  it("exibe o resumo diário de sucessos, parciais e falhas", () => {
    configureSharedQueries();
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
    mocks.dailySummary.mockReturnValue({
      data: [{ day: "2026-08-25", total: 4, success: 2, partial: 1, failed: 1 }],
      isLoading: false,
      refetch: vi.fn(),
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Histórico de Envios/ }));

    expect(screen.getByText("Resumo diário de entregas")).toBeTruthy();
    expect(screen.getByText("4 envios")).toBeTruthy();
    expect(screen.getByText("2 sucessos")).toBeTruthy();
    expect(screen.getByText("1 parcial")).toBeTruthy();
    expect(screen.getByText("1 falha")).toBeTruthy();
  });

  it("exporta em CSV todo o histórico correspondente ao filtro ativo", async () => {
    configureSharedQueries();
    const exportedLogs = [
      {
        id: 1,
        sentAt: new Date("2026-08-25T15:30:00.000Z"),
        status: "success",
        isTest: 0,
        weekNumber: 34,
        direction: "ida",
        avisoLabel: "24h antes",
        airline: "LATAM",
        flightNumber: "LA1234",
        devicesReached: 2,
        totalDevices: 2,
        errorMessage: null,
      },
    ];
    const exportRefetch = vi.fn().mockResolvedValue({ data: exportedLogs, error: null });
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, email: "admin@smartfly.test", isAdmin: true },
      isLoading: false,
    });
    mocks.status.mockReturnValue({
      data: emptyStatus,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
    mocks.exportLogs.mockReturnValue({ isFetching: false, refetch: exportRefetch });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Histórico de Envios/ }));
    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    await waitFor(() => expect(exportRefetch).toHaveBeenCalledOnce());
    expect(mocks.downloadCsv).toHaveBeenCalledWith(exportedLogs, 2026);
    expect(screen.getByRole("status").textContent).toContain("Histórico exportado em CSV");
  });
});
