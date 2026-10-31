import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/env", () => ({
  ENV: { rapidapiKey: "test-rapidapi-key" },
}));

vi.mock("./db", () => ({
  validateAuthSession: vi.fn(),
  getAllFlightQuotes: vi.fn(),
  getFlightQuotesByWeek: vi.fn(),
  insertFlightQuote: vi.fn(),
  deleteFlightQuote: vi.fn(),
  getApiUsage: vi.fn(),
  reserveApiUsage: vi.fn(),
}));

import { quotesRouter } from "./routers/quotes";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: { cookie: "flight_session=valid-session" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("quotes router by planning year", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import("./db");
    (db.validateAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      email: "taiolor@gmail.com",
    });
    (db.getAllFlightQuotes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.getFlightQuotesByWeek as ReturnType<typeof vi.fn>).mockResolvedValue(
      []
    );
    (db.insertFlightQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
    (db.deleteFlightQuote as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
    (db.getApiUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      requestsUsed: 0,
      requestsLimit: 20,
    });
    (db.reserveApiUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      reserved: true,
      requestsUsed: 1,
      requestsLimit: 20,
    });
  });

  it("filtra a listagem pelo exercício informado", async () => {
    const db = await import("./db");
    const caller = quotesRouter.createCaller(createAuthenticatedContext());

    await caller.getAll({ year: 2027 });

    expect(db.getAllFlightQuotes).toHaveBeenCalledWith(2027);
  });

  it("filtra as cotações de uma semana pelo exercício informado", async () => {
    const db = await import("./db");
    const caller = quotesRouter.createCaller(createAuthenticatedContext());

    await caller.getByWeek({ year: 2028, weekNumber: 12 });

    expect(db.getFlightQuotesByWeek).toHaveBeenCalledWith(12, 2028);
  });

  it("persiste uma cotação manual no exercício selecionado", async () => {
    const db = await import("./db");
    const caller = quotesRouter.createCaller(createAuthenticatedContext());

    await caller.saveManual({
      year: 2029,
      weekNumber: 4,
      departureDate: "2029-01-21",
      returnDate: "2029-01-26",
      price: 489.9,
      outboundAirline: "LATAM",
      returnAirline: "GOL",
    });

    expect(db.insertFlightQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2029,
        weekNumber: 4,
        lowestPrice: 48990,
      })
    );
  });

  it("escopa a exclusão de cotação pelo exercício selecionado", async () => {
    const db = await import("./db");
    const caller = quotesRouter.createCaller(createAuthenticatedContext());

    await caller.delete({ id: 91, year: 2030 });

    expect(db.deleteFlightQuote).toHaveBeenCalledWith(91, 2030);
  });

  it("exige um ano válido em todos os contratos anuais", async () => {
    const caller = quotesRouter.createCaller(createAuthenticatedContext());

    await expect((caller.getAll as any)({})).rejects.toThrow();
    await expect((caller.getByWeek as any)({ weekNumber: 1 })).rejects.toThrow();
    await expect((caller.getApiUsage as any)({})).rejects.toThrow();
    await expect(
      (caller.fetchFromApi as any)({
        weekNumber: 1,
        departureDate: "2027-01-07",
        returnDate: "2027-01-12",
      })
    ).rejects.toThrow();
    await expect(
      (caller.saveManual as any)({
        weekNumber: 1,
        departureDate: "2027-01-07",
        returnDate: "2027-01-12",
        price: 300,
      })
    ).rejects.toThrow();
    await expect((caller.delete as any)({ id: 1 })).rejects.toThrow();
  });
});
