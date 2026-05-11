## 2024-04-26 - Icon-only Buttons Missing ARIA Labels
**Learning:** Found multiple instances where icon-only buttons (using Lucide React components) were using `title` tooltips but lacked screen-reader-accessible `aria-label`s. This seems to be a recurring pattern when developers prioritize visual tooltips over semantic accessibility.
**Action:** Always check newly introduced icon-only buttons for explicit `aria-label` attributes to ensure they are accessible via keyboard navigation and screen readers.

## 2024-04-28 - Missing ARIA States on Toggle Buttons
**Learning:** Found custom toggle buttons (like airline filters) styled visually to represent selected/unselected states, but lacking `aria-pressed` attributes. This prevents screen readers from understanding the current state of the toggle.
**Action:** When reviewing or implementing custom toggle buttons, ensure `aria-pressed={boolean}` is bound to the state variable that controls the visual selection.

## 2025-04-29 - [Added Clear Filters Action to Empty State]
**Learning:** Adding a "Clear Filters" button in an empty state when filters are overly restrictive significantly improves user recovery compared to forcing them to manually reset multiple filter inputs.
**Action:** Always include a mechanism to clear active filters directly from the empty state view to enhance the usability of search and filter interfaces.
## 2024-05-06 - A11y on Custom Segmented Controls
**Learning:** Custom segmented controls (like the ticket type selector) often lack native radio button semantics, making them opaque to screen readers. Grouping them with `role="group"` and `aria-label`, along with adding `aria-pressed` to the individual buttons, significantly improves their accessibility.
**Action:** When implementing or updating custom toggle groups, always ensure the container has a `role="group"` and `aria-label`, and the buttons themselves manage `aria-pressed` states. Also remember to use `focus-visible:ring-inset` if the parent has `overflow-hidden`.

## 2024-05-10 - Consistently applied focus-visible
**Learning:** Found multiple native `<button>` elements that were missing focus states, hurting keyboard navigation accessibility. Using `focus:outline-none focus-visible:ring-2` combined with ring colors provides an accessible and aesthetically pleasing focus indicator that only appears during keyboard interaction.
**Action:** Always check newly added buttons or interactive elements to ensure they include explicit `focus-visible` styles when building new components or reviewing PRs.
## $(date +%Y-%m-%d) - Icon-only links accessibility
**Learning:** The `title` attribute is not a reliable substitute for `aria-label` for screen reader users on icon-only links. Furthermore, do not add `aria-label` to buttons that already contain meaningful text, as it overrides the accessible name.
**Action:** Always add explicit `aria-label` attributes to icon-only interactive elements (both buttons and links) to ensure proper screen reader announcements, and ensure that elements with text rely on their content.
