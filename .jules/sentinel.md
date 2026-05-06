## 2025-02-23 - Prevent Error Stack Leakage in Production

**Vulnerability:** Information disclosure via raw stack traces leaking in the production ErrorBoundary component (`client/src/components/ErrorBoundary.tsx`).
**Learning:** React ErrorBoundary components default to exposing `.stack` strings without environment conditional checks, leaving internal application structures exposed in production builds when exceptions bubble up.
**Prevention:** Use Vite's native environment check (`import.meta.env.DEV`) to conditionally render sensitive debugging information like stack traces only in local environments.
