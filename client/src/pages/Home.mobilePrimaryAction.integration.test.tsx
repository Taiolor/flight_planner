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
const emptyQuery = { data: [], isLoading: false };
const authQuery = { data: { authenticated: false } };
const mutationResult = { mutate };
const themeState = {
  theme: "light",
  toggleTheme: vi.fn(),
  colorPreset: "ocean",
  setColorPreset: vi.fn(),
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
  PassageManagementFrame: () => null,
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
      getWeeks: { useQuery: () => emptyQuery },
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
    invalidate.mockClear();
    mutate.mockClear();
  });

  afterEach(() => window.localStorage.clear());

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
});
