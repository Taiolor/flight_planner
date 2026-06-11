## 2024-10-24 - Custom Accordion/Card Toggles Lack Keyboard Accessibility

**Learning:** Custom clickable `div` elements used as card toggles or accordions in this app often rely solely on `onClick` handlers, rendering them completely inaccessible to keyboard users (no tab order, no `Enter`/`Space` activation, no focus ring).
**Action:** When identifying such patterns, always add `role="button"`, `tabIndex={0}`, an `onKeyDown` handler (that checks for `e.key === 'Enter' || e.key === ' '` and calls `e.preventDefault()` for space to prevent scrolling), and `focus-visible:ring-2` to restore baseline accessibility.

## 2025-05-18 - Missing labels on Home inputs

**Learning:** Raw HTML `<input>` elements in complex grid layouts (like those in `Home.tsx` used for flight dates/PNR entries) are grouped under visual label-like elements, but lack a formal `id` + `htmlFor` association, making them inaccessible to screen readers.
**Action:** Add localized `aria-label` tags (e.g., "Data de Ida") explicitly mapping the intended field semantic to every isolated `<input>` to satisfy keyboard navigation and screen reader constraints.

## 2024-05-27 - Linking Collapsible Elements to their Content

**Learning:** In React components with custom expandable/collapsible sections (like the Week details in Home or Quote details in FlightQuotes), providing `aria-expanded` on the toggle button is not enough for full accessibility. Screen readers need `aria-controls` on the button to explicitly link it to the `id` of the expanded content container, allowing users to understand the relationship and navigate smoothly.
**Action:** Always ensure that custom accordion or toggle components link their trigger button to their target content using matching `aria-controls` and `id` attributes.
## 2026-06-11 - Protecting Destructive Actions

**Learning:** Implementing the AlertDialog for delete actions requires careful wrapping around the specific destructive trigger icon. Utilizing the Radix/Shadcn UI pattern ensures accessibility via 'asChild' and isolates the action inside the AlertDialogAction component seamlessly.
**Action:** When adding confirm dialogs using Shadcn AlertDialog, replace the direct onClick of the trigger button with the AlertDialogAction onClick, and use 'asChild' on the Trigger to retain the button's native styling and behavior.
