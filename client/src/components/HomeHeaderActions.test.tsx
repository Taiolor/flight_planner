/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { HomeHeaderActions } from "./HomeHeaderActions";

vi.mock("@/components/GlobalYearSelector", () => ({
  GlobalYearSelector: () => <button type="button">Ano 2026</button>,
}));

describe("HomeHeaderActions", () => {
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
        isAdmin={false}
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

    fireEvent.click(screen.getByRole("button", { name: "Gráfico" }));

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
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });

  it("preserva a quebra controlada dos grupos em telas estreitas", () => {
    const source = readFileSync(
      "client/src/components/HomeHeaderActions.tsx",
      "utf8"
    );

    expect(source).toContain("flex w-full flex-nowrap items-center gap-1 sm:gap-2");
    expect(source).toContain("hidden h-10 px-3 sm:inline-flex");
    expect(source).toContain("h-10 w-10 shrink-0");
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

    const lines = container.querySelectorAll('[aria-label="Ações do planejamento"] > div');
    const scope = within(container);
    expect(lines).toHaveLength(2);
    expect(Array.from(lines).every(line => line.className.includes("flex-nowrap"))).toBe(true);
    expect(scope.getByRole("link", { name: "Calendário" }).className).toContain("h-10 w-10");
    expect(scope.getByRole("button", { name: "Gráfico" }).className).toContain("hidden h-10");
  });
});
