## 2024-04-26 - Icon-only Buttons Missing ARIA Labels
**Learning:** Found multiple instances where icon-only buttons (using Lucide React components) were using `title` tooltips but lacked screen-reader-accessible `aria-label`s. This seems to be a recurring pattern when developers prioritize visual tooltips over semantic accessibility.
**Action:** Always check newly introduced icon-only buttons for explicit `aria-label` attributes to ensure they are accessible via keyboard navigation and screen readers.

## 2024-04-28 - Missing ARIA States on Toggle Buttons
**Learning:** Found custom toggle buttons (like airline filters) styled visually to represent selected/unselected states, but lacking `aria-pressed` attributes. This prevents screen readers from understanding the current state of the toggle.
**Action:** When reviewing or implementing custom toggle buttons, ensure `aria-pressed={boolean}` is bound to the state variable that controls the visual selection.
