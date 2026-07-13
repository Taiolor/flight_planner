<<<<<<< HEAD
1. **Consolidate multiple `useMemo` blocks for annual data in `client/src/pages/Home.tsx`.**
   - The components current have two separate `useMemo` blocks tracking similar things. One produces `annualSummaryData` and the other extracts metrics such as `annualTotalIssued`, `annualIssuedCount`, `annualSmilesTotal`, and `annualLatamPassTotal`.
   - Both of these blocks iterate over the same dataset (`weeksData`) to accumulate values per month and overall totals.
   - We can merge these two iterations into a single O(N) pass to reduce redundant array iteration overhead during re-renders, fulfilling the requirement for a Bolt optimization.
2. **Review correctness and type issues**
   - We need to correctly structure the return type and access them correctly since they will be returned from a single `useMemo`.
   - Destructure all required state properly: `const { annualSummaryData, annualTotalIssued, annualIssuedCount, annualSmilesTotal, annualLatamPassTotal } = useMemo(...)`.
3. **Execute standard Pre-commit Checks (Lint, Test, etc).**
   - Ensure `pnpm check` and `pnpm test` pass.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the Pull Request.**
   - Title: `⚡ Bolt: [performance improvement]`
   - Description format matching BOLT's requirement.
=======
1.  **Analyze the Issue:** As per the memory `palette.md` guidelines for UX and accessibility:
    - "Raw HTML `<input>` elements in complex grid layouts (like those in `Home.tsx` used for flight dates/PNR entries) are grouped under visual label-like elements, but lack a formal `id` + `htmlFor` association... Action: Add localized `aria-label` tags explicitly mapping the intended field semantic... OR use `id` + `htmlFor`."
    - Wait, the memory specifically says: "When rendering form inputs inside a mapped list (like weekly flight dates), visually associating them with a `span` fails WCAG. We must use a `<label>` and explicitly bind it to the input using globally unique IDs (e.g., combining field name and week number). Action: Always use `<label htmlFor="unique-id">` and `<input id="unique-id">` when rendering form fields inside a loop to ensure screen readers announce the correct field name."
2.  **Verify Code:** In `client/src/pages/Home.tsx`, the labels for "Data e Hora do Voo", "Número do Voo", and "Localizador (PNR)" (both Departure and Return) have `htmlFor` attributes, but the corresponding `<input>` elements are missing the matching `id` attributes.
    - `<label htmlFor={`departure-datetime-${week.weekNumber}`}>` but `<input aria-label="Data e Hora do Voo de Ida">` (missing `id={`departure-datetime-${week.weekNumber}`}`).
    - `<label htmlFor={`departure-flight-number-${week.weekNumber}`}>` but `<input aria-label="Número do Voo de Ida">` (missing `id={`departure-flight-number-${week.weekNumber}`}`).
    - `<label htmlFor={`departure-locator-${week.weekNumber}`}>` but `<input aria-label="Localizador do Voo de Ida">` (missing `id={`departure-locator-${week.weekNumber}`}`).
    - `<label htmlFor={`return-datetime-${week.weekNumber}`}>` but `<input aria-label="Data e Hora do Voo de Volta">` (missing `id={`return-datetime-${week.weekNumber}`}`).
    - `<label htmlFor={`return-flight-number-${week.weekNumber}`}>` but `<input aria-label="Número do Voo de Volta">` (missing `id={`return-flight-number-${week.weekNumber}`}`).
    - `<label htmlFor={`return-locator-${week.weekNumber}`}>` but `<input aria-label="Localizador do Voo de Volta">` (missing `id={`return-locator-${week.weekNumber}`}`).
3.  **Plan Steps:**
    - Modify `client/src/pages/Home.tsx` to add the missing `id` attributes to the 6 inputs mentioned above.
    - Run tests/lint to verify.
    - Create PR following Palette guidelines.
>>>>>>> d3d5b8e (🛡️ Sentinel: [HIGH] Fix IDOR in getWeeks endpoint)
