import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerOAuthRoutes } from "./oauth";
import { sdk } from "./sdk";
import * as db from "../db";
import { COOKIE_NAME } from "@shared/const";

vi.mock("./sdk");
vi.mock("../db");
vi.mock("./cookies", () => ({
  getSessionCookieOptions: vi.fn(() => ({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  })),
}));

describe("registerOAuthRoutes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    registerOAuthRoutes(app);
  });

  describe("GET /api/oauth/callback", () => {
    it("returns 400 if code is missing", async () => {
      const response = await request(app).get("/api/oauth/callback?state=xyz");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "code and state are required" });
    });

    it("returns 400 if state is missing", async () => {
      const response = await request(app).get("/api/oauth/callback?code=abc");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "code and state are required" });
    });

    it("returns 400 if openId is missing from user info", async () => {
      vi.mocked(sdk.exchangeCodeForToken).mockResolvedValueOnce({
        accessToken: "test-token",
      });
      vi.mocked(sdk.getUserInfo).mockResolvedValueOnce({} as any);

      const response = await request(app).get("/api/oauth/callback?code=abc&state=xyz");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "openId missing from user info" });
    });

    it("returns 500 if an error occurs during exchange", async () => {
      vi.mocked(sdk.exchangeCodeForToken).mockRejectedValueOnce(new Error("Network error"));

      const response = await request(app).get("/api/oauth/callback?code=abc&state=xyz");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "OAuth callback failed" });
    });

    it("successfully creates a session and redirects", async () => {
      vi.mocked(sdk.exchangeCodeForToken).mockResolvedValueOnce({
        accessToken: "test-token",
      });
      vi.mocked(sdk.getUserInfo).mockResolvedValueOnce({
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        platform: "google",
      });
      vi.mocked(db.upsertUser).mockResolvedValueOnce({} as any);
      vi.mocked(sdk.createSessionToken).mockResolvedValueOnce("test-session-token");

      const response = await request(app).get("/api/oauth/callback?code=abc&state=xyz");

      expect(response.status).toBe(302);
      expect(response.header.location).toBe("/");

      const setCookie = response.header["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toContain(COOKIE_NAME + "=test-session-token");
      expect(setCookie[0]).toContain("HttpOnly");
      expect(setCookie[0]).toContain("Secure");
      expect(setCookie[0]).toContain("SameSite=Lax");

      expect(db.upsertUser).toHaveBeenCalledWith({
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "google",
        lastSignedIn: expect.any(Date),
      });
    });
  });
});
