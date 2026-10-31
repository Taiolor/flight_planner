import { describe, expect, it } from "vitest";
import { getActiveManagementFilterCount } from "./managementFilterSummary";

describe("getActiveManagementFilterCount", () => {
  const defaultFilters = {
    month: "all",
    airline: "all",
    ticketStatus: "all",
    cheapestOnly: false,
    departureTime: 0,
    returnTime: 0,
  };

  it("ignora a configuração padrão que não restringe a lista", () => {
    expect(getActiveManagementFilterCount(defaultFilters)).toBe(0);
  });

  it("conta somente critérios que mudam o resultado da Gestão", () => {
    expect(
      getActiveManagementFilterCount({
        ...defaultFilters,
        month: "08",
        ticketStatus: "issued",
        cheapestOnly: true,
        returnTime: 600,
      })
    ).toBe(4);
  });
});
