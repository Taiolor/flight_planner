## 2025-02-18 - Remove unsafe-inline CSP directive
**Vulnerability:** Insecure Content Security Policy (CSP) directive (`'unsafe-inline'`) for `script-src`, which could allow arbitrary script execution if an XSS vulnerability exists.
**Learning:** `unsafe-inline` was present in `script-src` solely for a small inline Service Worker registration script in `client/index.html`.
**Prevention:** Always refactor inline scripts into separate files or bundle them with the main application entry point instead of relaxing CSP directives globally.
