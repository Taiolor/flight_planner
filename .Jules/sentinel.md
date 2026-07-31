## 2026-07-27 - Backend API Proxy Configuration

**Vulnerability:** Unauthenticated API Key Usage
**Learning:** Hardcoding API keys on the frontend to proxy endpoints leaves credentials exposed. A simple GET route for the initial script is insufficient for complex libraries like Google Maps which load dynamic chunks.
**Prevention:** Use a dedicated wildcard proxy middleware (`http-proxy-middleware`) on the backend to intercept all related requests, securely inject the backend API key before forwarding, and serve via a clean frontend route.

## 2024-05-27 - Remove unsafe-inline from CSP scriptSrc

**Vulnerability:** XSS risk via `'unsafe-inline'` in CSP `scriptSrc`.
**Learning:** The application had `'unsafe-inline'` allowed in its CSP purely for registering a Service Worker inline inside `index.html`.
**Prevention:** Extract all inline scripts to external `.ts` or `.js` files, allowing the CSP to drop `'unsafe-inline'` completely and protect against XSS injections.
