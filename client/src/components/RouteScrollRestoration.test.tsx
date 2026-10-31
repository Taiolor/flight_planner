/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteScrollRestoration } from "./RouteScrollRestoration";

let location = "/";

vi.mock("wouter", () => ({
  useLocation: () => [location],
}));

describe("RouteScrollRestoration", () => {
  const originalScrollTo = window.scrollTo;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  let scrollPosition = { left: 0, top: 0 };
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    location = "/";
    scrollPosition = { left: 0, top: 0 };
    scrollTo = vi.fn((options: ScrollToOptions) => {
      scrollPosition = {
        left: options.left ?? 0,
        top: options.top ?? 0,
      };
    });

    Object.defineProperty(window, "scrollX", {
      configurable: true,
      get: () => scrollPosition.left,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollPosition.top,
    });
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: originalScrollTo,
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: originalCancelAnimationFrame,
    });
  });

  it("inicia novas rotas no topo e restaura a posição ao retornar", () => {
    const { rerender } = render(<RouteScrollRestoration />);

    scrollPosition = { left: 0, top: 480 };
    location = "/calendar";
    rerender(<RouteScrollRestoration />);

    expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });

    scrollPosition = { left: 0, top: 160 };
    location = "/";
    rerender(<RouteScrollRestoration />);

    expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "auto",
      left: 0,
      top: 480,
    });
  });
});
