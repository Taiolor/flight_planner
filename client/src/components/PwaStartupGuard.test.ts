// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { productionCspDirectives } from "../../../server/_core/contentSecurityPolicy";

const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
const guardPath = html.match(/<script id="pwa-startup-guard" src="(\/[^\"]+)"><\/script>/)?.[1];
const guard = guardPath ? readFileSync(resolve(process.cwd(), "client/public", guardPath.slice(1)), "utf8") : "";

function runGuard() {
  document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  const callbacks = new Map<string, (event?: unknown) => void>();
  const reload = vi.fn();
  const fakeWindow = {
    addEventListener: vi.fn((name: string, listener: (event?: unknown) => void) => callbacks.set(name, listener)),
    removeEventListener: vi.fn((name: string) => callbacks.delete(name)),
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    location: { reload },
  };
  if (!guard) throw new Error("Guard estático ausente");
  new Function("document", "window", guard)(document, fakeWindow);
  return { callbacks, reload, fakeWindow };
}

const splash = () => document.getElementById("pwa-startup-splash")!;
const retry = () => document.getElementById("pwa-splash-retry") as HTMLButtonElement;

describe("recuperação independente do bundle React", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("instala a proteção antes do entry e preserva um retry acessível", () => {
    expect(html.indexOf('id="pwa-startup-guard"')).toBeLessThan(html.indexOf('id="app-entry"'));
    runGuard();
    expect(retry().hidden).toBe(true);
    expect(retry().type).toBe("button");
    expect(retry().getAttribute("aria-describedby")).toBe("pwa-splash-status");
  });

  it("usa um script same-origin com hash válido e preserva a CSP restritiva", () => {
    runGuard();
    const hash = createHash("sha256").update(guard).digest("hex").slice(0, 8);
    expect(guardPath).toBe(`/pwa-startup-guard.${hash}.js`);
    const script = document.getElementById("pwa-startup-guard")!;
    expect(script.textContent).toBe("");
    expect(script.hasAttribute("defer")).toBe(false);
    expect(script.hasAttribute("async")).toBe(false);
    expect(productionCspDirectives.scriptSrc).toContain("'self'");
    expect(productionCspDirectives.scriptSrc).not.toContain("'unsafe-inline'");
    expect(productionCspDirectives.scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("mostra erro após timeout sem revelar uma Home vazia nem recarregar automaticamente", () => {
    const { reload } = runGuard();
    vi.advanceTimersByTime(11999);
    expect(retry().hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(splash().dataset.startupError).toBe("true");
    expect(retry().hidden).toBe(false);
    expect(document.getElementById("pwa-splash-status")?.textContent).toContain("Não foi possível concluir");
    expect(splash().dataset.ready).toBeUndefined();
    expect(document.getElementById("root")?.dataset.pwaRevealed).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
    retry().click();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("detecta falha do entry imediatamente mas ignora imagens e scripts não relacionados", () => {
    const { callbacks } = runGuard();
    callbacks.get("error")?.({ target: { id: "analytics" } });
    expect(retry().hidden).toBe(true);
    callbacks.get("error")?.({ target: { id: "app-entry" } });
    expect(retry().hidden).toBe(false);
    expect(splash().dataset.ready).toBeUndefined();
  });

  it("cancela a proteção na saída real do splash, inclusive depois de um timeout", () => {
    const { callbacks, fakeWindow } = runGuard();
    vi.advanceTimersByTime(12000);
    expect(retry().hidden).toBe(false);
    callbacks.get("smartfly:startup-ready")?.();
    expect(retry().hidden).toBe(true);
    expect(splash().dataset.startupError).toBeUndefined();
    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith("error", expect.any(Function), true);
    vi.advanceTimersByTime(60000);
    expect(retry().hidden).toBe(true);
  });

  it("não substitui um splash já concluído ou removido por um erro tardio", () => {
    runGuard();
    splash().dataset.ready = "true";
    vi.advanceTimersByTime(12000);
    expect(retry().hidden).toBe(true);
    expect(splash().dataset.startupError).toBeUndefined();
  });

  it("usa o PNG institucional existente quando o WebP falha, sem criar loop de fallback", () => {
    runGuard();
    const logo = document.getElementById("pwa-splash-logo") as HTMLImageElement;
    expect(logo.getAttribute("src")).toContain("smartfly-sf-pwa-icon_783c04c6.webp");
    logo.dispatchEvent(new Event("error"));
    expect(logo.getAttribute("src")).toBe("/apple-touch-icon.png");
    expect(logo.dataset.fallbackUsed).toBe("true");
    logo.dispatchEvent(new Event("error"));
    expect(logo.getAttribute("src")).toBe("/apple-touch-icon.png");
    expect(readFileSync(resolve(process.cwd(), "client/public/apple-touch-icon.png")).subarray(1, 4).toString()).toBe("PNG");
  });

  it("a política do pnpm recusa explicitamente builds desnecessários em vez de bloquear o servidor", () => {
    const workspace = readFileSync(resolve(process.cwd(), "pnpm-workspace.yaml"), "utf8");
    expect(workspace).toMatch(/allowBuilds:[\s\S]*\n  pnpm: false/);
    expect(workspace).not.toContain("set this to true or false");
    expect(workspace).toContain("esbuild: true");
  });
});
