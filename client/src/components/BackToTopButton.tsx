import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import React, { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 360;

/** Atalho discreto para retornar ao início sem encobrir os controles fixos existentes. */
export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!isVisible) return null;

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        })
      }
      className="fixed bottom-24 right-4 z-30 size-11 rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg shadow-slate-900/15 backdrop-blur transition-[transform,background-color,opacity] duration-150 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800 sm:bottom-20"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <ArrowUp className="size-4" aria-hidden="true" />
    </Button>
  );
}
