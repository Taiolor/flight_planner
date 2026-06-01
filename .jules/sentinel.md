## 2024-05-24 - Centralized Cookie Security Config

**Vulnerability:** Insecure Direct Cookie Configuration
**Learning:** Hardcoding cookie security attributes (like `secure: process.env.NODE_ENV === "production"`) inline ignores request context, particularly behind proxies where `x-forwarded-proto` is needed to correctly set the `secure` flag, leading to potential session interception over HTTP.
**Prevention:** Always use the centralized `getSessionCookieOptions(req)` helper from `server/_core/cookies.ts` when setting session cookies to ensure consistent, proxy-aware security settings (including `sameSite: 'lax'` and proper `secure` flags).

## 2024-06-18 - Strict JWT Secret Enforcement

**Vulnerability:** Insecure JWT Secret Fallback in Development
**Learning:** Relying on a dynamically generated random string (e.g., `randomBytes(32)`) as a fallback for a missing `JWT_SECRET` in development is insecure and error-prone. It causes session invalidation upon every server restart and creates a risk that local or testing environments don't properly simulate production security constraints.
**Prevention:** Strictly require the `JWT_SECRET` environment variable in all environments (including development) and throw a runtime Error if it is missing, rather than using random fallbacks.
