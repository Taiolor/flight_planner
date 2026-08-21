import { describe, expect, it } from "vitest";
import { getCalendarIssuedLegDates } from "./calendarIssuedLegDates";

describe("getCalendarIssuedLegDates", () => {
  it("marca somente a data efetiva de ida da Semana 42", () => {
    expect(
      getCalendarIssuedLegDates({
        departureDate: "13/12/2026",
        returnDate: "17/12/2026",
        departureFlightDatetime: "2026-12-17T19:30",
        returnFlightDatetime: "2026-12-17",
        ticketType: "oneway",
      })
    ).toEqual({ departureDate: "2026-12-17", returnDate: null });
  });

  it("usa datas planejadas apenas como fallback para registros legados", () => {
    expect(
      getCalendarIssuedLegDates({
        departureDate: "13/12/2026",
        returnDate: "17/12/2026",
        ticketType: "roundtrip",
      })
    ).toEqual({
      departureDate: "13/12/2026",
      returnDate: "17/12/2026",
    });
  });
});
