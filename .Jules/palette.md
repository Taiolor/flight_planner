## 2025-02-12 - Added ARIA Labels to Interactive Buttons

**Learning:** Native `<button>` elements functioning as icon-only toggles, download actions, or dataset filters critically need contextual `aria-label`s to be perceivable by screen readers. When these buttons are rendered inside a mapped list (like flight weeks), the `aria-label` must include the unique identifier (e.g., `weekNumber`) so screen readers can distinguish between identically purposed buttons.
**Action:** Always inject specific variables (like item IDs, titles, or week numbers) into the `aria-label` string when rendering interactive elements inside mapping loops. Use targeted string replacement instead of global formatting tools to keep PRs lean.
## 2024-05-19 - Adding context to Back buttons
**Learning:** WCAG 2.5.3 (Label in Name) requires that if an `aria-label` is added to an element that already has visible text, the visible text MUST be included within the `aria-label`. For example, a button showing just "Voltar" (Back) should use `aria-label="Voltar para a página inicial"` rather than just `"Página inicial"`, so that voice control users can still target it using its visible label.
**Action:** When making contextless buttons more accessible (like "Back" or "Read more"), always construct the `aria-label` by prefixing or suffixing the existing visible text.
