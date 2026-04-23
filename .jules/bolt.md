## 2024-05-14 - React Re-renders Optimization Learning

**Learning:** Found an opportunity to optimize performance by reducing unnecessary operations during renders in large React components. The `Home.tsx` component is quite large (>2300 lines) and calculates derived state frequently.
**Action:** Extract reusable inner components using `React.memo` or memoize intermediate results using `useMemo` when rendering long lists. Avoid recalculating functions in render blocks if they can be memoized or lifted out.
