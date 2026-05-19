import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key validation", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.startsWith("re_")).toBe(true);
  });

  it("should create Resend client without throwing", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(() => new Resend(apiKey)).not.toThrow();
  });
});
