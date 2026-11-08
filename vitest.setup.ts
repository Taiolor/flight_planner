process.env.JWT_SECRET = "test-secret";
process.env.GEMINI_API_KEY = "dummy-key-for-testing";
process.env.AUTH_EMAIL = "test@example.com";

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = TestResizeObserver as typeof ResizeObserver;
}
