import { useEffect, useRef } from "react";
import { restoreNavigationFocus } from "@/lib/navigationFocus";
import { useLocation } from "wouter";

type ScrollPosition = {
  left: number;
  top: number;
};

/**
 * Mantém a posição de leitura de cada rota durante a sessão. Rotas ainda não
 * visitadas começam no topo; ao voltar, a posição previamente registrada é
 * restaurada sem animação para não conflitar com preferências de movimento.
 */
export function RouteScrollRestoration() {
  const [location] = useLocation();
  const positionsRef = useRef(new Map<string, ScrollPosition>());
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const route = location;
    const shouldRestore = hasMountedRef.current;
    const savedPosition = positionsRef.current.get(route);
    hasMountedRef.current = true;

    const animationFrame = shouldRestore
      ? window.requestAnimationFrame(() => {
          const position = savedPosition ?? { left: 0, top: 0 };
          window.scrollTo({ ...position, behavior: "auto" });
          restoreNavigationFocus(route);
        })
      : null;

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      positionsRef.current.set(route, {
        left: window.scrollX,
        top: window.scrollY,
      });
    };
  }, [location]);

  return null;
}
