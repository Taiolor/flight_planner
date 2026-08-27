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

  it("usa uma View Transition ao abrir os destinos principais e administrativos quando o navegador oferece suporte", () => {
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
        isAuthenticated
        isAdmin
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
    expect(calendarLink.getAttribute("data-view-transition-destination")).toBe("calendar");
    expect(startViewTransition).toHaveBeenCalledOnce();

    const passagesLink = screen.getByRole("link", { name: "Abrir Gestão de Passagens" });
    fireEvent.click(passagesLink);

    expect(passagesLink.getAttribute("data-view-transition-destination")).toBe("passages");
    expect(startViewTransition).toHaveBeenCalledTimes(2);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir navegação" }));
    const financialLink = screen.getByRole("menuitem", { name: "Financeiro" });
    fireEvent.click(financialLink);

    expect(financialLink.getAttribute("data-view-transition-destination")).toBe("financial");
    expect(startViewTransition).toHaveBeenCalledTimes(3);

    const quotesLink = screen.getByRole("menuitem", { name: "Cotações" });
    fireEvent.click(quotesLink);

    expect(quotesLink.getAttribute("data-view-transition-destination")).toBe("quotes");
    expect(startViewTransition).toHaveBeenCalledTimes(4);

    const memoriesLink = screen.getByRole("menuitem", { name: "Memórias" });
    fireEvent.click(memoriesLink);

    expect(memoriesLink.getAttribute("data-view-transition-destination")).toBe("memories");
    expect(startViewTransition).toHaveBeenCalledTimes(5);

    const changelogLink = screen.getByRole("menuitem", { name: "Novidades" });
    fireEvent.click(changelogLink);

    expect(changelogLink.getAttribute("data-view-transition-destination")).toBe("changelog");
    expect(startViewTransition).toHaveBeenCalledTimes(6);

    const adminNotificationsLink = screen.getByRole("menuitem", { name: "Painel de avisos" });
    fireEvent.click(adminNotificationsLink);

    expect(adminNotificationsLink.getAttribute("data-view-transition-destination")).toBe("admin-notifications");
    expect(startViewTransition).toHaveBeenCalledTimes(7);

    const telemetryLink = screen.getByRole("menuitem", { name: "Locais de Acesso" });
    fireEvent.click(telemetryLink);

    expect(telemetryLink.getAttribute("data-view-transition-destination")).toBe("telemetry");
    expect(startViewTransition).toHaveBeenCalledTimes(8);

    const geminiLink = screen.getByRole("menuitem", { name: "Uso de IA" });
    fireEvent.click(geminiLink);

    expect(geminiLink.getAttribute("data-view-transition-destination")).toBe("gemini");
    expect(startViewTransition).toHaveBeenCalledTimes(9);

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
    expect(source).toContain("data-view-transition-destination");
    expect(source).toContain("navigateWithTransition");
    expect(source).toContain("startViewTransition");
    expect(source).toContain("SlidersHorizontal");
    expect(source).toContain('title="Aparência"');
    expect(source).not.toContain('<span className="ml-1.5 hidden sm:inline">Aparência</span>');
    expect(source).toContain("hidden w-full sm:flex");
    expect(source).toContain('aria-label="Ações do planejamento"');
    expect(source).toContain("data-mobile-value-visibility");
    expect(source).toContain("min-w-[88px]");
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
    expect(scope.getByRole("button", { name: "Abrir preferências" }).className).toContain("flex-1");
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

  it("expõe o controle de valores diretamente no cabeçalho móvel", () => {
    const onToggleValues = vi.fn();
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
        onToggleValues={onToggleValues}
        onToggleNotifications={vi.fn()}
        onSignIn={vi.fn()}
        onSignOut={vi.fn()}
      />
    );

    const mobileValueControl = container.querySelector("[data-mobile-value-visibility]");
    expect(mobileValueControl).toBeTruthy();
    expect(mobileValueControl?.getAttribute("aria-label")).toBe("Ocultar valores");
    expect(mobileValueControl?.className).toContain("shrink-0");
    fireEvent.click(mobileValueControl!);
    expect(onToggleValues).toHaveBeenCalledOnce();
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
