💡 What: Added explicit `id` and `htmlFor` bindings to the "SMILES", "LATAM PASS", and Airline price `<Input>` fields in the Home page.
🎯 Why: These inputs lacked proper label associations, relying entirely on visual context and placeholders. Adding visually hidden (`sr-only`) labels ensures complete context and accessibility for screen reader users.
📸 Before/After: Before, screen readers might not announce the purpose of these inputs clearly. Now, they are explicitly linked to invisible labels like "Pontos SMILES" and "Preço LATAM".
♿ Accessibility: Improved WCAG compliance by ensuring all form controls have explicitly associated `<label>` elements.
