## 2024-05-18 - Redact sensitive data in public TRPC endpoints

**Vulnerability:** Insecure Direct Object Reference (IDOR) data leak in `getWeeks` public endpoint. Unauthenticated users were able to access sensitive flight locator and points information.
**Learning:** Returning entire database objects (`getAllFlightWeeks()`) from public endpoints without filtering can inadvertently expose sensitive data fields added later to the schema.
**Prevention:** In public endpoints that serve mixed authentication levels, explicitly verify the session using `getSessionFromCookie(ctx.req)` and selectively redact sensitive fields (like locators and points) before returning the response to unauthenticated users.

## 2024-06-25 - Prevent Rate Limit Bypass on specific tRPC Procedures

**Vulnerability:** Rate Limiter Evasion on specific sub-routes
**Learning:** Adding a generic `app.use("/api/oauth", authLimiter)` successfully protects OAuth routes, but tRPC procedures mapped to the same underlying endpoint (like `/api/trpc/flightAuth.login`) are not automatically protected by the stricter limiter unless explicitly captured by custom path evaluation logic before passing the request to the tRPC middleware.
**Prevention:** Always use a custom middleware before the main tRPC handler to dynamically check the request path (`req.path.includes('procedureName')`) and apply the strict rate limiter manually for sensitive endpoints like logins, as tRPC batches multiple procedures under a single generic `/api/trpc/*` prefix.
