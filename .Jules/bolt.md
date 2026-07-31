## 2025-03-05 - Avoid String Replacement for Refactoring

**Learning:** When attempting to refactor complex TypeScript logic using string replacement methods (`replace`), it's incredibly easy to mismatch braces resulting in frustrating SyntaxErrors (like `Declaration or statement expected`). The replacement approach is fragile.
**Action:** When modifying a large code block, rewrite the targeted function/block carefully and precisely. Or, use an Abstract Syntax Tree (AST) transformer if possible. Do not rely on simple string or regex replacements for nested conditional logic.

## 2025-03-05 - Optimize Static Configurations Retrieval

**Learning:** Functions fetching relatively static configuration from a database (like `getTicketNotificationEmails`) can introduce N+1 or redundant DB calls if invoked multiple times per request or loop.
**Action:** Implement a short Time-to-Live (TTL) in-memory cache for the function response, and strictly invalidate it during any corresponding mutations (`addTicketNotificationEmail`, `removeTicketNotificationEmail`, etc.). Also refactor calling code to fetch exactly once per workflow context.

## 2025-03-05 - Avoid O(N\*M) Array Allocations in React Render Loop

**Learning:** Computations inside `.map` functions within JSX render cycles (such as array filtering and grouping logic) run on _every_ component update. For dynamic forms where keystrokes trigger re-renders, this can cause significant input lag due to thousands of redundant iterations and garbage-collected intermediate array allocations per keystroke.
**Action:** Consolidate expensive data derivations and object/array allocations into a single-pass `useMemo` block hoisted outside the render loop, tying it specifically to the lifecycle of the base data (e.g. `weeksData`), instead of placing it inside the `.map` render logic.

## 2025-03-05 - Direct Loop Instead of Multiple Array Filtering

**Learning:** Combining `.filter().map()` inside a component render loops forces React to allocate intermediate arrays on every render and loops over the elements twice.
**Action:** When mapping over items that were previously filtered from an array in a render loop, combine the logic into a direct `.map()` on the pre-filtered array (e.g. `feriadosIntervaloCopa.map(...)`) or use a traditional `for` loop to avoid intermediate allocations and reduce iteration count.

## 2026-07-28 - Optimize redundant upsert user query

**Learning:** In MySQL/Drizzle, `INSERT ... ON DUPLICATE KEY UPDATE` does not support returning the row directly. Faking the returned object locally (e.g. setting `id: 0`) is dangerous as it corrupts internal state. To implement an optimization, the `SELECT` query must be moved into the helper function (`upsertUser`) but protected by a `returnRecord` flag so hot paths do not execute unneeded SELECT statements.
**Action:** When asked to optimize redundant queries on MySQL upserts, avoid faking records. Use optional flags to gate follow-up queries inside the repository module to satisfy callers who need the object while keeping performance fast for callers who don't.
