import { describe, it, expect } from "vitest";
import { formatDatetimeBRT } from "./utils";

describe("formatDatetimeBRT", () => {
  it("formats a valid ISO string to BRT timezone", () => {
    // This ISO string should be converted to BRT (America/Sao_Paulo)
    // BRT is UTC-3. So 15:00Z should be 12:00 BRT
    const isoString = "2023-10-25T15:30:00Z";
    const result = formatDatetimeBRT(isoString);

    // We expect the result to have day, month, year, hour, minute
    expect(result).toMatch(/25\/10\/2023, 12:30/);
  });

  it("returns the original string when given an invalid ISO string", () => {
    const invalidString = "not-a-valid-date";
    const result = formatDatetimeBRT(invalidString);

    // The try/catch block should catch the error and return the original string
    expect(result).toBe(invalidString);
  });

  it("formats dates with daylight saving time correctly (if applicable)", () => {
     // Even though BRT doesn't currently use DST, let's just make sure
     // it handles another valid date.
     const isoString = "2024-01-01T03:00:00Z";
     const result = formatDatetimeBRT(isoString);
     expect(result).toMatch(/01\/01\/2024, 00:00/);
  });
});
