import { describe, expect, it } from "vitest";
import {
  flightPrices,
  flightQuotes,
  flightWeeks,
  notificationLogs,
  planningYears,
  public_prices,
} from "../drizzle/schema";

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
});
