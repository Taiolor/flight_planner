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
    expect(screen.getByRole("button", { name: "Abrir navegação" }).getAttribute("title")).toBeNull();
    expect(screen.getByRole("link", { name: "Calendário" }).getAttribute("title")).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir Gestão de Passagens" }).getAttribute("title")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Abrir preferências de aparência" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Abrir preferências de aparência" }).getAttribute("title")
    ).toBeNull();
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
    const headerSource = readFileSync("client/src/components/HomeHeaderActions.tsx", "utf8");
    expect(headerSource).toContain('aria-label="Abrir conta"');
    expect(headerSource).toContain("TooltipLabel");
    expect(headerSource).not.toContain("title=");

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

    expect(source).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(source).toContain("<DropdownMenuItem onSelect={onShowChart}>");
    expect(source).toContain("inline-flex h-10 shrink-0 items-center justify-center");
    expect(source).not.toContain('hidden whitespace-nowrap sm:inline');
    expect(source).toContain("sm:min-w-[6.75rem]");
    expect(source).toContain("data-mobile-primary-action={mobilePrimaryAction}");
    expect(source).toContain("data-calendar-navigation");
    expect(source).toContain("data-view-transition-destination");
    expect(source).toContain("navigateWithTransition");
    expect(source).toContain("startViewTransition");
    expect(source).toContain("SlidersHorizontal");
    expect(source).toContain('label="Aparência"');
    expect(source).not.toContain("title=");
    expect(source).not.toContain('<span className="ml-1.5 hidden sm:inline">Aparência</span>');
    expect(source).toContain("hidden w-full sm:flex");
    expect(source).toContain('aria-label="Ações do planejamento"');
    expect(source).toContain("data-mobile-value-visibility");
    expect(source).toContain("min-w-[88px]");
  });

  it("organiza rótulos na primeira linha e conta/preferências na segunda sem esconder os textos", () => {
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
      line => !line.hasAttribute("data-header-desktop-preferences")
    );
    const scope = within(container);
    expect(mobileLines).toHaveLength(3);
    expect(container.querySelector('[data-header-navigation]')?.className).toContain("col-span-2");
    expect(container.querySelector('[data-header-account-actions]')?.className).toContain("row-start-2");
    expect(container.querySelector('[data-header-mobile-preferences]')?.className).toContain("row-start-2");
    for (const name of ["Calendário", "Abrir Gestão de Passagens"]) {
      const link = scope.getByRole("link", { name });
      expect(link.className).toContain("h-10");
      expect(link.querySelector("span")?.className).not.toContain("hidden");
    }
    expect(scope.getByRole("button", { name: "Entrar" }).querySelector("span")?.className).not.toContain("hidden");
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

  it.each(["Painel de avisos", "Locais de Acesso", "Uso de IA"])(
    "mantém %s visível e solicita login sem navegar para dados protegidos",
    name => {
      const onSignIn = vi.fn();
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
          onSignIn={onSignIn}
          onSignOut={vi.fn()}
        />
      );
      fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir navegação" }));
      const item = screen.getByRole("menuitem", { name });
      const pathBeforeClick = window.location.pathname;
      expect(item.getAttribute("aria-description")).toContain("Login");
      fireEvent.click(item);
      expect(onSignIn).toHaveBeenCalledOnce();
      expect(window.location.pathname).toBe(pathBeforeClick);
    }
  );

  it("mantém os atalhos exclusivos desabilitados para uma conta sem papel administrativo", () => {
    const onSignIn = vi.fn();
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
        isAdmin={false}
        pdfExport={<button type="button">Exportar PDF</button>}
        onShowChart={vi.fn()}
        onToggleTheme={vi.fn()}
        onColorPresetChange={vi.fn()}
        onToggleValues={vi.fn()}
        onToggleNotifications={vi.fn()}
        onSignIn={onSignIn}
        onSignOut={vi.fn()}
      />
    );
    fireEvent.pointerDown(screen.getByRole("button", { name: "Abrir navegação" }));
    expect(screen.getByRole("menuitem", { name: "Painel de avisos" }).getAttribute("aria-disabled")).toBeNull();
    for (const name of ["Locais de Acesso", "Uso de IA"]) {
      const item = screen.getByRole("menuitem", { name });
      expect(item.getAttribute("aria-disabled")).toBe("true");
      expect(item.getAttribute("aria-description")).toContain("administradores");
      const pathBeforeClick = window.location.pathname;
      fireEvent.click(item);
      expect(window.location.pathname).toBe(pathBeforeClick);
    }
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it.each([
    { status: "unsubscribed", subscribed: false, loading: false, label: "Ativar notificações", disabled: false },
    { status: "subscribed", subscribed: true, loading: false, label: "Desativar notificações", disabled: false },
    { status: "unsupported", subscribed: false, loading: false, label: "Notificações indisponíveis neste ambiente", disabled: true },
    { status: "loading", subscribed: false, loading: true, label: "Atualizando notificações", disabled: true },
  ])("preserva os quatro controles desktop no estado $status", state => {
    const onToggleNotifications = vi.fn();
    const { container } = render(
      <HomeHeaderActions
        selectedYear={2026}
        theme="light"
        colorPreset="ocean"
        colorPresetOptions={{ ocean: { name: "Azul" } }}
        hideValues={false}
        pushStatus={state.status}
        pushSubscribed={state.subscribed}
        pushLoading={state.loading}
        isAuthenticated
        isAdmin
        notificationSettings={<button type="button" aria-label="Configurar agendamentos de notificação">Configurar</button>}
        pdfExport={<button type="button">Exportar PDF</button>}
        onShowChart={vi.fn()}
        onToggleTheme={vi.fn()}
        onColorPresetChange={vi.fn()}
        onToggleValues={vi.fn()}
        onToggleNotifications={onToggleNotifications}
        onSignIn={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    const controls = container.querySelector('[data-header-desktop-preferences]')!;
    expect(Array.from(controls.querySelectorAll("button")).map(button => button.getAttribute("aria-label"))).toEqual([
      "Abrir preferências de aparência",
      "Ocultar valores",
      state.label,
      "Configurar agendamentos de notificação",
    ]);
    const bell = within(controls as HTMLElement).getByRole("button", { name: state.label }) as HTMLButtonElement;
    expect(bell.disabled).toBe(state.disabled);
    expect(bell.getAttribute("aria-busy")).toBe(state.loading ? "true" : null);
    fireEvent.click(bell);
    expect(onToggleNotifications).toHaveBeenCalledTimes(state.disabled ? 0 : 1);
    expect(screen.getByRole("button", { name: "Abrir conta" })).toBeTruthy();
  });
});
