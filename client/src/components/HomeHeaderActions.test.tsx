/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

    fireEvent.click(screen.getByRole("button", { name: "Ver gráfico" }));

    expect(onShowChart).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Ações do planejamento")).toBeTruthy();
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

    expect(source).toContain(
      "flex w-full flex-wrap items-center justify-between gap-2"
    );
    expect(source).toContain("lg:flex-nowrap lg:justify-end");
    expect(source).toContain('aria-label="Ações do planejamento"');
  });
});
