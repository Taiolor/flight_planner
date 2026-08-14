import { describe, it, expect, vi, afterEach } from "vitest";
import { Resend } from "resend";
import { ENV } from "./_core/env";

describe("Resend API Key validation", () => {
  afterEach(() => {
    ENV.resendApiKey = "";
  });

  it("should have RESEND_API_KEY configured", () => {
    ENV.resendApiKey = "re_test_123";
    const apiKey = ENV.resendApiKey;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.startsWith("re_")).toBe(true);
  });

  it("should create Resend client without throwing", () => {
    ENV.resendApiKey = "re_test_123";
    const apiKey = ENV.resendApiKey;
    expect(() => new Resend(apiKey)).not.toThrow();
  });
});
