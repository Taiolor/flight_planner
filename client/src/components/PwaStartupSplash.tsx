import { useEffect } from "react";
import { formatPlanningSyncTimestamp, readLatestPlanningSyncTimestamp } from "@/lib/offlinePlanningSync";

const splashId = "pwa-startup-splash";
const splashFadeOutMs = 420;
const minimumSplashProgressVisibilityMs = 140;

export type PwaSplashSeason = "summer" | "autumn" | "winter" | "spring";

export function getPwaSplashSeason(date: Date = new Date()): PwaSplashSeason {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "summer";
  if (month <= 4) return "autumn";
  if (month <= 7) return "winter";
  return "spring";
}

function getSplashElements() {
  const splash = document.getElementById(splashId);
  return {
    splash,
    status: document.getElementById("pwa-splash-status"),
    progress: document.getElementById("pwa-splash-progress"),
  };
}

/** Atualiza apenas marcos concretos da abertura: montagem React, primeira pintura e transição. */
export function setPwaStartupSplashProgress(progress: number, message: string) {
  const { splash, status, progress: progressElement } = getSplashElements();
  if (!splash) return;
  const normalized = Math.max(0, Math.min(100, Math.round(progress)));
  splash.dataset.progressKnown = "true";
  splash.style.setProperty("--pwa-splash-progress", `${normalized}%`);
  if (status) status.textContent = message;
  if (progressElement) progressElement.textContent = `${normalized}%`;
}

export function preparePwaStartupSplash(date: Date = new Date()) {
  const { splash, status } = getSplashElements();
  if (!splash) return;
  splash.dataset.season = getPwaSplashSeason(date);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  splash.dataset.connection = offline ? "offline" : "online";
  if (status) {
    const lastSync = formatPlanningSyncTimestamp(readLatestPlanningSyncTimestamp());
    status.textContent = offline
      ? lastSync
        ? `Sem conexão — última sincronização: ${lastSync}`
        : "Sem conexão — nenhuma sincronização local disponível"
      : "Verificando a inicialização";
  }
}

/** Inicia a saída do splash estático sem bloquear a primeira renderização do React. */
export function dismissPwaStartupSplash() {
  const splash = document.getElementById(splashId);
  if (!splash) return () => {};

  setPwaStartupSplashProgress(100, "Pronto para decolar");
  const remove = () => splash.remove();
  document.getElementById("root")?.setAttribute("data-pwa-revealed", "true");
  splash.dataset.ready = "true";
  splash.addEventListener("transitionend", remove, { once: true });
  const fallback = window.setTimeout(remove, splashFadeOutMs + 180);

  return () => {
    splash.removeEventListener("transitionend", remove);
    window.clearTimeout(fallback);
  };
}

export function PwaStartupSplashController() {
  useEffect(() => {
    preparePwaStartupSplash();
    setPwaStartupSplashProgress(42, "Iniciando experiência");
    const updateConnectivity = () => preparePwaStartupSplash();
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    let dismissCleanup: (() => void) | undefined;
    const firstFrame = window.requestAnimationFrame(() => {
      setPwaStartupSplashProgress(76, "Preparando seu painel de viagens");
    });
    const dismissTimer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        dismissCleanup = dismissPwaStartupSplash();
      });
    }, minimumSplashProgressVisibilityMs);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(dismissTimer);
      dismissCleanup?.();
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  return null;
}
