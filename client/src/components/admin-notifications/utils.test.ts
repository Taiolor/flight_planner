import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { formatAirline, formatRelativeTime, formatDatetimeBRT } from "./utils";

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

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-10-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats correctly for > 1 day in the past", () => {
    expect(formatRelativeTime("2023-10-23T12:00:00Z")).toBe("há 2 dias");
    expect(formatRelativeTime("2023-10-24T11:59:00Z")).toBe("há 1 dia");
  });

  it("formats correctly for > 1 hour in the past", () => {
    expect(formatRelativeTime("2023-10-25T10:00:00Z")).toBe("há 2h");
  });

  it("formats correctly for < 1 hour in the past", () => {
    expect(formatRelativeTime("2023-10-25T11:30:00Z")).toBe("há 30min");
  });

  it("formats correctly for exactly now", () => {
    expect(formatRelativeTime("2023-10-25T12:00:00Z")).toBe("agora");
  });

  it("formats correctly for < 1 hour in the future", () => {
    expect(formatRelativeTime("2023-10-25T12:30:00Z")).toBe("em 30min");
  });

  it("formats correctly for < 1 day in the future", () => {
    expect(formatRelativeTime("2023-10-25T14:30:00Z")).toBe("em 2h 30min");
    expect(formatRelativeTime("2023-10-25T14:00:00Z")).toBe("em 2h");
  });

  it("formats correctly for >= 1 day in the future", () => {
    expect(formatRelativeTime("2023-10-27T14:30:00Z")).toBe("em 2d 2h");
    expect(formatRelativeTime("2023-10-27T12:00:00Z")).toBe("em 2d");
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

  it("returns the original string if toLocaleString throws an error", () => {
    const isoString = "2023-10-25T15:30:00Z";
    const toLocaleStringSpy = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const result = formatDatetimeBRT(isoString);
    expect(result).toBe(isoString);

    toLocaleStringSpy.mockRestore();
  });

  it("formats dates with daylight saving time correctly (if applicable)", () => {
    const isoString = "2024-01-01T03:00:00Z";
    const result = formatDatetimeBRT(isoString);
    expect(result).toMatch(/01\/01\/2024, 00:00/);
  });
});
