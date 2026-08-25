/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackToTopButton } from "./BackToTopButton";

describe("BackToTopButton", () => {
  const originalScrollTo = window.scrollTo;
  const originalMatchMedia = window.matchMedia;
  let scrollY = 0;
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollY = 0;
    scrollTo = vi.fn();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: originalScrollTo,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("surge apenas após rolagem relevante e retorna suavemente ao topo", () => {
    render(<BackToTopButton />);
    expect(screen.queryByRole("button", { name: "Voltar ao topo" })).toBeNull();

    scrollY = 480;
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("remove a animação de rolagem quando o sistema reduz movimento", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    scrollY = 480;
    render(<BackToTopButton />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});
