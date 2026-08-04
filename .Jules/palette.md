## 2025-02-12 - Added ARIA Labels to Interactive Buttons

**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.

## 2025-02-12 - Added Loading Spinners to Async Buttons

**Learning:** Buttons triggering asynchronous mutations without explicit loading states lead to confusing user experiences, where users might click the button multiple times thinking the app is unresponsive. Combining the `disabled={isPending}` state with visual feedback (like replacing the static icon with a spinning `Loader2` from `lucide-react`) significantly improves the perceived performance and prevents accidental duplicate requests.
**Action:** When working with async operations (especially with tRPC `useMutation`), always check for `.isPending` and provide immediate visual feedback directly on the action button using a loading spinner alongside updating the button text (e.g., "Enviando...").
