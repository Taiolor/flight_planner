## 2025-02-12 - Added ARIA Labels to Interactive Buttons

**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.

## 2023-10-27 - Add aria-labels to navigation buttons

**Learning:** Back navigation buttons (like "Voltar") that just say "Voltar" or use an icon without context may not provide enough information for screen reader users on where the button navigates to.

**Action:** Add `aria-label="Voltar para a página inicial"` to back navigation buttons to provide clear context for screen reader users and comply with WCAG 2.5.3.
