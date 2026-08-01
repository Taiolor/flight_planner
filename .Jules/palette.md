## 2025-02-12 - Added ARIA Labels to Interactive Buttons
**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.
## 2026-08-01 - Spinner Feedback on Async Buttons
**Learning:** Adding explicit `Loader2` spinners to mutation buttons is a simple yet high-impact UX win. It prevents multiple submissions and clarifies application state during network delays. Ensure the spinner replaces the main icon to avoid layout shift.
**Action:** Always check `.isPending` on tRPC mutations attached to buttons and render an animated spinner.
