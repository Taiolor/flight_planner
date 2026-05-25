## 2024-05-24 - Centralized Cookie Security Config
**Vulnerability:** Insecure Direct Cookie Configuration
**Learning:** Hardcoding cookie security attributes (like `secure: process.env.NODE_ENV === "production"`) inline ignores request context, particularly behind proxies where `x-forwarded-proto` is needed to correctly set the `secure` flag, leading to potential session interception over HTTP.
**Prevention:** Always use the centralized `getSessionCookieOptions(req)` helper from `server/_core/cookies.ts` when setting session cookies to ensure consistent, proxy-aware security settings (including `sameSite: 'lax'` and proper `secure` flags).
