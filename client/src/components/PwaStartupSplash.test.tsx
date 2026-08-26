// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("mantém a animação de carregamento sutil e a desativa com redução de movimento", () => {
    const indexHtml = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

    expect(indexHtml).toContain("pwa-splash-logo-breathe");
    expect(indexHtml).toContain("pwa-splash-loader-beacon");
    expect(indexHtml).toContain("@media (prefers-reduced-motion: reduce)");
    expect(indexHtml).toContain(".pwa-splash-logo { animation: none; }");
    expect(indexHtml).toContain(".pwa-splash-loader::before { animation: none;");
  });
});
