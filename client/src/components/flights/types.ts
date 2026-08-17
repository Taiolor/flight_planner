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
  ticketType?: string | null;
  isDeleted?: number | boolean;
  departureRescheduled?: number;
  returnRescheduled?: number;
  departureCancelled?: number;
  returnCancelled?: number;
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
};

export function hasCancelledFlight(mark: DayMark | undefined): boolean {
  return Boolean(
    mark &&
      ((mark.departure && mark.departureCancelled) ||
        (mark.return && mark.returnCancelled))
  );
}
