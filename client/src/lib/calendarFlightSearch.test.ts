import { describe, expect, it } from "vitest";
import type { DayMark } from "@/components/flights/types";
import {
  dayMarkMatchesFlightSearch,
  normalizeCalendarFlightSearch,
} from "./calendarFlightSearch";

const mark: DayMark = {
  departure: true,
  return: false,
  isPast: false,
  week: {
    weekNumber: 27,
    departureDate: "30/08/2026",
    returnDate: "04/09/2026",
    isTicketIssued: true,
    departureAirport: "GRU",
    returnAirport: "NVT",
    departureAirline: "latam",
    departureFlightNumber: "LA 3210",
    departureLocator: "ABC123",
    departureTerminal: "2",
  },
  additionalFlights: [
    {
      id: 1,
      weekNumber: 27,
      direction: "return",
      airport: "CGH",
      airline: "azul",
      flightNumber: "AD 4411",
      locator: "EXTRA77",
      terminal: "1",
    },
  ],
};

describe("calendarFlightSearch", () => {
  it("normaliza texto, acentos e espaçamento", () => {
    expect(normalizeCalendarFlightSearch("  São   Paulo ")).toBe("sao paulo");
  });

  it("encontra voos por número, destino, localizador e terminal", () => {
    expect(dayMarkMatchesFlightSearch(mark, "LA3210")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "LA 3210")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "navegantes")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "ABC123")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "terminal 2")).toBe(true);
  });

  it("inclui voos adicionais e não exibe dias sem correspondência", () => {
    expect(dayMarkMatchesFlightSearch(mark, "AD 4411")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "congonhas")).toBe(true);
    expect(dayMarkMatchesFlightSearch(mark, "ZZ 9999")).toBe(false);
    expect(dayMarkMatchesFlightSearch(undefined, "GRU")).toBe(false);
  });

  it("mantém a busca por número limitada ao trecho exibido no dia", () => {
    const returnMark: DayMark = {
      ...mark,
      departure: false,
      return: true,
      additionalFlights: undefined,
    };

    expect(dayMarkMatchesFlightSearch(returnMark, "LA 3210")).toBe(false);
    expect(dayMarkMatchesFlightSearch(returnMark, "Navegantes")).toBe(true);
  });
});
