import { execFileSync } from "child_process";

/**
 * Flight event for Google Calendar
 */
export interface FlightEvent {
  weekNumber: number;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureAirportAddress?: string;
  arrivalAirportAddress?: string;
  departureTime: Date;
  arrivalTime: Date;
  locator: string;
  isReturn: boolean;
}

/**
 * Format flight tracking URL
 */
function formatFlightTrackingUrl(
  airline: string,
  flightNumber: string,
  departureAirport: string,
  arrivalAirport: string,
  departureDate: Date
): string {
  // Extract airline code (first 2 letters)
  const airlineCode = airline.substring(0, 2).toUpperCase();

  // Format flight number (4 digits)
  const formattedFlightNumber = flightNumber.padStart(4, "0");

  // Format date
  const year = departureDate.getFullYear();
  const month = String(departureDate.getMonth() + 1).padStart(2, "0");
  const day = String(departureDate.getDate()).padStart(2, "0");

  return `https://www.google.com/search?q=${airlineCode}+flight+${formattedFlightNumber}+from+${departureAirport}+to+${arrivalAirport},+${year}-${month}-${day}`;
}

/**
 * Create a Google Calendar event for a flight
 */
export async function createFlightCalendarEvent(
  event: FlightEvent
): Promise<boolean> {
  try {
    // Calculate start time (2 hours before departure)
    const startTime = new Date(event.departureTime);
    startTime.setHours(startTime.getHours() - 2);

    // Format times in RFC3339
    const startTimeRFC3339 = startTime.toISOString();
    const endTimeRFC3339 = event.arrivalTime.toISOString();

    // Build description with flight tracking URL
    const trackingUrl = formatFlightTrackingUrl(
      event.airline,
      event.flightNumber,
      event.departureAirport,
      event.arrivalAirport,
      event.departureTime
    );

    const description = `
Voo: ${event.airline} ${event.flightNumber}
Localizador: ${event.locator}
De: ${event.departureAirport}
Para: ${event.arrivalAirport}

Rastrear voo: ${trackingUrl}

Planejador de Passagens Aéreas 2026
    `.trim();

    // Build event summary
    const tripType = event.isReturn ? "Volta" : "Ida";
    const summary = `✈️ ${event.airline} ${event.flightNumber} (${tripType}) - Semana ${event.weekNumber}`;

    // Build location with airport address if available
    const departureLocation =
      event.departureAirportAddress || event.departureAirport;
    const arrivalLocation = event.arrivalAirportAddress || event.arrivalAirport;
    const location = `${departureLocation} → ${arrivalLocation}`;

    // Prepare event for Google Calendar MCP
    const calendarEvent = {
      summary,
      description,
      location,
      start_time: startTimeRFC3339,
      end_time: endTimeRFC3339,
      reminders: [120], // 2 hours before
      calendar_id: "primary",
    };

    // Call Google Calendar MCP tool via CLI
    const input = JSON.stringify({
      events: [calendarEvent],
    });

    execFileSync(
      "manus-mcp-cli",
      [
        "tool",
        "call",
        "google_calendar_create_events",
        "--server",
        "google-calendar",
        "--input",
        input,
      ],
      { encoding: "utf-8", shell: false }
    );

    return true;
  } catch (error) {
    console.error("[Calendar] Failed to create flight event:", error);
    return false;
  }
}

/**
 * Create calendar events for both departure and return flights
 */
export async function createRoundTripCalendarEvents(
  weekNumber: number,
  departureAirline: string,
  departureFlightNumber: string,
  departureAirport: string,
  arrivalAirport: string,
  departureTime: Date,
  departureArrivalTime: Date,
  departureLocator: string,
  returnAirline: string,
  returnFlightNumber: string,
  returnTime: Date,
  returnArrivalTime: Date,
  returnLocator: string,
  departureAirportAddress?: string,
  arrivalAirportAddress?: string
): Promise<{ departure: boolean; return: boolean }> {
  const departureEvent: FlightEvent = {
    weekNumber,
    airline: departureAirline,
    flightNumber: departureFlightNumber,
    departureAirport,
    arrivalAirport,
    departureAirportAddress,
    arrivalAirportAddress,
    departureTime,
    arrivalTime: departureArrivalTime,
    locator: departureLocator,
    isReturn: false,
  };

  const returnEvent: FlightEvent = {
    weekNumber,
    airline: returnAirline,
    flightNumber: returnFlightNumber,
    departureAirport: arrivalAirport,
    arrivalAirport: departureAirport,
    departureAirportAddress: arrivalAirportAddress,
    arrivalAirportAddress: departureAirportAddress,
    departureTime: returnTime,
    arrivalTime: returnArrivalTime,
    locator: returnLocator,
    isReturn: true,
  };

  const [departureResult, returnResult] = await Promise.all([
    createFlightCalendarEvent(departureEvent),
    createFlightCalendarEvent(returnEvent),
  ]);

  return { departure: departureResult, return: returnResult };
}
