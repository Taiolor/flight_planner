/** @vitest-environment jsdom */
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeDashboardControls } from "./HomeDashboardControls";

describe("HomeDashboardControls", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/components/HomeDashboardControls.tsx"),
    "utf8"
  );

  it("expõe o comando global e permite marcar um painel como prioritário", () => {
    const onToggleAll = vi.fn();
    const onTogglePriority = vi.fn();

    render(
      <HomeDashboardControls
        theme="light"
        profile="complete"
        pinnedPanels={["summary"]}
        allPanelsOpen
        onProfileChange={vi.fn()}
        onToggleAll={onToggleAll}
        onTogglePriority={onTogglePriority}
        onMovePriority={vi.fn()}
      />
    );

    const globalButton = screen.getByRole("button", {
      name: "Recolher todos os quadros",
    });
    fireEvent.click(globalButton);
    fireEvent.click(screen.getByRole("button", { name: "Preços" }));

    expect(globalButton.getAttribute("aria-pressed")).toBe("true");
    expect(onToggleAll).toHaveBeenCalledOnce();
    expect(onTogglePriority).toHaveBeenCalledWith("priceVariation");
    expect(screen.getByLabelText("Selecionar perfil de layout")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resumo" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("permite reordenar controles fixados com ações de teclado acessíveis", () => {
    const onMovePriority = vi.fn();

    const { container } = render(
      <HomeDashboardControls
        theme="light"
        profile="custom"
        pinnedPanels={["summary", "filters"]}
        allPanelsOpen={false}
        onProfileChange={vi.fn()}
        onToggleAll={vi.fn()}
        onTogglePriority={vi.fn()}
        onMovePriority={onMovePriority}
      />
    );

    const getCurrentByRole = within(container).getByRole;
    const moveFiltersLeft = getCurrentByRole("button", {
      name: "Mover Filtros para a esquerda",
    });
    fireEvent.click(moveFiltersLeft);

    expect(moveFiltersLeft.hasAttribute("disabled")).toBe(false);
    expect(onMovePriority).toHaveBeenCalledWith("filters", "previous");
    expect(
      getCurrentByRole("button", { name: "Mover Resumo para a esquerda" })
    ).toHaveProperty("disabled", true);
  });

  it("aceita arrastar prioridades e oferece restauração e conjuntos nomeados", () => {
    const onReorderPriorities = vi.fn();
    const onRestoreDefaultOrder = vi.fn();
    const onSavePrioritySet = vi.fn();
    const onApplyPrioritySet = vi.fn();
    const onDeletePrioritySet = vi.fn();
    const { container } = render(
      <HomeDashboardControls
        theme="light"
        profile="custom"
        pinnedPanels={["summary", "filters"]}
        allPanelsOpen={false}
        onProfileChange={vi.fn()}
        onToggleAll={vi.fn()}
        onTogglePriority={vi.fn()}
        onMovePriority={vi.fn()}
        onReorderPriorities={onReorderPriorities}
        onRestoreDefaultOrder={onRestoreDefaultOrder}
        onSavePrioritySet={onSavePrioritySet}
        onApplyPrioritySet={onApplyPrioritySet}
        onDeletePrioritySet={onDeletePrioritySet}
        prioritySets={[{ id: "set-casa", name: "Casa", pinnedPanels: ["summary"] }]}
      />
    );

    const getCurrentByRole = within(container).getByRole;
    const summary = container.querySelector('[data-priority-panel="summary"]')!;
    const filters = container.querySelector('[data-priority-panel="filters"]')!;
    fireEvent.dragStart(summary);
    fireEvent.drop(filters);
    fireEvent.change(getCurrentByRole("textbox", { name: "Nome do conjunto de prioridades" }), {
      target: { value: "Trabalho" },
    });
    fireEvent.click(getCurrentByRole("button", { name: "Salvar conjunto" }));
    fireEvent.click(getCurrentByRole("button", { name: "Restaurar ordem" }));
    fireEvent.click(getCurrentByRole("button", { name: "Aplicar" }));
    fireEvent.click(getCurrentByRole("button", { name: "Excluir conjunto Casa" }));

    expect(onReorderPriorities).toHaveBeenCalledWith("summary", "filters");
    expect(onSavePrioritySet).toHaveBeenCalledWith("Trabalho");
    expect(onRestoreDefaultOrder).toHaveBeenCalledOnce();
    expect(onApplyPrioritySet).toHaveBeenCalledWith("set-casa");
    expect(onDeletePrioritySet).toHaveBeenCalledWith("set-casa");
  });

  it("mantém a faixa adaptável em telas móveis e desktop", () => {
    expect(source).toContain("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between");
    expect(source).toContain("h-10 w-full sm:w-44");
    expect(source).toContain("hidden rounded border border-current/20");
    expect(source).toContain("lg:inline");
    expect(source).toContain("flex flex-wrap gap-2");
    expect(source).toContain("flex h-9 w-8");
    expect(source).toContain("draggable={isPinned}");
    expect(source).toContain("flex flex-1 flex-col gap-2 sm:flex-row");
  });
});
