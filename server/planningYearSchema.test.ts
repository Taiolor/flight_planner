import { describe, expect, it } from "vitest";
import {
  flightPrices,
  flightQuotes,
  flightWeeks,
  notificationLogs,
  planningYears,
  public_prices,
} from "../drizzle/schema";
import { flightWeeksProjection } from "./db";

describe("schema anual de planejamento", () => {
  it("mantém uma coluna year em toda entidade dependente do planejamento", () => {
    const annualTables = [
      flightWeeks,
      flightPrices,
      public_prices,
      flightQuotes,
      notificationLogs,
    ];

    for (const table of annualTables) {
      expect(table.year.name).toBe("year");
    }
  });

  it("mantém o catálogo de exercícios como fonte de verdade do planejamento", () => {
    expect(planningYears.year.name).toBe("year");
    expect(planningYears.status.name).toBe("status");
    expect(planningYears.weekCount.name).toBe("weekCount");
  });

  it("mantém a projeção completa de flight_weeks alinhada ao schema", () => {
    const expectedColumns = [
      "id", "year", "weekNumber", "departureDate", "returnDate",
      "departureDayOfWeek", "returnDayOfWeek", "holiday", "isDeleted",
      "isTicketIssued", "isSelected", "departureAirline", "returnAirline",
      "departureFlightDatetime", "returnFlightDatetime", "departureAirport",
      "returnAirport", "departureLocator", "returnLocator", "departureFlightNumber",
      "returnFlightNumber", "departureTerminal", "returnTerminal", "ticketType",
      "smilesPoints", "latamPassPoints", "departureRescheduled",
      "returnRescheduled", "departureCancelled", "returnCancelled", "createdAt", "updatedAt",
    ];

    expect(Object.keys(flightWeeksProjection)).toEqual(expectedColumns);
    for (const columnName of expectedColumns) {
      expect(flightWeeksProjection[columnName as keyof typeof flightWeeksProjection].name)
        .toBe(flightWeeks[columnName as keyof typeof flightWeeks].name);
    }
  });
});
