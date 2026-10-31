import { describe, expect, it, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret");

import { ENV } from "./env";
import { isScheduledRequest } from "./scheduledAuth";

const request = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} }) as any;

describe("scheduledAuth", () => {
  it("rejects missing or invalid scheduler credentials", () => {
    ENV.scheduleSecret = "schedule-secret";

    expect(isScheduledRequest(request())).toBe(false);
    expect(isScheduledRequest(request("Bearer wrong"))).toBe(false);
    expect(isScheduledRequest(request("Basic schedule-secret"))).toBe(false);
  });

  it("accepts the configured bearer secret", () => {
    ENV.scheduleSecret = "schedule-secret";

    expect(isScheduledRequest(request("Bearer schedule-secret"))).toBe(true);
  });
});
