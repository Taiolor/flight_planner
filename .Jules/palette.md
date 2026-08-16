## 2025-02-12 - Added ARIA Labels to Interactive Buttons

**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.

## 2025-02-12 - Added Loading Spinners to Async Buttons

**Learning:** Buttons triggering asynchronous mutations without explicit loading states lead to confusing user experiences, where users might click the button multiple times thinking the app is unresponsive. Combining the `disabled={isPending}` state with visual feedback (like replacing the static icon with a spinning `Loader2` from `lucide-react`) significantly improves the perceived performance and prevents accidental duplicate requests.
**Action:** When working with async operations (especially with tRPC `useMutation`), always check for `.isPending` and provide immediate visual feedback directly on the action button using a loading spinner alongside updating the button text (e.g., "Enviando...").
## 2024-05-14 - Semantic Grouping of Tab Content in Shadcn UI
**Learning:** Custom tab implementations using styled `<button>` elements within `<div className="flex gap-1 ...">` wrappers completely break screen reader navigation if ARIA roles (`tablist`, `tab`, `tabpanel`) are omitted. Screen readers won't announce the number of tabs, which tab is selected, or associate the tab content with its trigger.
**Action:** When refactoring or encountering custom tab interfaces, ensure full screen-reader compatibility by adding `role="tablist"` to the container, `role="tab"`, `aria-selected`, and `aria-controls` to the tab triggers, and `role="tabpanel"` with `aria-labelledby` to the corresponding content panels.
