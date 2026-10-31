// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TOOLTIP_COLLISION_PADDING,
  TOOLTIP_DELAY_MS,
  TOOLTIP_SIDE_OFFSET,
  TooltipLabel,
} from "./tooltip-label";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("TooltipLabel", () => {
  afterEach(() => cleanup());
  it("expõe a convenção global de posicionamento e atraso", () => {
    expect(TOOLTIP_DELAY_MS).toBe(350);
    expect(TOOLTIP_SIDE_OFFSET).toBe(6);
    expect(TOOLTIP_COLLISION_PADDING).toBe(8);
  });
  it("usa reposicionamento seguro para áreas com rolagem horizontal", () => {
    render(
      <TooltipLabel label="Ação horizontal">
        <button type="button" aria-label="Ação horizontal">
          Ação
        </button>
      </TooltipLabel>
    );

    const trigger = screen.getByRole("button", { name: "Ação horizontal" });
    fireEvent.focus(trigger);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.getAttribute("data-side")).toBe("bottom");
    expect(tooltip.className).toContain("max-w-[min(18rem,calc(100vw-1rem))]");
  });

  it("aplica fade suave e desativa animação não essencial com redução de movimento", () => {
    render(
      <TooltipLabel label="Ação suave">
        <button type="button" aria-label="Ação suave">
          Ação
        </button>
      </TooltipLabel>
    );

    fireEvent.focus(screen.getByRole("button", { name: "Ação suave" }));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("motion-safe:duration-150");
    expect(tooltip.className).toContain("data-[state=closed]:motion-safe:duration-100");
    expect(tooltip.className).toContain("motion-reduce:animate-none");
  });

  it("exibe a descrição visual no hover e mantém o controle sem title nativo", async () => {
    render(
      <TooltipLabel label="Mais opções">
        <button type="button" aria-label="Mais opções">
          Mais
        </button>
      </TooltipLabel>
    );

    const trigger = screen.getByRole("button", { name: "Mais opções" });
    expect(trigger.getAttribute("title")).toBeNull();

    fireEvent.pointerMove(trigger);

    expect((await screen.findByRole("tooltip")).textContent).toContain("Mais opções");
  });

  it("exibe a mesma descrição ao receber foco por teclado", async () => {
    render(
      <TooltipLabel label="Fechar painel">
        <button type="button" aria-label="Fechar painel">
          Fechar
        </button>
      </TooltipLabel>
    );

    fireEvent.focus(screen.getByRole("button", { name: "Fechar painel" }));

    expect((await screen.findByRole("tooltip")).textContent).toContain("Fechar painel");
  });
});
