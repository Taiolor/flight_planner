/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HOME_DASHBOARD_PREFERENCES,
  persistHomeDashboardPreferences,
  readHomeDashboardPreferences,
} from "@/lib/homeDashboardPreferences";
import Home from "./Home";

const invalidate = vi.fn();
const mutate = vi.fn();
const emptyQuery = { data: [], isLoading: false, isFetching: false };
const weeksQuery = { data: [] as any[], isLoading: false, isFetching: false };
const authQuery = { data: { authenticated: false } };
const mutationResult = { mutate };
const themeState = {
  theme: "light",
  toggleTheme: vi.fn(),
  colorPreset: "ocean",
  setColorPreset: vi.fn(),
  navyIntensity: "standard" as const,
  setNavyIntensity: vi.fn(),
};
const pullToRefreshState = { pullDistance: 0, isRefreshing: false, isPulling: false };
const pushNotificationState = {
  status: "default",
  isSubscribed: false,
  isLoading: false,
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  sendTest: vi.fn(),
  isSendingTest: false,
};
const trpcUtils = {
  flightAuth: { check: { invalidate } },
  flights: {
    getWeeks: { invalidate },
    getProgressComparison: { invalidate },
    getPrices: { invalidate },
  },
};

vi.mock("@/contexts/ThemeContext", () => ({
  COLOR_PRESETS: { ocean: { name: "Azul" } },
  useTheme: () => themeState,
}));

vi.mock("@/contexts/YearContext", () => ({
  AVAILABLE_PLANNING_YEARS: [2026],
  useYear: () => ({ selectedYear: 2026 }),
}));

vi.mock("@/components/GlobalYearSelector", () => ({
  GlobalYearSelector: () => <button type="button">Ano 2026</button>,
}));

vi.mock("@/components/DeferredPdfExportButton", () => ({
  DeferredPdfExportButton: () => <button type="button">Exportar PDF</button>,
}));

vi.mock("@/components/auth/LoginModal", () => ({
  LoginModal: () => null,
}));

vi.mock("@/components/AdditionalFlightHeaderAction", () => ({
  AdditionalFlightHeaderAction: () => null,
}));

vi.mock("@/components/AnnualPlanningProgress", () => ({
  AnnualPlanningProgress: () => null,
}));

vi.mock("@/components/AttentionCenter", () => ({
  AttentionCenter: () => null,
}));

vi.mock("@/components/WeeklyPlanning", () => ({
  WeeklyPlanning: () => null,
}));

vi.mock("@/components/PassageManagementFrame", () => ({
  PassageManagementFrame: ({ children }: { children: React.ReactNode }) => (
    <section aria-label="Gestão de Passagens">{children}</section>
  ),
}));

vi.mock("@/components/HomeCharts", () => ({
  AnnualSpendChart: () => null,
  PriceVariationCharts: () => null,
}));

vi.mock("@/hooks/usePullToRefresh", () => ({
  usePullToRefresh: () => pullToRefreshState,
}));

vi.mock("@/hooks/usePushNotifications", () => ({
  usePushNotifications: () => pushNotificationState,
}));

vi.mock("@/lib/homePanelShortcuts", () => ({
  useHomePanelToggleShortcut: () => undefined,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: {
      check: { useQuery: () => authQuery },
      logout: { useMutation: () => mutationResult },
    },
    flights: {
      getWeeks: { useQuery: () => weeksQuery },
      getProgressComparison: { useQuery: () => emptyQuery },
      getPrices: { useQuery: () => emptyQuery },
      getPublicPrices: { useQuery: () => emptyQuery },
      ensureYearWeeks: { useMutation: () => mutationResult },
      updateWeekStatus: { useMutation: () => mutationResult },
      updateWeekDates: { useMutation: () => mutationResult },
      savePrice: { useMutation: () => mutationResult },
    },
    additionalFlights: {
      getYear: { useQuery: () => emptyQuery },
    },
    useUtils: () => trpcUtils,
  },
}));

describe("Home mobile primary action", () => {
  beforeEach(() => {
    window.localStorage.clear();
    weeksQuery.data = [];
    weeksQuery.isFetching = false;
    invalidate.mockClear();
    mutate.mockClear();
  });

  afterEach(() => window.localStorage.clear());

  it("oferece a marca Smart Fly como retorno acessível para a Home", () => {
    const { unmount } = render(<Home />);
    const brandHomeLink = screen.getByRole("link", {
      name: "Voltar para a página inicial",
    });
    const logoHomeLink = screen.getByRole("link", {
      name: "Voltar para a página inicial pelo logo Smart Fly",
    });

    expect(brandHomeLink.getAttribute("href")).toBe("/");
    expect(logoHomeLink.getAttribute("href")).toBe("/");
    unmount();
  });

  it("anuncia uma atualização suave sem ocultar a Home durante o refetch dos voos", () => {
    weeksQuery.isFetching = true;
    const view = render(<Home />);
    const refreshIndicator = view.container.querySelector("[data-flight-refreshing='true']");

    expect(refreshIndicator?.textContent).toContain("Atualizando dados de voo...");
    expect(refreshIndicator?.innerHTML).toContain("motion-reduce:animate-none");
    view.unmount();
  });

  it("persiste a troca no fluxo real da Home e reidrata o link prioritário após remontagem", () => {
    persistHomeDashboardPreferences({
      ...DEFAULT_HOME_DASHBOARD_PREFERENCES,
      mobilePrimaryAction: "passages",
    });

    const firstRender = render(<Home />);
    const primaryLink = () =>
      firstRender.container.querySelector<HTMLAnchorElement>("[data-mobile-primary-action]");

    expect(primaryLink()?.dataset.mobilePrimaryAction).toBe("passages");
    expect(primaryLink()?.getAttribute("href")).toBe("/gestao-passagens");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir preferências" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Calendário" }));

    expect(readHomeDashboardPreferences().mobilePrimaryAction).toBe("calendar");
    expect(primaryLink()?.dataset.mobilePrimaryAction).toBe("calendar");
    expect(primaryLink()?.getAttribute("href")).toBe("/calendar");

    firstRender.unmount();
    const rehydratedRender = render(<Home />);
    const rehydratedPrimaryLink = rehydratedRender.container.querySelector<HTMLAnchorElement>(
      "[data-mobile-primary-action]"
    );

    expect(rehydratedPrimaryLink?.dataset.mobilePrimaryAction).toBe("calendar");
    expect(rehydratedPrimaryLink?.getAttribute("href")).toBe("/calendar");
  });

  it("aplica a paleta azul-marinho aos controles e ao cabeçalho mensal da Gestão", () => {
    weeksQuery.data = [
      {
        weekNumber: 1,
        departureDate: "04/01/2026",
        returnDate: "09/01/2026",
        isTicketIssued: 1,
        isSelected: false,
        ticketType: "roundtrip",
      },
    ];

    const { container } = render(<Home mode="passage-management" />);
    const navyScopes = container.querySelectorAll(".management-navy-theme");

    expect(navyScopes.length).toBeGreaterThan(1);
    expect(screen.getByText("Gestão de Passagens")).toBeTruthy();
    expect(
      container.querySelector('.management-navy-theme input[type="range"]')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Expandir mês Janeiro 2026" })
    );

    expect(
      container.querySelector(".management-navy-theme .bg-blue-600")
    ).toBeTruthy();
  });
});
