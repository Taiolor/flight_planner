1.  **Analyze the Issue:** As per the memory `palette.md` guidelines for UX and accessibility:
    *   "Raw HTML `<input>` elements in complex grid layouts (like those in `Home.tsx` used for flight dates/PNR entries) are grouped under visual label-like elements, but lack a formal `id` + `htmlFor` association... Action: Add localized `aria-label` tags explicitly mapping the intended field semantic... OR use `id` + `htmlFor`."
    *   Wait, the memory specifically says: "When rendering form inputs inside a mapped list (like weekly flight dates), visually associating them with a `span` fails WCAG. We must use a `<label>` and explicitly bind it to the input using globally unique IDs (e.g., combining field name and week number). Action: Always use `<label htmlFor="unique-id">` and `<input id="unique-id">` when rendering form fields inside a loop to ensure screen readers announce the correct field name."
2.  **Verify Code:** In `client/src/pages/Home.tsx`, the labels for "Data e Hora do Voo", "Número do Voo", and "Localizador (PNR)" (both Departure and Return) have `htmlFor` attributes, but the corresponding `<input>` elements are missing the matching `id` attributes.
    *   `<label htmlFor={`departure-datetime-${week.weekNumber}`}>` but `<input aria-label="Data e Hora do Voo de Ida">` (missing `id={`departure-datetime-${week.weekNumber}`}`).
    *   `<label htmlFor={`departure-flight-number-${week.weekNumber}`}>` but `<input aria-label="Número do Voo de Ida">` (missing `id={`departure-flight-number-${week.weekNumber}`}`).
    *   `<label htmlFor={`departure-locator-${week.weekNumber}`}>` but `<input aria-label="Localizador do Voo de Ida">` (missing `id={`departure-locator-${week.weekNumber}`}`).
    *   `<label htmlFor={`return-datetime-${week.weekNumber}`}>` but `<input aria-label="Data e Hora do Voo de Volta">` (missing `id={`return-datetime-${week.weekNumber}`}`).
    *   `<label htmlFor={`return-flight-number-${week.weekNumber}`}>` but `<input aria-label="Número do Voo de Volta">` (missing `id={`return-flight-number-${week.weekNumber}`}`).
    *   `<label htmlFor={`return-locator-${week.weekNumber}`}>` but `<input aria-label="Localizador do Voo de Volta">` (missing `id={`return-locator-${week.weekNumber}`}`).
3.  **Plan Steps:**
    *   Modify `client/src/pages/Home.tsx` to add the missing `id` attributes to the 6 inputs mentioned above.
    *   Run tests/lint to verify.
    *   Create PR following Palette guidelines.
