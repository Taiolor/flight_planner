🚨 **Severity:** MEDIUM
💡 **Vulnerability:** Unbounded string inputs in Zod validation schemas (like `email`, `password`, `name`, and dates) could allow attackers to submit extremely long strings. This could lead to Denial of Service (DoS) through resource exhaustion, particularly during expensive operations like SHA-256 hashing in the authentication flow.
🎯 **Impact:** An attacker could potentially crash or slow down the application by sending excessively large payloads to specific endpoints, degrading service for legitimate users.
🔧 **Fix:** Added `.max(255)` limits to string validation schemas in authentication and notification endpoints, and appropriate `.max(10)` or `.max(20)` limits to date/holiday inputs to ensure payloads remain small and manageable.
✅ **Verification:** Verified by running `pnpm test` and `pnpm run check` to ensure no legitimate use cases or types were broken.
