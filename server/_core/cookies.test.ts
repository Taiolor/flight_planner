import type { Request } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLegacySessionCookieOptions, getSessionCookieOptions } from "./cookies";

function request(protocol: string, forwardedProto?: string | string[]): Request {
  return { protocol, headers: forwardedProto ? { "x-forwarded-proto": forwardedProto } : {} } as Request;
}

afterEach(() => vi.unstubAllEnvs());

describe("session cookie policy", () => {
  it("uses a secure, HttpOnly, host-only partitioned cookie for the HTTPS development preview", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieOptions(request("https"))).toEqual({
      httpOnly: true, path: "/", secure: true, sameSite: "none", partitioned: true,
    });
  });

  it("recognizes HTTPS behind the development reverse proxy", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieOptions(request("http", "https"))).toMatchObject({ secure: true, sameSite: "none", partitioned: true });
    expect(getSessionCookieOptions(request("http", "http, https"))).toMatchObject({ secure: true, partitioned: true });
    expect(getSessionCookieOptions(request("http", ["https"]))).toMatchObject({ secure: true, partitioned: true });
  });

  it("never sets SameSite=None or Partitioned for HTTP localhost", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieOptions(request("http"))).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: false });
  });

  it("keeps the production cookie Lax even behind an HTTPS reverse proxy", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieOptions(request("https"))).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
    expect(getSessionCookieOptions(request("http", "https"))).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
  });

  it("does not broaden the cookie in tests or an unspecified environment", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(getSessionCookieOptions(request("https"))).not.toHaveProperty("partitioned");
    vi.stubEnv("NODE_ENV", "");
    expect(getSessionCookieOptions(request("https"))).not.toHaveProperty("partitioned");
  });

  it("uses the old host-only Lax scope solely for removing legacy cookies", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getLegacySessionCookieOptions(request("https"))).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
    expect(getLegacySessionCookieOptions(request("https"))).not.toHaveProperty("partitioned");
    expect(getLegacySessionCookieOptions(request("https"))).not.toHaveProperty("domain");
    expect(getLegacySessionCookieOptions(request("https"))).not.toHaveProperty("maxAge");
  });
});
