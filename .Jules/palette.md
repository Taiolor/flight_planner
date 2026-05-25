## 2024-10-24 - Custom Accordion/Card Toggles Lack Keyboard Accessibility
**Learning:** Custom clickable `div` elements used as card toggles or accordions in this app often rely solely on `onClick` handlers, rendering them completely inaccessible to keyboard users (no tab order, no `Enter`/`Space` activation, no focus ring).
**Action:** When identifying such patterns, always add `role="button"`, `tabIndex={0}`, an `onKeyDown` handler (that checks for `e.key === 'Enter' || e.key === ' '` and calls `e.preventDefault()` for space to prevent scrolling), and `focus-visible:ring-2` to restore baseline accessibility.
## 2025-05-18 - Missing labels on Home inputs
**Learning:** Raw HTML `<input>` elements in complex grid layouts (like those in `Home.tsx` used for flight dates/PNR entries) are grouped under visual label-like elements, but lack a formal `id` + `htmlFor` association, making them inaccessible to screen readers.
**Action:** Add localized `aria-label` tags (e.g., "Data de Ida") explicitly mapping the intended field semantic to every isolated `<input>` to satisfy keyboard navigation and screen reader constraints.
