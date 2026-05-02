## 2026-04-27 - Inaccurate Session Cookie Regex Parsing
**Vulnerability:** A regex (`new RegExp(`${SESSION_COOKIE}=([^;]+)`)`) was being used to parse cookies. This leads to a substring match vulnerability, meaning `attacker_flight_session=abc` would be valid since it matches `flight_session=abc`.
**Learning:** Using regex for parsing standard HTTP headers like cookies is error-prone. Prefix and suffix boundaries are essential but usually better to rely on well-tested standard libraries.
**Prevention:** Avoid custom substring matching and instead use the standard `cookie` npm package which maps cookie headers into an exact key-value store.

## 2024-05-24 - Expired Session Cleanup Vulnerability
**Vulnerability:** The `cleanExpiredSessions` function was using the `eq` operator instead of `lt` when checking if `authSessions.expiresAt` matched `now`.
**Learning:** Due to this bug, old sessions were not being properly deleted from the database unless their exact millisecond timestamp perfectly matched the moment the cleanup cron ran (practically impossible). This led to stale sessions polluting the database and leaving a potential window for token reuse.
**Prevention:** Always verify cleanup queries use the proper relative comparison operators (`lt`, `gt`, `lte`, `gte`) when checking date bounds to ensure comprehensive coverage, rather than exact equality (`eq`) which is rarely appropriate for dates.

## 2026-05-02 - Stack Trace Leakage in ErrorBoundary
**Vulnerability:** Information exposure through stack trace leakage.
**Learning:** The frontend `ErrorBoundary` was blindly rendering `error.stack` in production.
**Prevention:** Use `import.meta.env.DEV` in Vite to conditionally hide internal error details from end-users while keeping them in development.
