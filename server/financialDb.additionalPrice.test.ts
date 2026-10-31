import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb }));

import {
  getFinancialDataByYear,
  getFinancialSummaryByMonth,
  type WeekFinancialData,
} from "./financialDb";

function createDatabaseMock() {
  const database = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  };
  database.select.mockReturnValue(database);
  database.from.mockReturnValue(database);
  return database;
}

describe("financialDb additional-flight paid prices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds an additional ticket price stored in cents to the weekly financial total", async () => {
    const database = createDatabaseMock();
    database.where
      .mockResolvedValueOnce([
        {
          weekNumber: 4,
          year: 2027,
          departureDate: "2027-01-24",
          returnDate: "2027-01-29",
          departureAirline: "latam",
          returnAirline: "latam",
          ticketType: "roundtrip",
          isTicketIssued: 1,
          smilesPoints: null,
          latamPassPoints: null,
          departureRescheduled: 0,
          returnRescheduled: 0,
          isDeleted: 0,
        },
      ])
      .mockResolvedValueOnce([{ weekNumber: 4, airline: "latam", price: "100.00" }])
      .mockResolvedValueOnce([
        {
          weekNumber: 4,
          isTicketIssued: 1,
          paidPriceCents: 12345,
          departureAirline: "azul",
          returnAirline: "azul",
          smilesPoints: null,
          latamPassPoints: null,
        },
      ]);
    getDb.mockResolvedValue(database);

    const [week] = await getFinancialDataByYear(2027);

    expect(week.paidPriceTotal).toBe(223.45);
    expect(week.additionalPaidPriceTotal).toBe(123.45);
    expect(week.additionalCashByAirline).toEqual({
      azul: { cashBRL: 123.45, count: 1 },
    });
  });

  it("attributes the cash value of an additional ticket to its airline in the monthly summary", async () => {
    const week: WeekFinancialData = {
      weekNumber: 4,
      year: 2027,
      departureDate: "2027-01-24",
      returnDate: "2027-01-29",
      departureAirline: "latam",
      returnAirline: "latam",
      ticketType: "roundtrip",
      isTicketIssued: 1,
      primaryTicketIssued: 1,
      departureRescheduled: 0,
      returnRescheduled: 0,
      paidPriceDeparture: 100,
      paidPriceReturn: 100,
      paidPriceTotal: 223.45,
      smilesPoints: null,
      latamPassPoints: null,
      totalMiles: null,
      additionalFlightCount: 1,
      additionalPaidPriceTotal: 123.45,
      additionalCashByAirline: { azul: { cashBRL: 123.45, count: 1 } },
      month: 1,
    };

    const [month] = await getFinancialSummaryByMonth(2027, [week]);

    expect(month.totalCashBRL).toBe(223.45);
    expect(month.issuedCount).toBe(2);
    expect(month.byAirline.latam.cashBRL).toBe(100);
    expect(month.byAirline.azul).toMatchObject({ cashBRL: 123.45, count: 1 });
  });
});
