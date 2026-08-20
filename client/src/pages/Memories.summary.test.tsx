/** @vitest-environment jsdom */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  overview: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  generate: vi.fn(),
  summaryOptions: null as any,
}));

vi.mock("@/contexts/YearContext", () => ({ useYear: () => ({ selectedYear: 2026 }) }));
vi.mock("@/components/GlobalYearSelector", () => ({ GlobalYearSelector: () => <span>Ano 2026</span> }));
vi.mock("@/components/CityBackgroundCarousel", () => ({ CityBackgroundCarousel: () => null }));
vi.mock("@/components/auth/LoginModal", () => ({ LoginModal: () => null }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ memories: { getOverview: { invalidate: mocks.invalidate } } }),
    flightAuth: { check: { useQuery: mocks.auth } },
    memories: {
      getOverview: { useQuery: mocks.overview },
      deleteMedia: { useMutation: () => ({ mutate: vi.fn() }) },
      generateSummary: {
        useMutation: (options: unknown) => {
          mocks.summaryOptions = options;
          return { mutate: mocks.generate, isPending: false };
        },
      },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Memories from "./Memories";

const trip = {
  year: 2026,
  weekNumber: 12,
  departureDate: "16/03/2026",
  returnDate: "20/03/2026",
  totalKm: 1024,
  completedKm: 512,
  futureKm: 512,
  memory: null,
  summary: null,
  segments: [
    {
      direction: "ida" as const,
      origin: "GRU",
      destination: "NVT",
      flightDatetime: "2026-03-16T08:00:00.000Z",
      airline: "Azul",
      flightNumber: "AD 1234",
      distanceKm: 512,
      status: "completed" as const,
    },
  ],
};

afterEach(() => {
  mocks.auth.mockReset();
  mocks.overview.mockReset();
  mocks.generate.mockReset();
  mocks.summaryOptions = null;
  vi.restoreAllMocks();
});

describe("Memories summary", () => {
  it("gera automaticamente ao visualizar a viagem, exibe o texto salvo e permite atualizar", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    mocks.auth.mockReturnValue({ data: { authenticated: true }, isLoading: false });
    mocks.overview.mockReturnValue({
      data: { summary: { totalKm: 1024, completedKm: 512, futureKm: 512, issuedTrips: 1 }, trips: [trip] },
      isLoading: false,
    });
    mocks.generate.mockImplementation((input: unknown) => mocks.summaryOptions.onMutate(input));

    render(<Memories />);

    await waitFor(() => {
      expect(mocks.generate).toHaveBeenCalledWith({ year: 2026, weekNumber: 12, force: false });
    });
    fireEvent.click(screen.getByRole("button", { name: "Abrir resumo" }));
    expect(screen.getByText("Fly.IA está preparando este resumo...")).toBeTruthy();

    await act(async () => {
      await mocks.summaryOptions.onSuccess(
        { summary: { id: 1, summary: "Uma viagem entre Guarulhos e Navegantes.", model: "gemini-2.5-flash", generatedAt: new Date() }, generated: true },
        { year: 2026, weekNumber: 12, force: false }
      );
      await mocks.summaryOptions.onSettled();
    });

    expect(screen.getByText("Uma viagem entre Guarulhos e Navegantes.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Atualizar resumo" }));
    expect(mocks.generate).toHaveBeenLastCalledWith({ year: 2026, weekNumber: 12, force: true });
  });
});
