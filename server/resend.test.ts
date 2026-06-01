import { describe, it, expect, vi, afterEach } from "vitest";
import { Resend } from "resend";

describe("Resend API Key validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should have RESEND_API_KEY configured", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.startsWith("re_")).toBe(true);
  });

  it("should create Resend client without throwing", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    const apiKey = process.env.RESEND_API_KEY;
    expect(() => new Resend(apiKey)).not.toThrow();
  });
});
