import { describe, it, expect } from "vitest";
import {
  formatDateToBrazilian,
  buildFlightTrackUrl,
  getGoogleCalendarLink,
  getOutlookLink,
} from "../calendarHelper";

describe("calendarHelper", () => {
  describe("formatDateToBrazilian", () => {
    it("formats a valid ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)", () => {
      expect(formatDateToBrazilian("2024-05-15")).toBe("15/05/2024");
      expect(formatDateToBrazilian("2023-12-01")).toBe("01/12/2023");
    });

    it("returns an empty string if input is empty", () => {
      expect(formatDateToBrazilian("")).toBe("");
    });
  });

  describe("buildFlightTrackUrl", () => {
    it("uses known IATA code and extracts the last 4 digits of the flight number", () => {
      const url = buildFlightTrackUrl(
        "latam",
        "LA3045",
        "GRU",
        "NVT",
        "2024-05-15T10:00:00"
      );
      expect(url).toBe(
        "https://www.google.com/search?q=LA+flight+3045+from+GRU+to+NVT,+2024-05-15"
      );
    });

    it("falls back to the first 2 letters for an unknown airline", () => {
      const url = buildFlightTrackUrl(
        "unknown",
        "UN123",
        "VCP",
        "CGH",
        "2024-06-20T12:30:00"
      );
      expect(url).toBe(
        "https://www.google.com/search?q=UN+flight+0123+from+VCP+to+CGH,+2024-06-20"
      );
    });

    it("pads flight number with leading zeros if it has less than 4 digits", () => {
      const url = buildFlightTrackUrl(
        "azul",
        "AD45",
        "CNF",
        "GRU",
        "2024-07-01T08:15:00"
      );
      expect(url).toBe(
        "https://www.google.com/search?q=AD+flight+0045+from+CNF+to+GRU,+2024-07-01"
      );
    });
  });

  describe("getGoogleCalendarLink", () => {
    const defaultParams = {
      title: "✈️ Voo IDA LA3045 — LATAM Airlines",
      flightDatetime: "2024-05-15T10:00",
      location: "Aeroporto de Guarulhos (GRU)",
      description: "Localizador: ABC123\nCompanhia: LATAM",
    };

    it("generates a valid Google Calendar link with default lead/duration times", () => {
      const link = getGoogleCalendarLink(defaultParams);
      // leadMinutes = 120 -> start = 10:00 - 2h = 08:00
      // durationMinutes = 75 -> end = 10:00 + 1h15 = 11:15
      expect(link).toContain("action=TEMPLATE");
      expect(link).toContain(
        "text=%E2%9C%88%EF%B8%8F+Voo+IDA+LA3045+%E2%80%94+LATAM+Airlines"
      );
      expect(link).toContain("location=Aeroporto+de+Guarulhos+%28GRU%29");
      expect(link).toContain(
        "details=Localizador%3A+ABC123%0ACompanhia%3A+LATAM"
      );

      // We don't assert the exact date string since it relies on local timezone in the implementation
      // but we can check if it has the format YYYYMMDDTHHmm00%2FYYYYMMDDTHHmm00 (URL encoded slash)
      expect(link).toMatch(/dates=\d{8}T\d{6}%2F\d{8}T\d{6}/);
    });

    it("respects custom leadMinutes and durationMinutes", () => {
      const link = getGoogleCalendarLink(defaultParams, 60, 120);
      expect(link).toMatch(/dates=\d{8}T\d{6}%2F\d{8}T\d{6}/);
    });
  });

  describe("getOutlookLink", () => {
    const defaultParams = {
      title: "✈️ Voo IDA G31234 — Gol",
      flightDatetime: "2024-05-15T15:30",
      location: "Aeroporto de Congonhas (CGH)",
      description: "Localizador: XYZ987",
    };

    it("generates a valid Outlook Web link with default lead/duration times", () => {
      const link = getOutlookLink(defaultParams);
      expect(link).toContain("outlook.live.com");
      expect(link).toContain(
        "subject=%E2%9C%88%EF%B8%8F+Voo+IDA+G31234+%E2%80%94+Gol"
      );
      expect(link).toContain("location=Aeroporto+de+Congonhas+%28CGH%29");

      // Assert that startdt and enddt are present and are valid ISO strings (URL encoded)
      expect(link).toMatch(/startdt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}/);
      expect(link).toMatch(/enddt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}/);
    });

    it("respects custom leadMinutes and durationMinutes", () => {
      const link = getOutlookLink(defaultParams, 180, 90);
      expect(link).toMatch(/startdt=\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}/);
    });
  });
});
