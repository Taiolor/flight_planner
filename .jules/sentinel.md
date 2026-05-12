## 2026-04-27 - Inaccurate Session Cookie Regex Parsing
**Vulnerability:** A regex (`new RegExp(`${SESSION_COOKIE}=([^;]+)`)`) was being used to parse cookies. This leads to a substring match vulnerability, meaning `attacker_flight_session=abc` would be valid since it matches `flight_session=abc`.
**Learning:** Using regex for parsing standard HTTP headers like cookies is error-prone. Prefix and suffix boundaries are essential but usually better to rely on well-tested standard libraries.
**Prevention:** Avoid custom substring matching and instead use the standard `cookie` npm package which maps cookie headers into an exact key-value store.

## 2024-05-24 - Expired Session Cleanup Vulnerability
**Vulnerability:** The `cleanExpiredSessions` function was using the `eq` operator instead of `lt` when checking if `authSessions.expiresAt` matched `now`.
**Learning:** Due to this bug, old sessions were not being properly deleted from the database unless their exact millisecond timestamp perfectly matched the moment the cleanup cron ran (practically impossible). This led to stale sessions polluting the database and leaving a potential window for token reuse.
**Prevention:** Always verify cleanup queries use the proper relative comparison operators (`lt`, `gt`, `lte`, `gte`) when checking date bounds to ensure comprehensive coverage, rather than exact equality (`eq`) which is rarely appropriate for dates.

## 2024-05-27 - Information Disclosure via React Error Boundary
**Vulnerability:** The React error boundary component (`client/src/components/ErrorBoundary.tsx`) was rendering the raw stack trace (`error.stack`) directly to the UI, exposing internal code paths and potentially sensitive implementation details to end users.
**Learning:** Stack traces should only be visible to developers in a development environment to aid debugging. Leaking them in production introduces unnecessary risk and an unprofessional user experience.
**Prevention:** Use Vite's built-in `import.meta.env.DEV` flag to conditionally render stack traces, falling back to a generic message or just the standard `error.message` for production environments.
## 2026-04-28 - Insecure Random Token Generation
**Vulnerability:** The session token generation (`createAuthSession` in `server/db.ts`) relied on an unimported `crypto` object falling back to the global environment to call `getRandomValues`, combined with a manually chained `.map` over a `Uint8Array` to convert bytes to a hex string.
**Learning:** Depending on the global `crypto` object in Node.js instead of explicitly importing the native `crypto` module can lead to missing dependencies or inconsistent availability in different runtimes (or tests without the WebCrypto API globally exposed). Manual conversion of byte arrays to hex strings is also less robust and less standard.
**Prevention:** Always explicitly `import crypto from "crypto";` in Node.js applications and use the standard `crypto.randomBytes(32).toString('hex')` to generate secure, cryptographically random hex strings.
