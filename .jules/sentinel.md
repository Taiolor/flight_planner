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
