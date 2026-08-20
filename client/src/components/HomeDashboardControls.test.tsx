/** @vitest-environment jsdom */
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("mantém a faixa adaptável em telas móveis e desktop", () => {
    expect(source).toContain("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between");
    expect(source).toContain("h-10 w-full sm:w-44");
    expect(source).toContain("hidden rounded border border-current/20");
    expect(source).toContain("lg:inline");
    expect(source).toContain("flex flex-wrap gap-2");
  });
});
