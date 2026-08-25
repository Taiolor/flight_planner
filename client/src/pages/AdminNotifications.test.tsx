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
});
