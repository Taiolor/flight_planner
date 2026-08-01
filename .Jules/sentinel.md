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
