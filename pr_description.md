💡 What:
Replaced repetitive icon-only `<button>` tags with the Shadcn `<Button variant="ghost" size="icon">` component in `Home.tsx` and `FlightQuotes.tsx`, and added unique identifiers to their `aria-label` and `title` attributes (e.g., `Expandir semana 5`, `Excluir cotação 10`). I also ensured that `aria-expanded` and `aria-controls` are properly bound where applicable.

🎯 Why:
To improve accessibility for screen reader users and to maintain structural consistency. When multiple identical-looking "Expand" or "Delete" icon buttons exist on a single page, screen readers previously only announced "Expandir", leaving the user guessing which item it affected. Injecting the unique item ID into the aria-label fixes this ambiguity.

📸 Before/After:
Before: Multiple buttons read as "Excluir semana" or "Expandir".
After: Buttons correctly announce their context, e.g., "Excluir semana 4" or "Expandir semana 4".

♿ Accessibility:
- Added dynamic IDs (`week.weekNumber`, `quote.id`) to `aria-label` and `title` attributes.
- Replaced native buttons with standard `<Button>` components for unified focus states.
- Ensured `aria-expanded` and `aria-controls` bindings are used for toggle buttons.
