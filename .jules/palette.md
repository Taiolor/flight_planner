## 2024-04-26 - Icon-only Buttons Missing ARIA Labels
**Learning:** Found multiple instances where icon-only buttons (using Lucide React components) were using `title` tooltips but lacked screen-reader-accessible `aria-label`s. This seems to be a recurring pattern when developers prioritize visual tooltips over semantic accessibility.
**Action:** Always check newly introduced icon-only buttons for explicit `aria-label` attributes to ensure they are accessible via keyboard navigation and screen readers.

## 2024-04-28 - Missing ARIA States on Toggle Buttons
**Learning:** Found custom toggle buttons (like airline filters) styled visually to represent selected/unselected states, but lacking `aria-pressed` attributes. This prevents screen readers from understanding the current state of the toggle.
**Action:** When reviewing or implementing custom toggle buttons, ensure `aria-pressed={boolean}` is bound to the state variable that controls the visual selection.

## 2025-04-29 - [Added Clear Filters Action to Empty State]
**Learning:** Adding a "Clear Filters" button in an empty state when filters are overly restrictive significantly improves user recovery compared to forcing them to manually reset multiple filter inputs.
**Action:** Always include a mechanism to clear active filters directly from the empty state view to enhance the usability of search and filter interfaces.
## 2024-05-04 - Custom Toggle Button Accessibility
**Learning:** Custom segmented control toggle buttons, especially those inside flex layouts with `overflow-hidden`, often lack clear selected states for screen readers (`aria-pressed`) and visibly clipped focus rings during keyboard navigation.
**Action:** Always add `aria-pressed={condition}` to toggle buttons, and use `focus-visible:ring-inset` along with `focus-visible:ring-2` to prevent the focus ring from being clipped by `overflow-hidden` containers.
