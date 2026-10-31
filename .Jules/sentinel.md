## 2026-07-27 - Backend API Proxy Configuration

**Vulnerability:** Unauthenticated API Key Usage
**Learning:** Hardcoding API keys on the frontend to proxy endpoints leaves credentials exposed. A simple GET route for the initial script is insufficient for complex libraries like Google Maps which load dynamic chunks.
**Prevention:** Use a dedicated wildcard proxy middleware (`http-proxy-middleware`) on the backend to intercept all related requests, securely inject the backend API key before forwarding, and serve via a clean frontend route.

## 2024-05-27 - Remove unsafe-inline from CSP scriptSrc

**Vulnerability:** XSS risk via `'unsafe-inline'` in CSP `scriptSrc`.
**Learning:** The application had `'unsafe-inline'` allowed in its CSP purely for registering a Service Worker inline inside `index.html`.
**Prevention:** Extract all inline scripts to external `.ts` or `.js` files, allowing the CSP to drop `'unsafe-inline'` completely and protect against XSS injections.

## 2026-08-01 - CSRF Protection in Session Cookies
**Vulnerability:** Cross-Site Request Forgery (CSRF) via `sameSite: "none"` cookie.
**Learning:** The session cookie was configured unconditionally with `sameSite: "none"`, making the application susceptible to CSRF if the API and Web share domains or if an attacker lures a user to a malicious site.
**Prevention:** Configure the session cookie with `sameSite: "lax"` when the API and frontend operate on the same origin/domain to mitigate cross-site request forgery attacks by default while allowing top-level navigations.

## 2026-08-01 - Input Validation Length Constraints
**Vulnerability:** Unbounded string inputs in validation schemas.
**Learning:** Zod's `z.string()` without limits allows arbitrary length inputs. When these are passed to expensive operations like password hashing (`crypto.timingSafeEqual` or future bcrypt implementations), it exposes the server to resource exhaustion Denial of Service (DoS) attacks.
**Prevention:** Always add `.max()` constraints (e.g., `.max(255)`) to authentication and user input fields in schemas.

## 2024-05-24 - Centralized Cookie Security Config

**Vulnerability:** Insecure Direct Cookie Configuration
**Learning:** Hardcoding cookie security attributes (like `secure: process.env.NODE_ENV === "production"`) inline ignores request context, particularly behind proxies where `x-forwarded-proto` is needed to correctly set the `secure` flag, leading to potential session interception over HTTP.
**Prevention:** Always use the centralized `getSessionCookieOptions(req)` helper from `server/_core/cookies.ts` when setting session cookies to ensure consistent, proxy-aware security settings (including `sameSite: 'lax'` and proper `secure` flags).

## 2024-06-18 - Strict JWT Secret Enforcement

**Vulnerability:** Insecure JWT Secret Fallback in Development
**Learning:** Relying on a dynamically generated random string (e.g., `randomBytes(32)`) as a fallback for a missing `JWT_SECRET` in development is insecure and error-prone. It causes session invalidation upon every server restart and creates a risk that local or testing environments don't properly simulate production security constraints.
**Prevention:** Strictly require the `JWT_SECRET` environment variable in all environments (including development) and throw a runtime Error if it is missing, rather than using random fallbacks.

## 2024-05-18 - [Standardize Authentication Middleware]

**Vulnerability:** Several TRPC endpoints (`publicProcedure`) were handling authorization via manual `getSessionFromCookie` checks inside the route handlers instead of relying on standard middleware. This is an anti-pattern that can easily lead to authorization bypasses if a developer forgets to add the manual check.
**Learning:** In TRPC, relying on repetitive manual checks inside resolvers instead of utilizing middlewares (e.g. `flightProtectedProcedure`) causes security gaps. While no explicit bypasses were found currently, standardizing access control into the router definition layer is a fundamental defense-in-depth practice.
**Prevention:** Always use defined protected procedure middlewares (like `flightProtectedProcedure` or `protectedProcedure`) to wrap secure endpoints. Never fall back to manual session validation via `publicProcedure` unless truly implementing an unprotected route.

## 2024-05-25 - Standardize Domain-Specific Authentication Middleware

**Vulnerability:** Authorization bypass via mixed middleware contexts. The `quotesRouter` in `server/routers/quotes.ts` was using the global `protectedProcedure` (which validates general OAuth users) instead of the domain-specific `flightProtectedProcedure` (which validates flight planner app-specific session cookies).
**Learning:** Using the wrong middleware allows cross-domain authorization bypasses. Even if a user is authenticated globally via Manus OAuth, they should not automatically have access to domain-specific features (like the flight planner) unless they pass that domain's specific auth checks (`flightAuth`).
**Prevention:** Always verify that the chosen protected procedure matches the intended domain of the router. For flight planner features, strictly import and use `flightProtectedProcedure` from `server/flightAuthMiddleware.ts`. Ensure middleware definitions are extracted into dedicated files to prevent circular dependencies when referenced across multiple routers.

## YYYY-MM-DD - [Prevent tRPC Information Leakage]
**Vulnerability:** tRPC exposes `INTERNAL_SERVER_ERROR` details to clients in production.
**Learning:** By default, if a tRPC resolver throws an unexpected error, the default `errorFormatter` can leak sensitive stack traces, paths, or database messages to the client, providing attackers with insights into the server architecture.
**Prevention:** Always configure the tRPC initialization with a custom `errorFormatter` that checks `ENV.isProduction` and explicitly masks the `INTERNAL_SERVER_ERROR` code with a generic message (e.g., 'Internal server error').

## 2024-10-27 - Centralized Environment Secret Management

**Vulnerability:** Insecure direct access to environment variables.
**Learning:** Reading sensitive secrets (like API keys and passwords) directly from `process.env` in scattered application files (e.g., `process.env.AUTH_PASSWORD`) increases the risk of secret leakage, makes it difficult to audit secret usage, and complicates validation/type-checking at application startup.
**Prevention:** Always consolidate environment variable access within a single module (e.g., `server/_core/env.ts`) that exports an `ENV` object. All other modules must import this object. Tests should mock or mutate this `ENV` object rather than relying on `vi.stubEnv` or `process.env`.

## 2024-10-30 - HTML Injection in Email Templates

**Vulnerability:** String interpolation in HTML templates without escaping.
**Learning:** Constructing HTML emails using template literals (e.g., in `server/routers.ts` or `server/_core/emailNotification.ts`) and directly interpolating user-controlled inputs (like flight numbers or locators) exposes the application to HTML Injection and potential Cross-Site Scripting (XSS) if viewed in a vulnerable client.
**Prevention:** Always sanitize user-provided variables using a strict `escapeHtml` helper function before inserting them into HTML string templates. Furthermore, ensure the `escapeHtml` function handles null checks correctly (`if (unsafe == null)`) so it does not incorrectly strip out the number zero (`0`).
## 2026-09-10 - Zod Max Length Limits for Unbounded Inputs

**Vulnerability:** Resource Exhaustion / Denial of Service (DoS) via excessively long string inputs.
**Learning:** Using `z.string()` without length boundaries for fields like `email` or `password` allows attackers to send arbitrarily large payloads (e.g., millions of characters). This can tie up the event loop during string parsing, trigger payload size limits downstream, or cause excessive CPU usage if the long string is passed to expensive hashing functions like `crypto.createHash('sha256')`.
**Prevention:** Always append explicit max length limits (e.g., `.max(255)`) to `z.string()` schemas for unbounded user inputs, especially for authentication and email-related fields.


## 2026-10-31 - Enforce Bounds on Quotes Router Inputs
**Vulnerability:** Unbounded string and numeric inputs in `quotesRouter` (`server/routers/quotes.ts`), specifically in `saveManual`, `fetchFromApi`, and `getByWeek`.
**Learning:** Leaving optional string fields (`airline`, `outboundAirline`, `returnAirline`, `outboundDeparture`, `outboundArrival`, `returnDeparture`, `returnArrival`) as bare `z.string().optional()` and numeric fields (`weekNumber`, `price`) without `.max()` bounds allows oversized payloads that can trigger database column truncation errors or memory/CPU exhaustion.
**Prevention:** Always pair `z.string()` and `z.number()` in tRPC input schemas with explicit `.max(...)` constraints aligned with the Drizzle database column definitions (`varchar(100)`, `varchar(32)`, `weekNumber <= 53`).

## 2026-10-31 - Enforce Input Bounds on System Procedures (`server/routers.ts`)

**Vulnerability:** Resource Exhaustion & Payload Abuse via Unbounded Input Schemas
**Learning:** Several tRPC endpoints in `server/routers.ts` (`shareByEmail`, `push.subscribe`, `flights.updateWeekDates`, `flights.savePrice`, and `ticketNotifications`) lacked `.max(...)` boundaries on strings (e.g. `endpoint`, `userAgent`, flight details) and integers (e.g. `weekNumber`, `emailId`). Attackers could submit massive payloads that consume excessive RAM during JSON/Zod parsing or trigger unexpected SQL errors downstream.
**Prevention:** Always specify precise `.max(...)` upper bounds on all Zod strings and numbers in tRPC procedures, mirroring expected network protocol standards and database storage limits.
