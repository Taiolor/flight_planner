/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YearProvider } from "@/contexts/YearContext";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  authCheck: vi.fn(),
  status: vi.fn(),
  logs: vi.fn(),
  performance: vi.fn(),
  sendTest: vi.fn(),
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
    },
    performanceMetrics: { getSummary: { useQuery: mocks.performance } },
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
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  });
  mocks.performance.mockReturnValue({
    data: [],
    refetch: vi.fn(),
    isFetching: false,
  });
  mocks.sendTest.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.recipients.mockReturnValue({ data: [], refetch: vi.fn() });
  mocks.addRecipient.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.removeRecipient.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mocks.sendTestEmail.mockReturnValue({ mutate: vi.fn(), isPending: false });
}

describe("AdminNotifications", () => {
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
});
