// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  mapData: vi.fn(),
  summary: vi.fn(),
  periodSummaries: vi.fn(),
}));

vi.mock("@/components/OpenStreetMap", () => ({
  OpenStreetMap: () => null,
}));

vi.mock("@/components/ContentReveal", () => ({
  ContentReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/StandardPageHeader", () => ({
  StandardPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: { check: { useQuery: mocks.auth } },
    usageTelemetry: {
      getMapData: { useQuery: mocks.mapData },
      getSummary: { useQuery: mocks.summary },
    },
    useQueries: mocks.periodSummaries,
  },
}));

import UsageTelemetryMap from "./UsageTelemetryMap";

describe("UsageTelemetryMap period totals", () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ data: { authenticated: true }, isLoading: false });
    mocks.mapData.mockReturnValue({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() });
    mocks.summary.mockReturnValue({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() });
    mocks.periodSummaries.mockReturnValue([
      { data: undefined, isLoading: false, isError: true },
      { data: [{ count: 72, located: 0 }], isLoading: false, isError: false },
      { data: [{ count: 168, located: 0 }], isLoading: false, isError: false },
      { data: [{ count: 720, located: 0 }], isLoading: false, isError: false },
    ]);
  });

  it("mostra indisponibilidade, e nunca zero, quando uma consulta de período falha", () => {
    render(<UsageTelemetryMap />);

    const unavailableButton = screen.getByRole("button", {
      name: "Últimas 24 horas: total indisponível",
    });

    expect(unavailableButton.textContent).toContain("—");
    expect(unavailableButton.textContent).not.toContain("0");
    expect(screen.getByRole("button", { name: "Últimas 72 horas: 72 eventos" })).toBeTruthy();
  });
});
