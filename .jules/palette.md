## 2024-04-26 - Icon-only Buttons Missing ARIA Labels
**Learning:** Found multiple instances where icon-only buttons (using Lucide React components) were using `title` tooltips but lacked screen-reader-accessible `aria-label`s. This seems to be a recurring pattern when developers prioritize visual tooltips over semantic accessibility.
**Action:** Always check newly introduced icon-only buttons for explicit `aria-label` attributes to ensure they are accessible via keyboard navigation and screen readers.

## 2024-04-28 - Missing ARIA States on Toggle Buttons
**Learning:** Found custom toggle buttons (like airline filters) styled visually to represent selected/unselected states, but lacking `aria-pressed` attributes. This prevents screen readers from understanding the current state of the toggle.
**Action:** When reviewing or implementing custom toggle buttons, ensure `aria-pressed={boolean}` is bound to the state variable that controls the visual selection.

## 2025-04-29 - [Added Clear Filters Action to Empty State]
**Learning:** Adding a "Clear Filters" button in an empty state when filters are overly restrictive significantly improves user recovery compared to forcing them to manually reset multiple filter inputs.
**Action:** Always include a mechanism to clear active filters directly from the empty state view to enhance the usability of search and filter interfaces.
## 2024-05-24 - Missing Keyboard Accessibility on Raw Buttons
**Learning:** Raw `<button>` elements in the application were lacking visual focus indicators, creating an accessibility issue for keyboard navigation users. While standard UI components handled this correctly, custom interactive elements did not.
**Action:** Add `focus-visible:ring-2 focus-visible:ring-ring focus:outline-none` Tailwind utility classes to raw interactive elements to ensure they present clear visual indicators when focused via keyboard navigation.
