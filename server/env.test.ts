import { describe, expect, it, vi, afterEach } from "vitest";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("should throw an error if JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(import("./_core/env")).rejects.toThrow(
      "JWT_SECRET environment variable is required"
    );
  });

  it("should use the provided JWT_SECRET if present", async () => {
    process.env.JWT_SECRET = "super-secret-key";

    const { ENV } = await import("./_core/env");
    expect(ENV.cookieSecret).toBe("super-secret-key");
  });
});
