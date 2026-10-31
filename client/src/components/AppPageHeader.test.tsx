/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Bell } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppPageHeader } from "./AppPageHeader";

describe("AppPageHeader", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("oferece título, retorno acessível e área opcional de ações", () => {
    render(<AppPageHeader icon={Bell} title="Painel operacional" actions={<button>Atualizar</button>} />);

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Painel operacional" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar para a página inicial" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeTruthy();
  });

  it("faz uma transição acessível ao retornar de uma tela administrativa", () => {
    const viewTransitionDocument = document as Document & {
      startViewTransition?: unknown;
    };
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

    render(<AppPageHeader icon={Bell} title="Painel operacional" />);
    const backLink = screen.getByRole("link", { name: "Voltar para a página inicial" });
    fireEvent.click(backLink);

    expect(backLink.dataset.navigationFocus).toContain("page-back-");
    expect(startViewTransition).toHaveBeenCalledOnce();
  });
});
