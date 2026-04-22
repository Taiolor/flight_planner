
## 2024-05-18 - [Optimized getLowestPrice by memoizing into a map]
**Learning:** Found a performance bottleneck in `getLowestPrice` called in `client/src/pages/Home.tsx` which was performing `Object.values().map().filter()` inside an O(N) loop resulting in many array allocations.
**Action:** Replaced dynamic minimum calculations with a precomputed hash map populated in a `useMemo` block, leveraging a `for...in` loop which significantly improves performance, dropping operations from O(n) to O(1) inside `getLowestPrice`.
