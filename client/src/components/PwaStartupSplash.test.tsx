// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissPwaStartupSplash } from "./PwaStartupSplash";

describe("PwaStartupSplash", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("inicia a transição e remove a abertura quando ela termina", () => {
    document.body.innerHTML = '<div id="pwa-startup-splash"></div><div id="root"></div>';

    dismissPwaStartupSplash();

    const splash = document.getElementById("pwa-startup-splash");
    expect(splash?.dataset.ready).toBe("true");
    expect(document.getElementById("root")?.dataset.pwaRevealed).toBe("true");
    splash?.dispatchEvent(new Event("transitionend"));
    expect(document.getElementById("pwa-startup-splash")).toBeNull();
  });
});
