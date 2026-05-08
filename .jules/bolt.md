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

## 2024-05-07 - Hoist Expensive Computations from O(N*M) Loops
**Learning:** Found a nested loop `for (aviso of avisos) { for (week of weeks) { parseDate(week.date) } }` which evaluated `parseBrasiliaDatetime()` multiple times for the same week data. This causes O(N*M) time complexity for a relatively expensive pure function (date parsing).
**Action:** Always pre-calculate (hoist) shared computations that depend on only one loop variable before entering multiple nested loops. Mapping an array to cache results transforms the time complexity to O(N+M) and avoids redundant execution.
