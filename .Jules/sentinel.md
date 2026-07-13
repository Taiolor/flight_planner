## 2024-05-18 - Redact sensitive data in public TRPC endpoints

**Vulnerability:** Insecure Direct Object Reference (IDOR) data leak in `getWeeks` public endpoint. Unauthenticated users were able to access sensitive flight locator and points information.
**Learning:** Returning entire database objects (`getAllFlightWeeks()`) from public endpoints without filtering can inadvertently expose sensitive data fields added later to the schema.
**Prevention:** In public endpoints that serve mixed authentication levels, explicitly verify the session using `getSessionFromCookie(ctx.req)` and selectively redact sensitive fields (like locators and points) before returning the response to unauthenticated users.
