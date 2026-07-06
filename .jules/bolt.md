## 2024-05-18 - Single-Pass Array Categorization

**Learning:** Replaced multiple O(N) `.filter()` array methods with a single-pass `for...of` loop inside a `useMemo` block. When separating elements of a single dataset into multiple distinct arrays based on enum values (e.g., status flags), doing it in a single pass reduces redundant loop executions and lowers intermediate memory allocations, particularly benefiting frequently re-rendered React components.
**Action:** Next time when encountering a pattern where an array is filtered multiple times sequentially for distinct non-overlapping categories, convert it to a single-pass loop approach using `useMemo`.

## 2024-06-26 - Parallelize Promise fetches for independent calls

**Learning:** When executing multiple independent asynchronous data fetching functions consecutively (like database queries), using sequential `await` introduces unnecessary latency. Converting them to a concurrent execution using `await Promise.all()` significantly decreases the total execution time since the queries run in parallel.
**Action:** When working on performance enhancements that involve multiple independent asynchronous requests (such as DB queries or HTTP requests), search for sequential `await` patterns and refactor them to `Promise.all` to reduce latency.

## 2024-07-06 - Pre-calculate static nested maps in render function
**Learning:** Functions that generate static complex structures (like nested arrays for calendar grids) are often called directly inside `Array.map` during a React render cycle, causing multiple O(N) allocations of arrays and objects like `Date`.
**Action:** When you spot static generating functions called inside a render `.map()`, hoist the calculation out to the component level wrapped in a `useMemo` and map over the pre-calculated array via an index lookup to eliminate O(N) allocation per map iteration.
