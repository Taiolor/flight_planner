## 2026-07-27 - Backend API Proxy Configuration

**Vulnerability:** Unauthenticated API Key Usage
**Learning:** Hardcoding API keys on the frontend to proxy endpoints leaves credentials exposed. A simple GET route for the initial script is insufficient for complex libraries like Google Maps which load dynamic chunks.
**Prevention:** Use a dedicated wildcard proxy middleware (`http-proxy-middleware`) on the backend to intercept all related requests, securely inject the backend API key before forwarding, and serve via a clean frontend route.

## 2024-05-27 - Remove unsafe-inline from CSP scriptSrc

**Vulnerability:** XSS risk via `'unsafe-inline'` in CSP `scriptSrc`.
**Learning:** The application had `'unsafe-inline'` allowed in its CSP purely for registering a Service Worker inline inside `index.html`.
**Prevention:** Extract all inline scripts to external `.ts` or `.js` files, allowing the CSP to drop `'unsafe-inline'` completely and protect against XSS injections.

## 2024-05-27 - Information Disclosure via Stack Traces in Production

**Vulnerability:** The application was leaking stack traces and detailed internal error messages to clients during `INTERNAL_SERVER_ERROR` scenarios in tRPC endpoints.
**Learning:** By default, tRPC returns the original error message and stack trace if not explicitly handled, which can leak sensitive infrastructure details to end-users in production.
**Prevention:** Implement a secure custom `errorFormatter` during `initTRPC.create()` to intercept errors. Check the environment (`NODE_ENV === "production"`) and safely replace `INTERNAL_SERVER_ERROR` messages with a generic string and strip the `stack` trace completely in production environments.
