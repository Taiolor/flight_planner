import { useEffect } from "react";

const splashId = "pwa-startup-splash";

/** Inicia a saída do splash estático sem bloquear a primeira renderização do React. */
export function dismissPwaStartupSplash() {
  const splash = document.getElementById(splashId);
  if (!splash) return () => {};

  const remove = () => splash.remove();
  splash.dataset.ready = "true";
  splash.addEventListener("transitionend", remove, { once: true });
  const fallback = window.setTimeout(remove, 700);

  return () => {
    splash.removeEventListener("transitionend", remove);
    window.clearTimeout(fallback);
  };
}

export function PwaStartupSplashController() {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => dismissPwaStartupSplash());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return null;
}
