/** @vitest-environment jsdom */
import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HOME_DASHBOARD_PREFERENCES,
  HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
  persistHomeDashboardPreferences,
  readHomeDashboardPreferences,
} from "@/lib/homeDashboardPreferences";
import type { MobilePrimaryAction } from "@/lib/mobileExperience";
import { HomeHeaderActions } from "./HomeHeaderActions";

vi.mock("@/components/GlobalYearSelector", () => ({
  GlobalYearSelector: () => <button type="button">Ano 2026</button>,
}));

function PersistentMobileHeader() {
  const [preferences, setPreferences] = useState(() => readHomeDashboardPreferences());

  const updateMobilePrimaryAction = (mobilePrimaryAction: MobilePrimaryAction) => {
    const next = { ...preferences, mobilePrimaryAction };
    persistHomeDashboardPreferences(next);
    setPreferences(next);
  };

  return (
    <HomeHeaderActions
      selectedYear={2026}
      theme="light"
      colorPreset="ocean"
      colorPresetOptions={{ ocean: { name: "Azul" } }}
      hideValues={false}
      pushStatus="default"
      pushSubscribed={false}
      pushLoading={false}
      isAuthenticated={false}
      isAdmin={false}
      pdfExport={<button type="button">Exportar PDF</button>}
      onShowChart={vi.fn()}
      onToggleTheme={vi.fn()}
      onColorPresetChange={vi.fn()}
      onToggleValues={vi.fn()}
      onToggleNotifications={vi.fn()}
      onSignIn={vi.fn()}
      onSignOut={vi.fn()}
      mobilePrimaryAction={preferences.mobilePrimaryAction}
      onMobilePrimaryActionChange={updateMobilePrimaryAction}
    />
  );
}

describe("Home mobile action preference integration", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("reidrata a escolha salva e persiste a nova ação prioritária selecionada", () => {
    persistHomeDashboardPreferences({
      ...DEFAULT_HOME_DASHBOARD_PREFERENCES,
      mobilePrimaryAction: "passages",
    });

    const { container } = render(<PersistentMobileHeader />);
    const primaryLink = () =>
      container.querySelector<HTMLAnchorElement>("[data-mobile-primary-action]");

    expect(primaryLink()?.dataset.mobilePrimaryAction).toBe("passages");
    expect(primaryLink()?.getAttribute("href")).toBe("/gestao-passagens");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir preferências" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Calendário" }));

    expect(readHomeDashboardPreferences().mobilePrimaryAction).toBe("calendar");
    expect(primaryLink()?.dataset.mobilePrimaryAction).toBe("calendar");
    expect(primaryLink()?.getAttribute("href")).toBe("/calendar");
    expect(window.localStorage.getItem(HOME_DASHBOARD_PREFERENCES_STORAGE_KEY)).toContain(
      '"mobilePrimaryAction":"calendar"'
    );
  });
});
