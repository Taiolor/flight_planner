import { describe, expect, it, vi, afterEach } from "vitest";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should throw an error in production if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    await expect(import("./_core/env")).rejects.toThrow(
      "JWT_SECRET environment variable is required in production"
    );
  });

  it("should use a dynamically generated fallback secret in development if JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const { ENV } = await import("./_core/env");
    expect(typeof ENV.cookieSecret).toBe("string");
    expect(ENV.cookieSecret.length).toBe(64); // 32 bytes hex encoded is 64 chars
  });

  it("should use the provided JWT_SECRET if present", async () => {
    process.env.JWT_SECRET = "super-secret-key";

    const { ENV } = await import("./_core/env");
    expect(ENV.cookieSecret).toBe("super-secret-key");
  });
});
