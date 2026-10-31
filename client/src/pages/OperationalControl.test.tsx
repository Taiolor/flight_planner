// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YearProvider } from "@/contexts/YearContext";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  overview: vi.fn(),
  mutation: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ operational: { getOverview: { invalidate: mocks.invalidate } } }),
    flightAuth: { check: { useQuery: mocks.auth } },
    operational: {
      getOverview: { useQuery: mocks.overview },
      getReportSchedule: { useQuery: () => ({ data: null, refetch: vi.fn() }) },
      ensureChecklistTemplate: { useMutation: mocks.mutation },
      addChecklistItem: { useMutation: mocks.mutation },
      setChecklistCompletion: { useMutation: mocks.mutation },
      deleteChecklistItem: { useMutation: mocks.mutation },
      upsertCredit: { useMutation: mocks.mutation },
      deleteCredit: { useMutation: mocks.mutation },
      upsertGoal: { useMutation: mocks.mutation },
      deleteAttachment: { useMutation: mocks.mutation },
      sendExecutiveReport: { useMutation: mocks.mutation },
      configureReportSchedule: { useMutation: mocks.mutation },
    },
  },
}));

import OperationalControl from "./OperationalControl";

const overview = {
  weeks: [{ weekNumber: 10, departureDate: "2026-03-01", returnDate: "2026-03-06", isDeleted: 0, isTicketIssued: 1, ticketType: "roundtrip", returnFlightDatetime: "2026-03-06T19:00", returnCancelled: 0 }],
  checklists: [],
  credits: [],
  goals: [],
  attachments: [],
  decisions: [{ id: "purchase-10", kind: "purchase", severity: "warning", weekNumber: 10, title: "Emitir a Semana 10", description: "A ida está prevista." }],
  totals: { activeCreditsCents: 5000, incompleteChecklistItems: 2, pendingPurchases: 1 },
};

describe("OperationalControl", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("apresenta decisões, preparação, créditos e relatórios a partir dos dados reais", () => {
    mocks.auth.mockReturnValue({ data: { authenticated: true }, isLoading: false });
    mocks.overview.mockReturnValue({ data: overview, isLoading: false });
    mocks.mutation.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });

    render(<YearProvider><OperationalControl /></YearProvider>);

    expect(screen.getByText("Centro de decisões")).toBeTruthy();
    expect(screen.getByText("Emitir a Semana 10")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Preparação" }));
    expect(screen.getByRole("button", { name: /Criar checklist padrão/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Créditos" }));
    expect(screen.getByText("Metas por categoria")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Relatórios" }));
    expect(screen.getByRole("button", { name: /Exportar CSV/ })).toBeTruthy();
  });
});
