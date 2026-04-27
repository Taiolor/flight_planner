## 2026-04-27 - Inaccurate Session Cookie Regex Parsing

**Vulnerability:** A regex (`new RegExp(`${SESSION_COOKIE}=([^;]+)`)`) was being used to parse cookies. This leads to a substring match vulnerability, meaning `attacker_flight_session=abc` would be valid since it matches `flight_session=abc`.
**Learning:** Using regex for parsing standard HTTP headers like cookies is error-prone. Prefix and suffix boundaries are essential but usually better to rely on well-tested standard libraries.
**Prevention:** Avoid custom substring matching and instead use the standard `cookie` npm package which maps cookie headers into an exact key-value store.
