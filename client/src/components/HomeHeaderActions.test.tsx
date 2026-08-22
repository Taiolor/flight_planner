/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeHeaderActions } from "./HomeHeaderActions";

vi.mock("@/components/GlobalYearSelector", () => ({
  GlobalYearSelector: () => <button type="button">Ano 2026</button>,
}));

describe("HomeHeaderActions", () => {
  afterEach(cleanup);

  it("mantém a ação primária visível e agrupa controles secundários de forma acessível", () => {
    const onShowChart = vi.fn();

    render(
      <HomeHeaderActions
        selectedYear={2026}
        theme="light"
        colorPreset="ocean"
        colorPresetOptions={{ ocean: { name: "Azul" } }}
        hideValues
        pushStatus="default"
        pushSubscribed={false}
        pushLoading={false}
        isAuthenticated={false}
        isAdmin
        pdfExport={<button type="button">Exportar PDF</button>}
        onShowChart={onShowChart}
        onToggleTheme={vi.fn()}
        onColorPresetChange={vi.fn()}
        onToggleValues={vi.fn()}
        onToggleNotifications={vi.fn()}
        onSignIn={vi.fn()}
        onSignOut={vi.fn()}
      />
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir navegação" }));
    expect(screen.getByRole("menuitem", { name: "Locais de Acesso" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Gráfico" }));

    expect(onShowChart).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Ações do planejamento")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Calendário" }).getAttribute("href")
    ).toBe("/calendar");
    expect(
      screen.getByRole("link", { name: "Abrir Gestão de Passagens" }).getAttribute("href")
    ).toBe("/gestao-passagens");
    expect(screen.getByRole("button", { name: "Abrir navegação" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Abrir preferências de aparência" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Abrir preferências de aparência" }).getAttribute("title")
    ).toBe("Aparência");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });

  it("usa uma View Transition ao abrir o Calendário quando o navegador oferece suporte", () => {
    const viewTransitionDocument = document as Document & {
      startViewTransition?: unknown;
    };
    const originalStartViewTransition = viewTransitionDocument.startViewTransition;
    const originalMatchMedia = window.matchMedia;
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(viewTransitionDocument, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    render(
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
      />
    );

    const calendarLink = screen.getByRole("link", { name: "Calendário" });
    fireEvent.click(calendarLink);

    expect(calendarLink.getAttribute("data-calendar-navigation")).toBe("true");
    expect(startViewTransition).toHaveBeenCalledOnce();

    Object.defineProperty(viewTransitionDocument, "startViewTransition", {
      configurable: true,
      value: originalStartViewTransition,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("preserva a quebra controlada dos grupos em telas estreitas", () => {
    const source = readFileSync(
      "client/src/components/HomeHeaderActions.tsx",
      "utf8"
    );

    expect(source).toContain("flex w-full flex-nowrap items-center gap-1 sm:gap-2");
    expect(source).toContain("<DropdownMenuItem onSelect={onShowChart}>");
    expect(source).toContain("h-10 w-10 shrink-0");
    expect(source).toContain("inline-flex h-10 w-10 shrink-0 items-center justify-center whitespace-nowrap");
    expect(source).toContain("sm:min-w-[6.75rem]");
    expect(source).toContain("data-mobile-primary-action={mobilePrimaryAction}");
    expect(source).toContain("data-calendar-navigation");
    expect(source).toContain("startViewTransition");
    expect(source).toContain("SlidersHorizontal");
    expect(source).toContain('title="Aparência"');
    expect(source).not.toContain('<span className="ml-1.5 hidden sm:inline">Aparência</span>');
    expect(source).toContain("hidden w-full sm:flex");
    expect(source).toContain('aria-label="Ações do planejamento"');
  });

  it("estrutura o mobile em exatamente dois grupos de controles sem quebra interna", () => {
    const { container } = render(
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
      />
    );

    const allGroups = Array.from(
      container.querySelectorAll('[aria-label="Ações do planejamento"] > div')
    );
    const mobileLines = allGroups.filter(
      line => !line.className.includes("hidden w-full sm:flex")
    );
    const scope = within(container);
    expect(mobileLines).toHaveLength(2);
    expect(mobileLines[0]?.className).toContain("flex-nowrap");
    expect(mobileLines[1]?.className).toContain("sm:hidden");
    expect(scope.getByRole("link", { name: "Calendário" }).className).toContain("h-10 w-10");
    expect(scope.queryByRole("button", { name: "Gráfico" })).toBeNull();
    expect(scope.getByRole("button", { name: "Abrir preferências" }).className).toContain("w-full");
  });

  it("agrupa os utilitários no menu móvel de preferências", () => {
    const { container } = render(
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
      />
    );

    fireEvent.pointerDown(
      within(container).getByRole("button", { name: "Abrir preferências" })
    );

    expect(screen.getByRole("menuitem", { name: "Usar modo escuro" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Ocultar valores" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Ativar notificações" })).toBeTruthy();
  });

  it("permite escolher a ação prioritária persistida no menu móvel", () => {
    const onMobilePrimaryActionChange = vi.fn();
    const onNavyIntensityChange = vi.fn();

    render(
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
        navyIntensity="standard"
        onNavyIntensityChange={onNavyIntensityChange}
        onToggleValues={vi.fn()}
        onToggleNotifications={vi.fn()}
        onSignIn={vi.fn()}
        onSignOut={vi.fn()}
        mobilePrimaryAction="calendar"
        onMobilePrimaryActionChange={onMobilePrimaryActionChange}
      />
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir preferências" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Gestão de Passagens" }));

    expect(onMobilePrimaryActionChange).toHaveBeenCalledWith("passages");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir preferências" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Intenso" }));

    expect(onNavyIntensityChange).toHaveBeenCalledWith("intense");
  });
});
