## 2026-07-27 - Backend API Proxy Configuration

**Vulnerability:** Unauthenticated API Key Usage
**Learning:** Hardcoding API keys on the frontend to proxy endpoints leaves credentials exposed. A simple GET route for the initial script is insufficient for complex libraries like Google Maps which load dynamic chunks.
**Prevention:** Use a dedicated wildcard proxy middleware (`http-proxy-middleware`) on the backend to intercept all related requests, securely inject the backend API key before forwarding, and serve via a clean frontend route.
