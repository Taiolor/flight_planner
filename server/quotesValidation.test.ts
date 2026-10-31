import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret");

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/env", () => ({
  ENV: {
    authEmail: "taiolor@gmail.com",
    authPassword: "#Salvar2026",
    rapidapiKey: "mock-rapidapi-key",
    isProduction: false,
  },
}));

vi.mock("./db", () => ({
  validateAuthSession: vi.fn().mockResolvedValue({ email: "taiolor@gmail.com" }),
  getFlightQuotesByWeek: vi.fn().mockResolvedValue([]),
  insertFlightQuote: vi.fn().mockResolvedValue(undefined),
  getApiUsage: vi.fn().mockResolvedValue({ requestsUsed: 0, requestsLimit: 20 }),
  incrementApiUsage: vi.fn().mockResolvedValue({ requestsUsed: 1, requestsLimit: 20 }),
  getTicketNotificationEmails: vi.fn().mockResolvedValue([
    { id: 1, email: "test@example.com", name: "Tester", active: 1 },
  ]),
  savePushSubscription: vi.fn().mockResolvedValue(undefined),
  updateFlightWeekStatus: vi.fn().mockResolvedValue(undefined),
  upsertFlightPrice: vi.fn().mockResolvedValue(undefined),
  deleteFlightPrice: vi.fn().mockResolvedValue(undefined),
}));

function createAuthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: "flight_session=valid-session-token" },
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("quotesRouter & travel procedure input validation via appRouter caller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("quotes.getByWeek", () => {
    it("accepts valid week numbers within bounds 1-53", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(caller.quotes.getByWeek({ weekNumber: 1 })).resolves.toEqual([]);
      await expect(caller.quotes.getByWeek({ weekNumber: 53 })).resolves.toEqual([]);
    });

    it("rejects invalid, negative or out-of-range week numbers", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(caller.quotes.getByWeek({ weekNumber: 0 })).rejects.toThrow();
      await expect(caller.quotes.getByWeek({ weekNumber: -5 })).rejects.toThrow();
      await expect(caller.quotes.getByWeek({ weekNumber: 54 })).rejects.toThrow();
      await expect(caller.quotes.getByWeek({ weekNumber: 1.5 })).rejects.toThrow();
    });
  });

  describe("quotes.fetchFromApi", () => {
    it("rejects malformed date formats or dates exceeding 10 characters", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(
        caller.quotes.fetchFromApi({
          weekNumber: 12,
          departureDate: "15/03/2026",
          returnDate: "2026-03-20",
        })
      ).rejects.toThrow();

      await expect(
        caller.quotes.fetchFromApi({
          weekNumber: 12,
          departureDate: "2026-03-15T00:00:00Z",
          returnDate: "2026-03-20",
        })
      ).rejects.toThrow();
    });

    it("rejects weekNumber exceeding 53", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(
        caller.quotes.fetchFromApi({
          weekNumber: 99,
          departureDate: "2026-03-15",
          returnDate: "2026-03-20",
        })
      ).rejects.toThrow();
    });
  });

  describe("quotes.saveManual", () => {
    it("accepts valid manual quote payloads within bounds", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      const res = await caller.quotes.saveManual({
        weekNumber: 20,
        departureDate: "2026-05-10",
        returnDate: "2026-05-15",
        price: 450.75,
        airline: "LATAM",
        outboundAirline: "LATAM",
        returnAirline: "GOL",
      });
      expect(res.source).toBe("manual");
      expect(res.lowestPrice).toBe(45075);
    });

    it("rejects negative prices and prices exceeding 1,000,000", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(
        caller.quotes.saveManual({
          weekNumber: 20,
          departureDate: "2026-05-10",
          returnDate: "2026-05-15",
          price: -10,
        })
      ).rejects.toThrow();

      await expect(
        caller.quotes.saveManual({
          weekNumber: 20,
          departureDate: "2026-05-10",
          returnDate: "2026-05-15",
          price: 1_000_001,
        })
      ).rejects.toThrow();
    });

    it("rejects string attributes exceeding maximum permitted lengths", async () => {
      const caller = appRouter.createCaller(createAuthenticatedContext());
      await expect(
        caller.quotes.saveManual({
          weekNumber: 20,
          departureDate: "2026-05-10",
          returnDate: "2026-05-15",
          price: 500,
          airline: "A".repeat(101),
        })
      ).rejects.toThrow();

      await expect(
        caller.quotes.saveManual({
          weekNumber: 20,
          departureDate: "2026-05-10",
          returnDate: "2026-05-15",
          price: 500,
          outboundDeparture: "B".repeat(33),
        })
      ).rejects.toThrow();
    });
  });
});
