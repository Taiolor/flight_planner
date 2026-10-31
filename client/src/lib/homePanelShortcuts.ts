export function isPanelToggleShortcut(event: {
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

  return event.altKey && event.shiftKey && event.key.toLowerCase() === "e";
}

export function useHomePanelToggleShortcut(onToggle: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handlePanelShortcut = (event: KeyboardEvent) => {
      if (isPanelToggleShortcut(event)) {
        event.preventDefault();
        onToggle();
      }
    };

    window.addEventListener("keydown", handlePanelShortcut);
    return () => window.removeEventListener("keydown", handlePanelShortcut);
  }, [enabled, onToggle]);
}
import { useEffect } from "react";
