## 2024-05-18 - Single-Pass Array Categorization

**Learning:** Replaced multiple O(N) `.filter()` array methods with a single-pass `for...of` loop inside a `useMemo` block. When separating elements of a single dataset into multiple distinct arrays based on enum values (e.g., status flags), doing it in a single pass reduces redundant loop executions and lowers intermediate memory allocations, particularly benefiting frequently re-rendered React components.
**Action:** Next time when encountering a pattern where an array is filtered multiple times sequentially for distinct non-overlapping categories, convert it to a single-pass loop approach using `useMemo`.
## 2024-05-18 - Optimized Array Sorting Performance
**Learning:** Instantiating `new Date(string).getTime()` inside an array `.sort()` comparator creates extreme performance bottlenecks because the comparator executes O(N log N) times, repeatedly parsing strings and creating disposable objects.
**Action:** When sorting dates or any computed property, always compute the primitive numeric value (like `.getTime()`) once beforehand, attach it as a temporary property (e.g., `_alertTimeMs`) to each object during creation, sort comparing the primitive properties directly, and optionally delete the temporary property afterward.
