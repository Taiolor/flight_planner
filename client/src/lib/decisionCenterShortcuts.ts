import { useEffect } from "react";

export function isDecisionCenterToggleShortcut(event: {
  altKey: boolean;
  shiftKey: boolean;
  key: string;
  target: EventTarget | null;
}): boolean {
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("input, textarea, select, [contenteditable='true']")
  ) {
    return false;
  }

  return event.altKey && event.shiftKey && event.key.toLowerCase() === "d";
}

/** Atalho global da Central: Alt + Shift + D, ignorado durante edição de campos. */
export function useDecisionCenterToggleShortcut(onToggle: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleShortcut = (event: KeyboardEvent) => {
      if (!isDecisionCenterToggleShortcut(event)) return;
      event.preventDefault();
      onToggle();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [enabled, onToggle]);
}
