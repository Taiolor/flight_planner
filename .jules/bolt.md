## 2026-09-11 - Resolving N+1 Database Queries via Batching
**Learning:** Resolving N+1 database insertion bottlenecks within loops can be solved cleanly without compromising component reusability. By pre-allocating an array for data objects inside the outer execution context, passing it down to inner processing functions via reference (`Array.prototype.push`), and executing a single bulk insert using Drizzle ORM (`db.insert(table).values(data)`), we preserve the original functional modularity while eliminating sequential I/O overhead.
**Action:** When diagnosing N+1 database writes across sequential iterations or nested helper functions, implement in-memory accumulation to gather all required payloads, then execute a single batched write operation. Ensure related unit tests are updated to capture array arguments correctly (e.g., using `.toHaveBeenCalledWith([ { ... } ])`).


## 2026-10-31 - Hoist Intl.NumberFormat Singletons in FinancialDashboard
**Learning:** Constructing `new Intl.NumberFormat(...)` inside helper functions (`formatBRL` and `formatMiles`) in `FinancialDashboard.tsx` caused dozens of expensive locale formatter instantiations on every React render cycle across KPI cards, chart tooltips, and table rows.
**Action:** Always hoist `Intl.NumberFormat` and `Intl.DateTimeFormat` instances with static options to module-scoped constants (`BRL_FORMATTER`, `MILES_FORMATTER`) and call `.format(value)` inside render helpers.
