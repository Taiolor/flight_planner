import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ENV } from "../env";
import * as db from "../../db";
import { COOKIE_NAME } from "@shared/const";
import type { Request } from "express";

const mockPost = vi.fn();

vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn().mockImplementation(() => ({
        post: (...args: any[]) => mockPost(...args)
      })),
    },
  };
});

// Use the proper mock injection pattern from the codebase guidelines
vi.mock("drizzle-orm/mysql2");

vi.mock("../../db", () => {
  return {
    getUserByOpenId: vi.fn(),
    upsertUser: vi.fn(),
  };
});

import { sdk } from "../sdk";

describe("sdk", () => {
  let originalEnv: typeof ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...ENV };
    ENV.appId = "test-app-id";
    ENV.cookieSecret = "super-secret-test-cookie-secret-1234567890";
    ENV.oAuthServerUrl = "https://test.oauth.server";
  });

  afterEach(() => {
    Object.assign(ENV, originalEnv);
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code for token successfully", async () => {
      mockPost.mockResolvedValueOnce({ data: { accessToken: "test-access-token" } });
      const state = btoa("https://redirect.uri");

      const result = await sdk.exchangeCodeForToken("test-code", state);

      expect(mockPost).toHaveBeenCalledWith(
        "/webdev.v1.WebDevAuthPublicService/ExchangeToken",
        {
          clientId: "test-app-id",
          grantType: "authorization_code",
          code: "test-code",
          redirectUri: "https://redirect.uri",
        }
      );
      expect(result).toEqual({ accessToken: "test-access-token" });
    });
  });

  describe("getUserInfo", () => {
    it("should get user info and derive login method", async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          openId: "test-open-id",
          platforms: ["REGISTERED_PLATFORM_GITHUB"],
        },
      });

      const result = await sdk.getUserInfo("test-access-token");

      expect(mockPost).toHaveBeenCalledWith(
        "/webdev.v1.WebDevAuthPublicService/GetUserInfo",
        { accessToken: "test-access-token" }
      );
      expect(result).toEqual({
        openId: "test-open-id",
        platforms: ["REGISTERED_PLATFORM_GITHUB"],
        platform: "github",
        loginMethod: "github",
      });
    });

    it("should derive fallback login method", async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          openId: "test-open-id",
          platform: "google",
        },
      });

      const result = await sdk.getUserInfo("test-access-token");
      expect(result.loginMethod).toBe("google");
    });
  });

  describe("Session Management", () => {
    it("should create and verify a session token", async () => {
      const token = await sdk.createSessionToken("test-open-id", { name: "Test User" });
      expect(typeof token).toBe("string");

      const payload = await sdk.verifySession(token);
      expect(payload).toEqual({
        openId: "test-open-id",
        appId: "test-app-id",
        name: "Test User",
      });
    });

    it("should return null for missing or invalid token", async () => {
      const result1 = await sdk.verifySession(undefined);
      expect(result1).toBeNull();

      const result2 = await sdk.verifySession("invalid-token-format");
      expect(result2).toBeNull();
    });

    it("should return null if token payload is missing required fields", async () => {
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const invalidToken = await new SignJWT({ appId: "test" })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secret);

      const result = await sdk.verifySession(invalidToken);
      expect(result).toBeNull();
    });
  });

  describe("getUserInfoWithJwt", () => {
    it("should get user info with jwt successfully", async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          openId: "test-open-id",
          platforms: ["REGISTERED_PLATFORM_GOOGLE"],
        },
      });

      const result = await sdk.getUserInfoWithJwt("test-jwt-token");

      expect(mockPost).toHaveBeenCalledWith(
        "/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt",
        { jwtToken: "test-jwt-token", projectId: "test-app-id" }
      );
      expect(result.loginMethod).toBe("google");
    });
  });

  describe("authenticateRequest", () => {
    it("should return user if session is valid and user exists in db", async () => {
      const token = await sdk.createSessionToken("test-open-id", { name: "Test User" });
      const req = {
        headers: {
          cookie: `${COOKIE_NAME}=${token}`,
        },
      } as unknown as Request;

      vi.mocked(db.getUserByOpenId).mockResolvedValueOnce({
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
      } as any);

      const user = await sdk.authenticateRequest(req);

      expect(user).toEqual({
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
      });
      expect(db.upsertUser).toHaveBeenCalledWith(expect.objectContaining({
        openId: "test-open-id",
      }));
    });

    it("should throw ForbiddenError if session cookie is missing", async () => {
      const req = { headers: {} } as Request;
      await expect(sdk.authenticateRequest(req)).rejects.toThrow("Invalid session cookie");
    });

    it("should sync user from OAuth if not in db", async () => {
      const token = await sdk.createSessionToken("test-open-id", { name: "Test User" });
      const req = {
        headers: { cookie: `${COOKIE_NAME}=${token}` },
      } as unknown as Request;

      vi.mocked(db.getUserByOpenId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ openId: "test-open-id", name: "Test User" } as any);

      mockPost.mockResolvedValueOnce({
        data: {
          openId: "test-open-id",
          name: "Test User",
          platforms: ["REGISTERED_PLATFORM_EMAIL"],
        },
      });

      const user = await sdk.authenticateRequest(req);

      expect(user).toEqual({ openId: "test-open-id", name: "Test User" });
      expect(mockPost).toHaveBeenCalledWith("/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt", expect.any(Object));
      expect(db.upsertUser).toHaveBeenCalledTimes(2);
    });

    it("should throw ForbiddenError if sync from OAuth fails", async () => {
      const token = await sdk.createSessionToken("test-open-id", { name: "Test User" });
      const req = {
        headers: { cookie: `${COOKIE_NAME}=${token}` },
      } as unknown as Request;

      vi.mocked(db.getUserByOpenId).mockResolvedValueOnce(null);
      mockPost.mockRejectedValueOnce(new Error("API Error"));

      await expect(sdk.authenticateRequest(req)).rejects.toThrow("Failed to sync user info");
    });

    it("should throw ForbiddenError if user is still not found after sync", async () => {
      const token = await sdk.createSessionToken("test-open-id", { name: "Test User" });
      const req = {
        headers: { cookie: `${COOKIE_NAME}=${token}` },
      } as unknown as Request;

      vi.mocked(db.getUserByOpenId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null); // Still null after sync

      mockPost.mockResolvedValueOnce({
        data: {
          openId: "test-open-id",
          name: "Test User",
        },
      });

      await expect(sdk.authenticateRequest(req)).rejects.toThrow("User not found");
    });
  });
});
