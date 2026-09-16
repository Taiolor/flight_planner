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

## 2024-10-24 - Custom Accordion/Card Toggles Lack Keyboard Accessibility

**Learning:** Custom clickable `div` elements used as card toggles or accordions in this app often rely solely on `onClick` handlers, rendering them completely inaccessible to keyboard users (no tab order, no `Enter`/`Space` activation, no focus ring).
**Action:** When identifying such patterns, always add `role="button"`, `tabIndex={0}`, an `onKeyDown` handler (that checks for `e.key === 'Enter' || e.key === ' '` and calls `e.preventDefault()` for space to prevent scrolling), and `focus-visible:ring-2` to restore baseline accessibility.

## 2025-05-18 - Missing labels on Home inputs

**Learning:** Raw HTML `<input>` elements in complex grid layouts (like those in `Home.tsx` used for flight dates/PNR entries) are grouped under visual label-like elements, but lack a formal `id` + `htmlFor` association, making them inaccessible to screen readers.
**Action:** Add localized `aria-label` tags (e.g., "Data de Ida") explicitly mapping the intended field semantic to every isolated `<input>` to satisfy keyboard navigation and screen reader constraints.

## 2024-05-27 - Linking Collapsible Elements to their Content

**Learning:** In React components with custom expandable/collapsible sections (like the Week details in Home or Quote details in FlightQuotes), providing `aria-expanded` on the toggle button is not enough for full accessibility. Screen readers need `aria-controls` on the button to explicitly link it to the `id` of the expanded content container, allowing users to understand the relationship and navigate smoothly.
**Action:** Always ensure that custom accordion or toggle components link their trigger button to their target content using matching `aria-controls` and `id` attributes.

## 2026-06-09 - Tooltips on Disabled Buttons

**Learning:** Disabled HTML elements (like `button disabled`) do not fire pointer events in many browsers, making tooltips invisible to users precisely when they need an explanation the most.
**Action:** When adding an informative tooltip to explain why a button is disabled, always wrap the disabled button in a `span` or `div` with `tabIndex={0}`. Apply `focus-visible` styling and ensure the wrapper spans the full width of its content so the tooltip trigger area perfectly covers the button.

## 2026-06-11 - Protecting Destructive Actions

**Learning:** Implementing the AlertDialog for delete actions requires careful wrapping around the specific destructive trigger icon. Utilizing the Radix/Shadcn UI pattern ensures accessibility via 'asChild' and isolates the action inside the AlertDialogAction component seamlessly.
**Action:** When adding confirm dialogs using Shadcn AlertDialog, replace the direct onClick of the trigger button with the AlertDialogAction onClick, and use 'asChild' on the Trigger to retain the button's native styling and behavior.

## 2024-06-16 - Tooltips on Disabled Elements via Shadcn/Radix UI

**Learning:** Adding a Radix `<Tooltip>` directly to a disabled native HTML element (like `<button disabled>`) doesn't work because the element doesn't emit pointer events when disabled, preventing the tooltip from appearing when hovered.
**Action:** Always wrap the disabled trigger element inside a focusable container, such as a `<span tabIndex={0} className="focus-visible:ring-2 ...">`, and use `<TooltipTrigger asChild>` on this wrapper so the tooltip correctly triggers on hover or focus even when the inner element is disabled.

## 2024-05-18 - Missing ID and htmlFor attributes on standard HTML range sliders

**Learning:** In standard HTML inputs like `<input type="range">` built using custom sliders, the associated `<label>` text must correctly link to the `input` field via `htmlFor` and `id` properties. Unlike component-based frameworks where these attributes are often autogenerated, omitting them here directly results in inputs lacking accessible names, which breaks usability for screen reader users.
**Action:** When adding or reviewing filter controls with native HTML form elements like ranges or checkboxes, verify that matching `id` and `htmlFor` props are explicitly set and functional.

## 2025-03-05 - Label Overrides Dynamic Text

**Learning:** Applying an `aria-label` to an element (like a button) completely overrides its inner text for screen readers. If the button contains dynamic visible text or counts (e.g., `Alerts (5)`), the `aria-label` will hide this critical information from assistive technologies, causing an accessibility regression.
**Action:** Before adding an `aria-label` to a button, check its inner children and text content. Only use `aria-label` on true icon-only buttons or elements without sufficient visible text. If the element dynamically updates, use other ARIA attributes (like `aria-expanded`) or visually hidden screen-reader-only spans instead of overriding the entire element name.

## 2025-03-05 - Placeholder is Not a Label

**Learning:** Input fields that rely solely on `placeholder` attributes for visual context without a linked `<label>` tag fail WCAG accessibility standards, as screen readers may not consistently announce placeholders as labels.
**Action:** Always ensure every `<input>` has either a linked `<label htmlFor="id">` or an explicitly defined `aria-label` attribute that clearly describes its purpose.

## 2024-06-29 - Fixed screen reader unassociated labels in mapped lists

**Learning:** When rendering form inputs inside a mapped list (like weekly flight dates), visually associating them with a `span` fails WCAG. We must use a `<label>` and explicitly bind it to the input using globally unique IDs (e.g., combining field name and week number).
**Action:** Always use `<label htmlFor="unique-id">` and `<input id="unique-id">` when rendering form fields inside a loop to ensure screen readers announce the correct field name.

## 2024-05-18 - Missing ID and htmlFor attributes on standard HTML inputs

**Learning:** In standard HTML inputs like `<input type="range">`, `<input type="datetime-local">`, or `<input type="text">`, the associated `<label>` text must correctly link to the `input` field via matching `htmlFor` and `id` properties. When fields are mapped inside a loop, they often have visual labels but lack the proper `id` mapping (e.g. they only use an `aria-label`).
**Action:** When adding or reviewing form controls with native HTML elements in mapped arrays, verify that matching `id` and `htmlFor` props are explicitly set, appending unique values (e.g., `id={\`departure-datetime-\${week.weekNumber}\`}`) to ensure correct screen reader associations.

## 2024-05-28 - Missing ID and htmlFor on checkboxes in labels

**Learning:** When wrapping a standard `<input type="checkbox">` in a `<label>`, while visually and implicitly associated for some setups, strictly using `htmlFor` on the label and `id` on the input improves screen reader reliability and meets stricter accessibility guidelines.
**Action:** Ensure native checkbox and radio inputs explicitly use `id` and are matched with `htmlFor` on their labels, even when nested.

## 2024-05-28 - Missing ID and htmlFor on inputs lacking visible labels

**Learning:** When standard HTML `<input>` elements rely on `placeholder` attributes (e.g. for simple forms like "add email" or "test email") or have isolated `aria-label` tags, they still technically fail to meet robust form grouping standards without explicit `id` and `htmlFor` bindings to a `<label>` (which can be visually hidden using `sr-only` if design dictates).
**Action:** Always ensure that inputs, even simple inline ones with placeholders, have a linked `<label>` (using `sr-only` if necessary) with explicit `id` and `htmlFor` attributes to guarantee complete screen reader context.

## 2026-09-05 - Missing ID and htmlFor attributes on standard HTML range sliders in FinancialDashboard

**Learning:** In standard HTML inputs like `<input type="range">`, the associated `<label>` text must correctly link to the `input` field via `htmlFor` and `id` properties. Omitting them directly results in inputs lacking accessible names, which breaks usability for screen reader users.
**Action:** When adding or reviewing filter controls with native HTML form elements like ranges or checkboxes, verify that matching `id` and `htmlFor` props are explicitly set and functional.
