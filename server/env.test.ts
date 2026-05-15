import { describe, expect, it, vi, afterEach } from "vitest";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should generate a random secret in dev when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";

    const { ENV } = await import("./_core/env");
    // In dev, a random 64-char hex string is generated instead of throwing
    expect(ENV.cookieSecret).toBeTruthy();
    expect(ENV.cookieSecret.length).toBe(64);
  });

  it("should throw an error if JWT_SECRET is missing in production", async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";

    await expect(import("./_core/env")).rejects.toThrow(
      "JWT_SECRET environment variable is required in production"
    );
  });

  it("should use the provided JWT_SECRET if present", async () => {
    process.env.JWT_SECRET = "super-secret-key";

    const { ENV } = await import("./_core/env");
    expect(ENV.cookieSecret).toBe("super-secret-key");
  });
});
