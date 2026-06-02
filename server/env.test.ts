import { describe, expect, it, vi, afterEach } from "vitest";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should throw an error if JWT_SECRET is missing in development", async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";

    await expect(import("./_core/env")).rejects.toThrow(
      "JWT_SECRET environment variable is required in all environments"
    );
  });

  it("should throw an error if JWT_SECRET is missing in production", async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";

    await expect(import("./_core/env")).rejects.toThrow(
      "JWT_SECRET environment variable is required in all environments"
    );
  });

  it("should use the provided JWT_SECRET if present", async () => {
    process.env.JWT_SECRET = "super-secret-key";

    const { ENV } = await import("./_core/env");
    expect(ENV.cookieSecret).toBe("super-secret-key");
  });
});
