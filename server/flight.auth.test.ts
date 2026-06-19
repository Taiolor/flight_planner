import { describe, expect, it, vi, beforeEach } from "vitest";

// Set environment variable BEFORE importing appRouter
vi.stubEnv("JWT_SECRET", "test-secret");

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module to avoid real DB calls in tests
vi.mock("./db", () => ({
  createAuthSession: vi.fn().mockResolvedValue("mock-session-token-abc123"),
  validateAuthSession: vi.fn().mockResolvedValue(null),
  deleteAuthSession: vi.fn().mockResolvedValue(undefined),
  getAllFlightWeeks: vi.fn().mockResolvedValue([]),
  getFlightWeek: vi.fn().mockResolvedValue(null),
  getAllFlightPrices: vi.fn().mockResolvedValue([]),
  initFlightWeeks: vi.fn().mockResolvedValue(undefined),
  updateFlightWeekStatus: vi.fn().mockResolvedValue(undefined),
  upsertFlightPrice: vi.fn().mockResolvedValue(undefined),
  deleteFlightPrice: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createTestContext(cookieOverride = ""): TrpcContext {
  const cookies: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: cookieOverride },
    } as TrpcContext["req"],
    res: {
      cookie: (
        name: string,
        value: string,
        options: Record<string, unknown>
      ) => {
        cookies.push({ name, value, options });
      },
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("flightAuth.login", () => {
  beforeEach(() => {
    process.env.AUTH_EMAIL = "taiolor@gmail.com";
    process.env.AUTH_PASSWORD = "#Salvar2026";
    process.env.JWT_SECRET = "test-secret";
  });

  it("should return success when credentials are correct", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.flightAuth.login({
      email: "taiolor@gmail.com",
      password: "#Salvar2026",
    });

    expect(result.success).toBe(true);
    expect(result.email).toBe("taiolor@gmail.com");
  });

  it("should throw UNAUTHORIZED when email is wrong", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.flightAuth.login({
        email: "wrong@email.com",
        password: "#Salvar2026",
      })
    ).rejects.toThrow("E-mail ou senha incorretos.");
  });

  it("should throw UNAUTHORIZED when password is wrong", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.flightAuth.login({
        email: "taiolor@gmail.com",
        password: "wrongpassword",
      })
    ).rejects.toThrow("E-mail ou senha incorretos.");
  });
});

describe("flightAuth.check", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("should return unauthenticated when no cookie is present", async () => {
    const ctx = createTestContext("");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.flightAuth.check();
    expect(result.authenticated).toBe(false);
    expect(result.email).toBeNull();
  });
});

describe("flightAuth.logout", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("should clear session cookie on logout", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: { cookie: "flight_session=sometoken" },
      } as TrpcContext["req"],
      res: {
        cookie: vi.fn(),
        clearCookie: (name: string) => clearedCookies.push(name),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.flightAuth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toContain("flight_session");
  });
});

describe("flights.updateWeekStatus with airline fields", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  it("should accept departureAirline and returnAirline fields", async () => {
    const { validateAuthSession, updateFlightWeekStatus } = await import(
      "./db"
    );
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });

    const ctx = createTestContext("flight_session=valid-token");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.flights.updateWeekStatus({
      weekNumber: 5,
      isTicketIssued: 1,
      departureAirline: "latam",
      returnAirline: "gol",
    });

    expect(result.success).toBe(true);
    expect(updateFlightWeekStatus).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        isTicketIssued: 1,
        departureAirline: "latam",
        returnAirline: "gol",
      })
    );
  });

  it("should reject update without authentication", async () => {
    const { validateAuthSession } = await import("./db");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      null
    );

    const ctx = createTestContext("");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.flights.updateWeekStatus({
        weekNumber: 5,
        departureAirline: "latam",
      })
    ).rejects.toThrow("Faça login para editar.");
  });
});
