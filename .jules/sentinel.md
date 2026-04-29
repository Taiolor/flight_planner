
## 2024-05-24 - Expired Session Cleanup Vulnerability
**Vulnerability:** The `cleanExpiredSessions` function was using the `eq` operator instead of `lt` when checking if `authSessions.expiresAt` matched `now`.
**Learning:** Due to this bug, old sessions were not being properly deleted from the database unless their exact millisecond timestamp perfectly matched the moment the cleanup cron ran (practically impossible). This led to stale sessions polluting the database and leaving a potential window for token reuse.
**Prevention:** Always verify cleanup queries use the proper relative comparison operators (`lt`, `gt`, `lte`, `gte`) when checking date bounds to ensure comprehensive coverage, rather than exact equality (`eq`) which is rarely appropriate for dates.
