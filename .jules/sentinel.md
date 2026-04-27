## 2026-04-27 - Fix Timing Attack in String Comparisons
**Vulnerability:** Timing leak in password and email comparisons via `crypto.timingSafeEqual` short-circuiting on differing lengths.
**Learning:** Using `crypto.timingSafeEqual(a, b)` only when `a.length === b.length` leaks information if an attacker controls one input. If lengths differ, the check fails instantly, allowing length-discovery.
**Prevention:** Hash both inputs (e.g., using SHA-256) before passing them to `crypto.timingSafeEqual`. Hashes will always be constant length, and hashing time is dependent only on the user-provided input length, mitigating timing side-channels without risking byte-length match errors.
