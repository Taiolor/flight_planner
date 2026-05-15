## 2024-05-14 - Prevent Accidental Deletions with Confirmations
**Learning:** Adding a simple, native `window.confirm` to destructive actions (like deleting items) is a highly effective, low-effort UX improvement that prevents accidental data loss without requiring complex state management or new dialog components.
**Action:** When auditing list views or detail pages with delete buttons, look for missing confirmation steps and wrap the mutation logic in an `if (window.confirm("..."))` block to provide immediate, accessible friction against accidental clicks.
