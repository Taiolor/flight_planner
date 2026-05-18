## 2024-05-14 - React Re-renders Optimization Learning

**Learning:** Found an opportunity to optimize performance by reducing unnecessary operations during renders in large React components. The `Home.tsx` component is quite large (>2300 lines) and calculates derived state frequently.
**Action:** Extract reusable inner components using `React.memo` or memoize intermediate results using `useMemo` when rendering long lists. Avoid recalculating functions in render blocks if they can be memoized or lifted out.

## 2026-04-23 - Inefficient Nested Iteration

**Learning:** Using `Object.values` inside nested loops on large datasets (like `priceMap`) causes significant overhead due to repeated intermediate array allocations.
**Action:** Prefer `for...in` or `Object.entries` when you need to avoid unnecessary allocations in performance-critical hot paths.

## 2026-05-18 - Render Loop O(N) Array Operations

**Learning:** Running `filter`, `some`, and `reduce` operations on nested array structures (like `monthWeeks.filter(...)`) directly within the render loop creates significant performance bottlenecks, especially in complex components that re-render frequently (e.g. tracking sliders or expanding panels).
**Action:** Lift array computations into `useMemo` hooks, pre-calculating necessary aggregates and flags per group, so the render loop just reads pre-computed primitive values.

## 2024-05-18 - Chained Array Operations in Render Paths

**Learning:** Chaining array methods like `.map().filter().reduce()` inside a React `useMemo` hook for data-heavy components (like charts) creates multiple intermediate arrays, leading to excessive garbage collection overhead.
**Action:** Replace chained array operations with single-pass standard `for` loops in performance-critical areas to minimize array allocations and memory usage.

## 2024-05-07 - Hoist Expensive Computations from O(N\*M) Loops

**Learning:** Found a nested loop `for (aviso of avisos) { for (week of weeks) { parseDate(week.date) } }` which evaluated `parseBrasiliaDatetime()` multiple times for the same week data. This causes O(N\*M) time complexity for a relatively expensive pure function (date parsing).
**Action:** Always pre-calculate (hoist) shared computations that depend on only one loop variable before entering multiple nested loops. Mapping an array to cache results transforms the time complexity to O(N+M) and avoids redundant execution.

## 2026-06-01 - Avoid Redundant Date Instantiations in Nested Loops

**Learning:** Instantiating `new Date()` inside nested loops is a common source of performance degradation in Node.js due to object allocation and garbage collection overhead. Pre-calculating boundaries in milliseconds and using standard arithmetic drastically improves throughput.
**Action:** Always seek to evaluate date logic by converting inputs to millisecond integers using `.getTime()` and hoisting calculation boundaries outside tight inner loops.
## 2026-05-15 - Optimization of getCurrentYearMonth
**Learning:** Caching the output string of frequently called static functions returning date ranges significantly improves local execution time.
**Action:** Evaluate using static strings to replace repetitive dynamic output that relies on the exact same parameters/context.

## 2024-05-18 - Database Query Single-Flight Caching

**Learning:** When multiple requests fetch the exact same data from the database concurrently (e.g., in a "thundering herd" scenario during server startup or traffic spikes), relying on just standard await without caching causes redundant database connections and queries for the same un-resolved outcome.
**Action:** Implement a "single-flight" caching mechanism by caching the Promise of the database operation itself in a module-level variable, returning the ongoing promise if one exists, and ensuring to clear it in a `finally` block once the operation completes.

## 2024-05-16 - Date Parsing Memoization in Single-Pass Iterations

**Learning:** When matching candidates across multiple specificities (e.g. day of week, hour), using chained `.filter().map()` causes both heavy array allocations and repeated execution of expensive pure functions like `new Date()` parsing on the same string for each pass.
**Action:** Replace multi-pass chains with a single-pass `for` loop that categorizes matches into maps/records simultaneously, and use a cache (`new Map()`) inside the loop to ensure strings are parsed into Dates exactly once per render operation.
## 2024-05-19 - Substring over Split for Date Parsing

**Learning:** When parsing known-length, standardized date strings (like `DD/MM/YYYY`) inside tight loops or frequently called utility functions, using `.split("/")` causes unnecessary intermediate array allocations and garbage collection overhead.
**Action:** Use `.substring()` with fixed offsets to extract date components and construct new strings to reduce memory allocations and improve string parsing performance.
