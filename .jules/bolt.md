## 2024-05-14 - React Re-renders Optimization Learning

**Learning:** Found an opportunity to optimize performance by reducing unnecessary operations during renders in large React components. The `Home.tsx` component is quite large (>2300 lines) and calculates derived state frequently.
**Action:** Extract reusable inner components using `React.memo` or memoize intermediate results using `useMemo` when rendering long lists. Avoid recalculating functions in render blocks if they can be memoized or lifted out.

## 2026-04-23 - Inefficient Nested Iteration

**Learning:** Using `Object.values` inside nested loops on large datasets (like `priceMap`) causes significant overhead due to repeated intermediate array allocations.
**Action:** Prefer `for...in` or `Object.entries` when you need to avoid unnecessary allocations in performance-critical hot paths.

## 2026-05-18 - Render Loop O(N) Array Operations

**Learning:** Running `filter`, `some`, and `reduce` operations on nested array structures (like `monthWeeks.filter(...)`) directly within the render loop creates significant performance bottlenecks, especially in complex components that re-render frequently (e.g. tracking sliders or expanding panels).
**Action:** Lift array computations into `useMemo` hooks, pre-calculating necessary aggregates and flags per group, so the render loop just reads pre-computed primitive values.
## 2026-05-19 - Render Loop O(N) Chained Array Methods

**Learning:** Nested `.map().filter().reduce()` chains inside `useMemo` hooks or render cycles create unnecessary garbage collection overhead by repeatedly allocating intermediate arrays.
**Action:** Replace functional array method chains with single-pass standard `for` or `for...of` loops to compute aggregates in hot paths, significantly reducing memory churn and CPU cycles per render.
