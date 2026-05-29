1. **Identify Performance Issue**: In `client/src/pages/Home.tsx`, inside the `expandedWeekCards.has(week.weekNumber)` render block, there's a closure `(() => { ... })()` that defines `const hoje = new Date();` and sets its hours to 0. This inner function is evaluated for _every_ week that is expanded. If multiple weeks are expanded or the component re-renders frequently, this instantiates many `Date` objects and recalculates today's date repeatedly. Also, pure functions like `parseBR`, `parseISO`, and constants like `todosJogos`, `fasesEliminatorias` are redefined inside this closure for every expanded week during every render.

2. **Plan**:
   - Hoist `hoje`, `hojeMs` (for faster comparison), `parseBR`, `parseISO`, `todosJogos`, and `fasesEliminatorias` outside of the render loop (or at least outside the `.map()` function for `monthWeeks` or `weeksByMonth`).
   - Since `hoje` represents the current date, it can be defined inside the component using `useMemo` so it's calculated once per render cycle (or once a day), avoiding redundant allocations per mapped week. However, the journal memory explicitly warns: "When optimizing React components in a Single Page Application (SPA), do not hoist dynamic, time-dependent values (like `new Date()` representing "today") to the global module scope, as they will only evaluate once on initial load and cause stale state bugs if the application is left open across time boundaries." So we must use `useMemo` inside the component instead of global scope.
   - Alternatively, define `const hojeMs = new Date().setHours(0, 0, 0, 0);` inside `Home` component body (or use useMemo) and pass it down.
   - Also, `parseBR`, `parseISO`, `todosJogos`, `fasesEliminatorias` are completely static and can be hoisted to the top level of the module (outside `Home` function) so they are only allocated once.
   - Finally, `calcDias` can be hoisted to the module level if we pass `hojeMs` to it.

3. **Actions to execute in `client/src/pages/Home.tsx`**:
   - **Global Scope (outside `Home`)**:
     - Move `parseBR`, `parseISO`, `todosJogos`, `fasesEliminatorias` to the top of the file, above `export default function Home() {`.
     - Move `calcDias` to module level, modifying its signature to accept `hojeMs: number` instead of capturing `hoje` from scope.
   - **Component Scope (inside `Home`)**:
     - Add `const hojeMs = useMemo(() => new Date().setHours(0, 0, 0, 0), []);` (Or just `const hojeMs = new Date().setHours(0, 0, 0, 0);` without useMemo, which is still much cheaper than instantiating the full arrays and objects repeatedly inside the nested loop).
   - **Refactor `(() => { ... })()` block**:
     - Update the references to use the hoisted constants and functions.
     - We can also refactor `calcDias(dataStr)` to `calcDias(dataStr, hojeMs)` where it's called.

4. **Verify**: Run `pnpm run check` and `pnpm run test` (if tests exist) to ensure no errors.
5. **Pre Commit Steps**: Call `pre_commit_instructions` tool.
6. **Submit**: Create PR with title "⚡ Bolt: [performance improvement]"
