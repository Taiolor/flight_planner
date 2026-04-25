## 2025-02-18 - Secret length leaking timing attack prevention

**Vulnerability:** Length checks before `crypto.timingSafeEqual` in `flightAuth.login` were leaking the length of the expected email and password.
**Learning:** Checking lengths of buffers before performing constant-time comparisons (`crypto.timingSafeEqual`) creates a short-circuit if the lengths do not match. An attacker can use this to infer the exact length of a secret by systematically trying inputs of varying lengths.
**Prevention:** Rather than directly comparing the buffers and manually guarding with a length check, hash both inputs using a cryptographic hash function like SHA-256 before comparison. This ensures both buffers passed to `timingSafeEqual` have the same fixed length (e.g., 32 bytes for SHA-256) while guaranteeing constant-time execution and no length leakage.
