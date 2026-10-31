// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  dismissPwaStartupSplash,
  getPwaSplashSeason,
  preparePwaStartupSplash,
  setPwaStartupSplashProgress,
} from "./PwaStartupSplash";

describe("PwaStartupSplash", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("inicia a transição e remove a abertura quando ela termina", () => {
    document.body.innerHTML = '<div id="pwa-startup-splash"><span id="pwa-splash-status"></span><span id="pwa-splash-progress"></span></div><div id="root"></div>';

    const ready = vi.fn();
    window.addEventListener("smartfly:startup-ready", ready, { once: true });
    dismissPwaStartupSplash();

    const splash = document.getElementById("pwa-startup-splash");
    expect(splash?.dataset.ready).toBe("true");
    expect(ready).toHaveBeenCalledOnce();
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

  it("mostra percentual apenas após um marco real e identifica a estação atual", () => {
    document.body.innerHTML = '<div id="pwa-startup-splash"><span id="pwa-splash-status"></span><span id="pwa-splash-progress"></span></div>';
    const splash = document.getElementById("pwa-startup-splash")!;

    preparePwaStartupSplash(new Date(2026, 6, 10));
    setPwaStartupSplashProgress(42, "Iniciando experiência");

    expect(splash.dataset.season).toBe("winter");
    expect(splash.dataset.progressKnown).toBe("true");
    expect(splash.style.getPropertyValue("--pwa-splash-progress")).toBe("42%");
    expect(document.getElementById("pwa-splash-progress")?.textContent).toBe("42%");
    expect(getPwaSplashSeason(new Date(2026, 11, 10))).toBe("summer");
  });

  it("explica o modo offline sem impedir a abertura", () => {
    document.body.innerHTML = '<div id="pwa-startup-splash"><span id="pwa-splash-status"></span></div>';
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

    preparePwaStartupSplash(new Date(2026, 3, 10));

    expect(document.getElementById("pwa-startup-splash")?.dataset.connection).toBe("offline");
    expect(document.getElementById("pwa-splash-status")?.textContent).toContain("Sem conexão");
  });

  it("restaura uma mensagem contextual quando a conectividade volta", () => {
    document.body.innerHTML = '<div id="pwa-startup-splash"><span id="pwa-splash-status"></span></div>';
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });

    preparePwaStartupSplash(new Date(2026, 3, 10));

    expect(document.getElementById("pwa-startup-splash")?.dataset.connection).toBe("online");
    expect(document.getElementById("pwa-splash-status")?.textContent).toBe("Verificando a inicialização");
  });
});
