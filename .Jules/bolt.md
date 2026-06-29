## 2025-03-05 - Avoid String Replacement for Refactoring

**Learning:** When attempting to refactor complex TypeScript logic using string replacement methods (`replace`), it's incredibly easy to mismatch braces resulting in frustrating SyntaxErrors (like `Declaration or statement expected`). The replacement approach is fragile.
**Action:** When modifying a large code block, rewrite the targeted function/block carefully and precisely. Or, use an Abstract Syntax Tree (AST) transformer if possible. Do not rely on simple string or regex replacements for nested conditional logic.

## 2025-03-05 - Optimize Static Configurations Retrieval

**Learning:** Functions fetching relatively static configuration from a database (like `getTicketNotificationEmails`) can introduce N+1 or redundant DB calls if invoked multiple times per request or loop.
**Action:** Implement a short Time-to-Live (TTL) in-memory cache for the function response, and strictly invalidate it during any corresponding mutations (`addTicketNotificationEmail`, `removeTicketNotificationEmail`, etc.). Also refactor calling code to fetch exactly once per workflow context.
