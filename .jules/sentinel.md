## 2025-02-23 - Fixed SameSite=None Configured for Session Cookie
**Vulnerability:** The session cookie's SameSite attribute was conditionally set to "none" in production. This facilitates Cross-Site Request Forgery (CSRF) attacks.
**Learning:** Cookies mapped as SameSite=None make it easier for third-party sites to perform actions on behalf of the user because the cookie is automatically attached to cross-site requests.
**Prevention:** Always use at least SameSite=Lax (or Strict where appropriate) for session cookies to ensure they are not sent with cross-site requests unless it is a top-level navigation.
