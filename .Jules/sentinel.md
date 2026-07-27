## 2024-05-18 - Redact sensitive data in public TRPC endpoints

**Vulnerability:** Insecure Direct Object Reference (IDOR) data leak in `getWeeks` public endpoint. Unauthenticated users were able to access sensitive flight locator and points information.
**Learning:** Returning entire database objects (`getAllFlightWeeks()`) from public endpoints without filtering can inadvertently expose sensitive data fields added later to the schema.
**Prevention:** In public endpoints that serve mixed authentication levels, explicitly verify the session using `getSessionFromCookie(ctx.req)` and selectively redact sensitive fields (like locators and points) before returning the response to unauthenticated users.

## 2025-02-23 - Apply rate limiter dynamically for tRPC specific endpoints

**Vulnerability:** Missing rate limiting on specific endpoints like `flightAuth.login` inside `/api/trpc/*`. Attackers could brute-force the email/password since general TRPC only had a `generalLimiter` configured for 200 requests/15 minutes.
**Learning:** TRPC bundles endpoints under a single `/api/trpc/*` route. Simply placing a rate limiter on the whole `/api/trpc` applies the same rate limit broadly. To apply stricter rate limits to sensitive routes, a custom middleware before the main TRPC middleware is required to check `req.path.includes("endpoint.name")`.
**Prevention:** For sensitive TRPC endpoints requiring customized protection (like login/auth endpoints), insert a dedicated express middleware intercepting the specific path (via `req.path.includes`) before it hits the TRPC router handler, applying specific limiters like `authLimiter`.

## 2024-05-18 - Protect sensitive data in financial TRPC endpoints

**Vulnerability:** Insecure Direct Object Reference (IDOR) data leak in `financialRouter` endpoints (`getWeeklyData`, `getMonthlySummary`, `getYearSummary`, `getProjections`). Unauthenticated users were able to access sensitive financial data because they were protected with `publicProcedure`.
**Learning:** Using `publicProcedure` for sensitive financial data leaks business critical information (profits, losses, expenses, projections). Always carefully select the correct protected router middleware based on the sensitivity of the data returned.
**Prevention:** In TRPC, specifically when returning financial summaries or projections, verify that `flightProtectedProcedure` (or an equivalent authenticated middleware) is used instead of `publicProcedure`.
