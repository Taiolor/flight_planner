import { describe, expect, it } from "vitest";
import {
  getCalendarIssuedLegDates,
  hasEffectiveIssuedTicketLeg,
} from "./calendarIssuedLegDates";

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

  it("não classifica a Semana 42 como pendente quando a ida efetiva foi emitida", () => {
    expect(
      hasEffectiveIssuedTicketLeg({
        departureDate: "13/12/2026",
        returnDate: "17/12/2026",
        departureFlightDatetime: "2026-12-17T19:30",
        ticketType: "oneway",
        isTicketIssued: 1,
      })
    ).toBe(true);
  });

  it("mantém semanas sem bilhete fora do resumo de trechos emitidos", () => {
    expect(
      hasEffectiveIssuedTicketLeg({
        departureDate: "20/12/2026",
        returnDate: "25/12/2026",
        isTicketIssued: 0,
      })
    ).toBe(false);
  });
});
