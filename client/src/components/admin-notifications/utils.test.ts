import { describe, it, expect } from "vitest";
import { formatAirline } from "./utils";

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
