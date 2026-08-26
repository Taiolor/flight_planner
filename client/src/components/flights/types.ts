export type WeekRow = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  isTicketIssued: number | boolean;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
  departureLocator?: string | null;
  returnLocator?: string | null;
  departureFlightNumber?: string | null;
  returnFlightNumber?: string | null;
  departureTerminal?: string | null;
  returnTerminal?: string | null;
  ticketType?: string | null;
  isDeleted?: number | boolean;
  departureRescheduled?: number;
  returnRescheduled?: number;
  departureCancelled?: number;
  returnCancelled?: number;
};

export type AdditionalCalendarFlight = {
  id: number;
  weekNumber: number;
  direction: "departure" | "return";
  airline?: string | null;
  airport?: string | null;
  flightDatetime?: string | null;
  flightNumber?: string | null;
  locator?: string | null;
  terminal?: string | null;
  rescheduled?: number | boolean | null;
  cancelled?: number | boolean | null;
};

export type DayMark = {
  departure: boolean;
  return: boolean;
  isPast: boolean;
  week: WeekRow;
  departureRescheduled?: boolean;
  returnRescheduled?: boolean;
  departureCancelled?: boolean;
  returnCancelled?: boolean;
  additionalFlights?: AdditionalCalendarFlight[];
};

export function hasCancelledFlight(mark: DayMark | undefined): boolean {
  return Boolean(
    mark &&
      ((mark.departure && mark.departureCancelled) ||
        (mark.return && mark.returnCancelled))
  );
}

export function hasRescheduledFlight(mark: DayMark | undefined): boolean {
  return Boolean(
    mark &&
      ((mark.departure && mark.departureRescheduled) ||
        (mark.return && mark.returnRescheduled))
  );
}
