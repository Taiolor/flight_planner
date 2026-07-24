## 2024-05-18 - Redact sensitive data in public TRPC endpoints

**Vulnerability:** Insecure Direct Object Reference (IDOR) data leak in `getWeeks` public endpoint. Unauthenticated users were able to access sensitive flight locator and points information.
**Learning:** Returning entire database objects (`getAllFlightWeeks()`) from public endpoints without filtering can inadvertently expose sensitive data fields added later to the schema.
**Prevention:** In public endpoints that serve mixed authentication levels, explicitly verify the session using `getSessionFromCookie(ctx.req)` and selectively redact sensitive fields (like locators and points) before returning the response to unauthenticated users.
## 2023-10-27 - tRPC Authentication Rate Limiting

**Vulnerability:** The email/password login endpoint via tRPC (`flightAuth.login`) was missing specific authentication rate limits, falling back to a general 200 req / 15 mins limit, which is too generous for auth endpoints and susceptible to brute-forcing or credential stuffing.

**Learning:** Due to the nature of tRPC batching requests in a single generic `/api/trpc/*` endpoint, typical Express route rate limits (like `app.use('/api/oauth', limiter)`) do not automatically protect individual tRPC procedures. The path must be checked dynamically inside a middleware for the specific procedure name (e.g. `req.path.includes("flightAuth.login")`).

**Prevention:** When creating new tRPC endpoints that require rate limits (like authentication, sensitive actions), always ensure you add a custom Express middleware intercepting `/api/trpc/*` to check `req.path` and apply the limit. Use `req.path` instead of `req.originalUrl` to avoid bypasses via URL encoding and false positives via query parameters.
