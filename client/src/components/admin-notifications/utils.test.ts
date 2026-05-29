import { describe, it, expect } from "vitest";
import { formatAirline, formatDatetimeBRT } from "./utils";

describe("formatAirline utility", () => {
  it("returns correct name for known codes (uppercase)", () => {
    expect(formatAirline("LA")).toBe("LATAM");
    expect(formatAirline("G3")).toBe("Gol");
    expect(formatAirline("AD")).toBe("Azul");
  });

  it("returns correct name for known codes (lowercase)", () => {
    expect(formatAirline("la")).toBe("LATAM");
    expect(formatAirline("g3")).toBe("Gol");
    expect(formatAirline("ad")).toBe("Azul");
  });

  it("returns the original code for unknown codes", () => {
    expect(formatAirline("UNKNOWN")).toBe("UNKNOWN");
    expect(formatAirline("AA")).toBe("AA");
    expect(formatAirline("")).toBe("");
  });
});

describe("formatDatetimeBRT", () => {
  it("formats a valid ISO string to BRT timezone", () => {
    const isoString = "2023-10-25T15:30:00Z";
    const result = formatDatetimeBRT(isoString);
    expect(result).toMatch(/25\/10\/2023, 12:30/);
  });

  it("returns the original string when given an invalid ISO string", () => {
    const invalidString = "not-a-valid-date";
    const result = formatDatetimeBRT(invalidString);
    expect(result).toBe(invalidString);
  });

  it("formats dates with daylight saving time correctly (if applicable)", () => {
    const isoString = "2024-01-01T03:00:00Z";
    const result = formatDatetimeBRT(isoString);
    expect(result).toMatch(/01\/01\/2024, 00:00/);
  });
});
