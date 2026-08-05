## 2024-05-18 - Single-Pass Array Categorization

**Learning:** Replaced multiple O(N) `.filter()` array methods with a single-pass `for...of` loop inside a `useMemo` block. When separating elements of a single dataset into multiple distinct arrays based on enum values (e.g., status flags), doing it in a single pass reduces redundant loop executions and lowers intermediate memory allocations, particularly benefiting frequently re-rendered React components.
**Action:** Next time when encountering a pattern where an array is filtered multiple times sequentially for distinct non-overlapping categories, convert it to a single-pass loop approach using `useMemo`.

## 2024-06-26 - Parallelize Promise fetches for independent calls

**Learning:** When executing multiple independent asynchronous data fetching functions consecutively (like database queries), using sequential `await` introduces unnecessary latency. Converting them to a concurrent execution using `await Promise.all()` significantly decreases the total execution time since the queries run in parallel.
**Action:** When working on performance enhancements that involve multiple independent asynchronous requests (such as DB queries or HTTP requests), search for sequential `await` patterns and refactor them to `Promise.all` to reduce latency.

## 2024-07-03 - Single-Pass Array Categorization (Revisited)

**Learning:** Replaced multiple O(N) `.filter()` array methods with a single-pass `for...of` loop inside a `useMemo` block in `BrazilWorldCupPanel.tsx`, and similarly optimized multiple chained `.filter()`, `.reduce()`, and `.find()` calls in `worldCup2026.ts`. This reinforces the previous learning that when separating elements of a single dataset into multiple distinct categories or calculating multiple aggregate metrics, doing it in a single pass drastically reduces redundant loop executions and lowers intermediate memory allocations.
**Action:** Always look for chained array methods or multiple array iterations over the same data source and consolidate them into a single-pass loop, especially in frequently executed functions or React component renders.
## 2024-05-18 - Single-Pass vs Nested Iterations in React
**Learning:** Using chained array methods (like `.filter()`) inside `useMemo` hooks over larger datasets creates redundant temporary array allocations on every render pass, slowing down React reconciliation on dashboards. Using O(N) array methods (like `.find()`) inside mapped iterations significantly degrades performance (becoming O(N*M)) when dealing with nested projections.
**Action:** Replace `Array.find()` inside loops with a pre-initialized `Map` for O(1) lookups. Replace nested `.filter()` calls inside loops with single-pass imperative `for` loops that use `.push()` to prevent unnecessary array memory allocations.
