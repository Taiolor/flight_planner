import { describe, expect, it, vi, beforeEach } from "vitest";

// Set environment variable BEFORE importing appRouter
vi.stubEnv("JWT_SECRET", "test-secret");

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/env", () => ({
  ENV: {
    authEmail: "taiolor@gmail.com",
    authPassword: "#Salvar2026",
    isProduction: false,
  },
}));

// Mock the db module to avoid real DB calls in tests
vi.mock("./db", () => ({
  createAuthSession: vi.fn().mockResolvedValue("mock-session-token-abc123"),
  validateAuthSession: vi.fn().mockResolvedValue(null),
  deleteAuthSession: vi.fn().mockResolvedValue(undefined),
  getAllFlightWeeks: vi.fn().mockResolvedValue([]),
  getFlightWeek: vi.fn().mockResolvedValue(null),
  getAllFlightPrices: vi.fn().mockResolvedValue([]),
  getTicketNotificationEmails: vi.fn().mockResolvedValue([]),
  initFlightWeeks: vi.fn().mockResolvedValue(undefined),
  updateFlightWeekStatus: vi.fn().mockResolvedValue(undefined),
  upsertFlightPrice: vi.fn().mockResolvedValue(undefined),
  deleteFlightPrice: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getFlightWeeksReliabilitySummary: vi.fn().mockResolvedValue({
    transientFailures: 0,
    schemaFailures: 0,
    lastFailureAt: null,
  }),
}));

vi.mock("./_core/emailNotification", () => ({
  sendTicketNotificationEmail: vi.fn().mockResolvedValue(true),
  sendTestEmail: vi.fn().mockResolvedValue(true),
  sendShareByEmailNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock("./additionalFlightsDb", () => ({
  getAdditionalFlightsForYear: vi.fn().mockResolvedValue([]),
  getAdditionalFlight: vi.fn().mockResolvedValue(null),
  createAdditionalFlight: vi.fn().mockResolvedValue({ id: 1 }),
  updateAdditionalFlight: vi.fn().mockResolvedValue(undefined),
  deleteAdditionalFlight: vi.fn().mockResolvedValue(undefined),
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
    expect(result.isAdmin).toBe(false);
  });

  it("should expose the administrative capability only for the internal owner session", async () => {
    const { validateAuthSession } = await import("./db");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
      role: "admin",
    });

    const caller = appRouter.createCaller(
      createTestContext("flight_session=owner-session")
    );
    const result = await caller.flightAuth.check();

    expect(result).toMatchObject({
      authenticated: true,
      email: "taiolor@gmail.com",
      isAdmin: true,
    });
  });
});

describe("usageTelemetry access", () => {
  it("should reject the administrative map for a non-administrator internal session", async () => {
    const { validateAuthSession } = await import("./db");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "other@example.com",
      role: "user",
    });

    const caller = appRouter.createCaller(
      createTestContext("flight_session=non-admin-token")
    );

    await expect(caller.usageTelemetry.getSummary({ hours: 24 })).rejects.toThrow(
      "Acesso administrativo necessário."
    );
  });

  it("should reject telemetry records without the internal session", async () => {
    const caller = appRouter.createCaller(createTestContext());
    await expect(
      caller.usageTelemetry.record({
        sessionId: "b8d3ca80b31544f4a8ac4dd2fdd4c803",
        events: [{ eventType: "route", route: "/" }],
      })
    ).rejects.toThrow("Faça login para acessar.");
  });
});

describe("reliability access", () => {
  it("should reject the reliability summary without an administrator session", async () => {
    const caller = appRouter.createCaller(createTestContext());

    await expect(
      caller.reliability.getFlightWeeksSummary({ hours: 24 })
    ).rejects.toThrow("Faça login para acessar.");
  });
});

describe("additionalFlights", () => {
  it("should reject creation without the internal session", async () => {
    const caller = appRouter.createCaller(createTestContext());

    await expect(
      caller.additionalFlights.create({
        year: 2027,
        weekNumber: 3,
        ticketType: "roundtrip",
      })
    ).rejects.toThrow("Faça login para acessar.");
  });

  it("should create a second annual flight pair for an authenticated session", async () => {
    const { validateAuthSession, getFlightWeek } = await import("./db");
    const { createAdditionalFlight } = await import("./additionalFlightsDb");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });
    (getFlightWeek as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      year: 2027,
      weekNumber: 3,
      departureDate: "2027-01-10",
      returnDate: "2027-01-16",
      isDeleted: 0,
    });

    const caller = appRouter.createCaller(
      createTestContext("flight_session=owner-session")
    );
    await caller.additionalFlights.create({
      year: 2027,
      weekNumber: 3,
      ticketType: "roundtrip",
      departureAirline: "LATAM",
      returnAirline: "LATAM",
      departureAirport: "GRU",
      returnAirport: "NVT",
      isTicketIssued: 1,
      departureFlightDatetime: "2027-01-11T09:00",
      returnFlightDatetime: "2027-01-15T19:00",
    });

    expect(createAdditionalFlight).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2027, weekNumber: 3, ticketType: "roundtrip" })
    );
  });

  it("should keep a one-way additional ticket free of return data", async () => {
    const { validateAuthSession, getFlightWeek } = await import("./db");
    const { createAdditionalFlight } = await import("./additionalFlightsDb");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });
    (getFlightWeek as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      year: 2027,
      weekNumber: 4,
      departureDate: "2027-01-17",
      returnDate: "2027-01-23",
      isDeleted: 0,
    });

    const caller = appRouter.createCaller(
      createTestContext("flight_session=owner-session")
    );
    await caller.additionalFlights.create({
      year: 2027,
      weekNumber: 4,
      ticketType: "oneway",
      isTicketIssued: 1,
      departureFlightDatetime: "2027-01-18T09:00",
      returnFlightDatetime: "2027-01-20T19:00",
      returnFlightNumber: "LA9999",
      returnAirline: "LATAM",
    });

    expect(createAdditionalFlight).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketType: "oneway",
        returnFlightDatetime: null,
        returnFlightNumber: null,
        returnAirline: null,
        returnCancelled: 0,
        returnRescheduled: 0,
      })
    );
  });

  it("should reject an additional leg outside the selected week period", async () => {
    const { validateAuthSession, getFlightWeek } = await import("./db");
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });
    (getFlightWeek as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      year: 2027,
      weekNumber: 5,
      departureDate: "2027-01-24",
      returnDate: "2027-01-30",
      isDeleted: 0,
    });

    const caller = appRouter.createCaller(
      createTestContext("flight_session=owner-session")
    );
    await expect(
      caller.additionalFlights.create({
        year: 2027,
        weekNumber: 5,
        ticketType: "oneway",
        isTicketIssued: 1,
        departureFlightDatetime: "2027-01-31T09:00",
      })
    ).rejects.toThrow("A data do voo de ida deve estar dentro do período da semana selecionada.");
  });

  it("should notify recipients when an issued additional ticket changes", async () => {
    const { validateAuthSession, getFlightWeek, getTicketNotificationEmails } =
      await import("./db");
    const { getAdditionalFlight, updateAdditionalFlight } = await import(
      "./additionalFlightsDb"
    );
    const { sendTicketNotificationEmail } = await import(
      "./_core/emailNotification"
    );
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });
    (getAdditionalFlight as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 22,
      year: 2027,
      weekNumber: 6,
      isTicketIssued: 1,
      ticketType: "oneway",
      departureFlightDatetime: "2027-01-31T09:00",
      departureFlightNumber: "LA1234",
      departureAirline: "LATAM",
      departureAirport: "GRU",
      departureLocator: "ABC123",
      departureTerminal: null,
      departureRescheduled: 0,
      departureCancelled: 0,
      returnAirline: null,
      returnFlightDatetime: null,
      returnAirport: null,
      returnLocator: null,
      returnFlightNumber: null,
      returnTerminal: null,
      returnRescheduled: 0,
      returnCancelled: 0,
      smilesPoints: null,
      latamPassPoints: null,
    });
    (getFlightWeek as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      year: 2027,
      weekNumber: 6,
      departureDate: "2027-01-31",
      returnDate: "2027-02-06",
      isDeleted: 0,
    });
    (updateAdditionalFlight as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 22,
      year: 2027,
      weekNumber: 6,
      isTicketIssued: 1,
      ticketType: "oneway",
      departureFlightDatetime: "2027-01-31T09:00",
      departureFlightNumber: "LA9999",
      departureAirline: "LATAM",
      departureAirport: "GRU",
      departureLocator: "ABC123",
      departureTerminal: null,
      departureRescheduled: 0,
      departureCancelled: 0,
      returnAirline: null,
      returnFlightDatetime: null,
      returnAirport: null,
      returnLocator: null,
      returnFlightNumber: null,
      returnTerminal: null,
      returnRescheduled: 0,
      returnCancelled: 0,
      smilesPoints: null,
      latamPassPoints: null,
    });
    (getTicketNotificationEmails as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { email: "alertas@example.com" },
    ]);
    (sendTicketNotificationEmail as ReturnType<typeof vi.fn>).mockClear();

    const caller = appRouter.createCaller(
      createTestContext("flight_session=owner-session")
    );
    await caller.additionalFlights.update({
      id: 22,
      year: 2027,
      departureFlightNumber: "LA9999",
    });

    expect(sendTicketNotificationEmail).toHaveBeenCalledWith(
      ["alertas@example.com"],
      expect.objectContaining({
        eventLabel: "✏️ Passagem adicional alterada",
        weekNumber: 6,
        ticketType: "departure",
        changes: expect.objectContaining({
          before: expect.objectContaining({ "Número do voo": "LA1234" }),
          after: expect.objectContaining({ "Número do voo": "LA9999" }),
        }),
      })
    );
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

  it("should accept airline and terminal fields for both weekly legs", async () => {
    const { validateAuthSession, updateFlightWeekStatus } = await import(
      "./db"
    );
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });

    const ctx = createTestContext("flight_session=valid-token");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.flights.updateWeekStatus({
      year: 2026,
      weekNumber: 5,
      isTicketIssued: 1,
      departureAirline: "latam",
      returnAirline: "gol",
      departureTerminal: "Terminal 2",
      returnTerminal: "Terminal 1",
    });

    expect(result.success).toBe(true);
    expect(updateFlightWeekStatus).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        year: 2026,
        isTicketIssued: 1,
        departureAirline: "latam",
        returnAirline: "gol",
        departureTerminal: "Terminal 2",
        returnTerminal: "Terminal 1",
      })
    );
  });

  it("should persist independent cancellation flags for each leg in the selected year", async () => {
    const { validateAuthSession, updateFlightWeekStatus } = await import(
      "./db"
    );
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });

    const caller = appRouter.createCaller(createTestContext("flight_session=valid-token"));
    const result = await caller.flights.updateWeekStatus({
      year: 2028,
      weekNumber: 7,
      isTicketIssued: 1,
      departureCancelled: 1,
      returnCancelled: 0,
    });

    expect(result.success).toBe(true);
    expect(updateFlightWeekStatus).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        year: 2028,
        departureCancelled: 1,
        returnCancelled: 0,
      })
    );
  });

  it("should notify recipients when an issued departure is cancelled", async () => {
    const {
      validateAuthSession,
      getFlightWeek,
      getTicketNotificationEmails,
    } = await import("./db");
    const { sendTicketNotificationEmail } = await import(
      "./_core/emailNotification"
    );
    (validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "taiolor@gmail.com",
    });
    (getFlightWeek as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      year: 2029,
      weekNumber: 8,
      isTicketIssued: 1,
      departureCancelled: 0,
      returnCancelled: 0,
      departureFlightNumber: "LA1234",
      departureAirline: "LATAM",
      departureDate: "15/02/2029",
    });
    (getTicketNotificationEmails as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { email: "alertas@example.com" },
    ]);

    const caller = appRouter.createCaller(createTestContext("flight_session=valid-token"));
    await caller.flights.updateWeekStatus({
      year: 2029,
      weekNumber: 8,
      isTicketIssued: 1,
      departureCancelled: 1,
    });

    expect(sendTicketNotificationEmail).toHaveBeenCalledWith(
      ["alertas@example.com"],
      expect.objectContaining({
        eventLabel: "⚠️ Voo de Ida Cancelado",
        weekNumber: 8,
        ticketType: "departure",
        changes: {
          before: { Status: "Ativo" },
          after: { Status: "Cancelado" },
        },
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
    ).rejects.toThrow("Faça login para acessar.");
  });
});
