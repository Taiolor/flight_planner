import { describe, expect, it } from "vitest";
import { hasCancelledFlight, hasRescheduledFlight, type DayMark } from "./types";

describe("hasCancelledFlight", () => {
  const week = {
    weekNumber: 1,
    departureDate: "04/01/2026",
    returnDate: "09/01/2026",
    isTicketIssued: 1,
  };

  it("identifica cancelamento na ida ou na volta", () => {
    const departureCancelled: DayMark = {
      departure: true,
      return: false,
      isPast: false,
      week,
      departureCancelled: true,
    };
    const returnCancelled: DayMark = {
      departure: false,
      return: true,
      isPast: false,
      week,
      returnCancelled: true,
    };

    expect(hasCancelledFlight(departureCancelled)).toBe(true);
    expect(hasCancelledFlight(returnCancelled)).toBe(true);
  });

  it("não marca voos ativos ou datas sem voo como cancelados", () => {
    expect(hasCancelledFlight(undefined)).toBe(false);
    expect(
      hasCancelledFlight({ departure: true, return: false, isPast: false, week })
    ).toBe(false);
  });
});

describe("hasRescheduledFlight", () => {
  const week = {
    weekNumber: 2,
    departureDate: "11/01/2026",
    returnDate: "16/01/2026",
    isTicketIssued: 1,
  };

  it("identifica remarcação na ida ou na volta", () => {
    expect(
      hasRescheduledFlight({
        departure: true,
        return: false,
        isPast: false,
        week,
        departureRescheduled: true,
      })
    ).toBe(true);
    expect(
      hasRescheduledFlight({
        departure: false,
        return: true,
        isPast: false,
        week,
        returnRescheduled: true,
      })
    ).toBe(true);
  });

  it("não marca voos sem remarcação ou datas vazias", () => {
    expect(hasRescheduledFlight(undefined)).toBe(false);
    expect(
      hasRescheduledFlight({ departure: true, return: false, isPast: false, week })
    ).toBe(false);
  });
});
