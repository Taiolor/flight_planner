import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFlightCalendarEvent,
  createRoundTripCalendarEvents,
  FlightEvent,
} from "../calendarIntegration";
import * as childProcess from "child_process";

vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

describe("calendarIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFlightCalendarEvent", () => {
    it("should create an event successfully with correct parameters", async () => {
      vi.mocked(childProcess.execFileSync).mockReturnValue(
        JSON.stringify({ success: true })
      );

      const event: FlightEvent = {
        weekNumber: 42,
        airline: "LATAM Airlines",
        flightNumber: "1234",
        departureAirport: "GRU",
        arrivalAirport: "SDU",
        departureTime: new Date("2024-10-15T10:00:00Z"),
        arrivalTime: new Date("2024-10-15T11:00:00Z"),
        locator: "ABCDEF",
        isReturn: false,
      };

      const result = await createFlightCalendarEvent(event);
      expect(result).toBe(true);

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        "manus-mcp-cli",
        expect.arrayContaining([
          "tool",
          "call",
          "google_calendar_create_events",
          "--server",
          "google-calendar",
          "--input",
          expect.any(String),
        ]),
        { encoding: "utf-8" }
      );

      // Verify the input payload
      const callArgs = vi.mocked(childProcess.execFileSync).mock.calls[0];
      const inputArgs = callArgs[1] as string[];
      const inputIndex = inputArgs.indexOf("--input") + 1;
      const inputStr = inputArgs[inputIndex];
      const payload = JSON.parse(inputStr);

      expect(payload.events).toHaveLength(1);
      const calEvent = payload.events[0];

      expect(calEvent.summary).toBe("✈️ LATAM Airlines 1234 (Ida) - Semana 42");
      expect(calEvent.location).toBe("GRU → SDU");
      expect(calEvent.start_time).toBe("2024-10-15T08:00:00.000Z"); // 2 hours before
      expect(calEvent.end_time).toBe("2024-10-15T11:00:00.000Z");
      expect(calEvent.description).toContain("Voo: LATAM Airlines 1234");
      expect(calEvent.description).toContain("Localizador: ABCDEF");
      expect(calEvent.description).toContain(
        "https://www.google.com/search?q=LA+flight+1234+from+GRU+to+SDU,+2024-10-15"
      );
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(childProcess.execFileSync).mockImplementation(() => {
        throw new Error("Command failed");
      });

      const event: FlightEvent = {
        weekNumber: 42,
        airline: "Gol",
        flightNumber: "9999",
        departureAirport: "CGH",
        arrivalAirport: "BSB",
        departureTime: new Date("2024-11-01T12:00:00Z"),
        arrivalTime: new Date("2024-11-01T14:00:00Z"),
        locator: "XYZ123",
        isReturn: true,
      };

      const result = await createFlightCalendarEvent(event);
      expect(result).toBe(false);
    });

    it("should format URL correctly with one-digit day/month and short flight numbers", async () => {
      vi.mocked(childProcess.execFileSync).mockReturnValue("ok");

      const event: FlightEvent = {
        weekNumber: 1,
        airline: "Azul",
        flightNumber: "42",
        departureAirport: "VCP",
        arrivalAirport: "CNF",
        departureTime: new Date("2024-01-05T09:00:00Z"), // Jan 5
        arrivalTime: new Date("2024-01-05T10:00:00Z"),
        locator: "123456",
        isReturn: true,
      };

      await createFlightCalendarEvent(event);

      const callArgs = vi.mocked(childProcess.execFileSync).mock.calls[0];
      const inputArgs = callArgs[1] as string[];
      const inputIndex = inputArgs.indexOf("--input") + 1;
      const inputStr = inputArgs[inputIndex];
      const payload = JSON.parse(inputStr);

      const calEvent = payload.events[0];

      // Tracking URL check (Flight number padded to 4 digits, date correctly padded)
      expect(calEvent.description).toContain(
        "https://www.google.com/search?q=AZ+flight+0042+from+VCP+to+CNF,+2024-01-05"
      );
      expect(calEvent.summary).toBe("✈️ Azul 42 (Volta) - Semana 1");
    });

    it("should use airport addresses if provided", async () => {
      vi.mocked(childProcess.execFileSync).mockReturnValue("ok");

      const event: FlightEvent = {
        weekNumber: 5,
        airline: "Azul",
        flightNumber: "42",
        departureAirport: "VCP",
        arrivalAirport: "CNF",
        departureAirportAddress: "Viracopos Airport, Campinas",
        arrivalAirportAddress: "Confins Airport, BH",
        departureTime: new Date("2024-01-05T09:00:00Z"),
        arrivalTime: new Date("2024-01-05T10:00:00Z"),
        locator: "123456",
        isReturn: false,
      };

      await createFlightCalendarEvent(event);

      const callArgs = vi.mocked(childProcess.execFileSync).mock.calls[0];
      const inputArgs = callArgs[1] as string[];
      const inputIndex = inputArgs.indexOf("--input") + 1;
      const inputStr = inputArgs[inputIndex];
      const payload = JSON.parse(inputStr);

      const calEvent = payload.events[0];
      expect(calEvent.location).toBe(
        "Viracopos Airport, Campinas → Confins Airport, BH"
      );
    });
  });

  describe("createRoundTripCalendarEvents", () => {
    it("should create both departure and return events", async () => {
      vi.mocked(childProcess.execFileSync).mockReturnValue("ok");

      const result = await createRoundTripCalendarEvents(
        10,
        "LATAM",
        "1001",
        "GRU",
        "JFK",
        new Date("2025-05-10T20:00:00Z"),
        new Date("2025-05-11T04:00:00Z"),
        "DEP123",
        "LATAM",
        "1002",
        new Date("2025-05-20T20:00:00Z"),
        new Date("2025-05-21T04:00:00Z"),
        "RET123",
        "Guarulhos, SP",
        "New York, NY"
      );

      expect(result).toEqual({ departure: true, return: true });
      expect(childProcess.execFileSync).toHaveBeenCalledTimes(2);

      const callArgs1 = vi.mocked(childProcess.execFileSync).mock.calls[0];
      const callArgs2 = vi.mocked(childProcess.execFileSync).mock.calls[1];

      const inputArgs1 = callArgs1[1] as string[];
      const inputArgs2 = callArgs2[1] as string[];

      const payload1 = JSON.parse(
        inputArgs1[inputArgs1.indexOf("--input") + 1]
      );
      const payload2 = JSON.parse(
        inputArgs2[inputArgs2.indexOf("--input") + 1]
      );

      const events = [payload1.events[0], payload2.events[0]];

      const departureEvent = events.find(e => e.summary.includes("(Ida)"));
      const returnEvent = events.find(e => e.summary.includes("(Volta)"));

      expect(departureEvent).toBeDefined();
      expect(departureEvent?.location).toBe("Guarulhos, SP → New York, NY");

      expect(returnEvent).toBeDefined();
      expect(returnEvent?.location).toBe("New York, NY → Guarulhos, SP");
    });
  });
});
