import { airportNames } from "@/lib/calendarHelper";
import type { DayMark } from "@/components/flights/types";

export function normalizeCalendarFlightSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

function airportSearchValues(airport: string | null | undefined): string[] {
  if (!airport) return [];
  return [airport, airportNames[airport] ?? ""];
}

export function dayMarkMatchesFlightSearch(mark: DayMark | undefined, query: string): boolean {
  const normalizedQuery = normalizeCalendarFlightSearch(query);
  if (!normalizedQuery) return true;
  if (!mark) return false;

  const { week } = mark;
  const routeAirports = [
    ...airportSearchValues(week.departureAirport),
    ...airportSearchValues(week.returnAirport),
  ];
  const values = [
    week.weekNumber ? `semana ${week.weekNumber}` : "",
    ...routeAirports,
    ...(mark.departure
      ? [
          week.departureAirline ?? "",
          week.departureFlightNumber ?? "",
          week.departureFlightNumber ? `voo ${week.departureFlightNumber}` : "",
          week.departureLocator ?? "",
          week.departureTerminal ?? "",
          week.departureTerminal ? `terminal ${week.departureTerminal}` : "",
        ]
      : []),
    ...(mark.return
      ? [
          week.returnAirline ?? "",
          week.returnFlightNumber ?? "",
          week.returnFlightNumber ? `voo ${week.returnFlightNumber}` : "",
          week.returnLocator ?? "",
          week.returnTerminal ?? "",
          week.returnTerminal ? `terminal ${week.returnTerminal}` : "",
        ]
      : []),
    ...(mark.additionalFlights ?? []).flatMap(flight => [
      flight.airline ?? "",
      flight.flightNumber ?? "",
      flight.flightNumber ? `voo ${flight.flightNumber}` : "",
      flight.locator ?? "",
      flight.terminal ?? "",
      flight.terminal ? `terminal ${flight.terminal}` : "",
      ...airportSearchValues(flight.airport),
    ]),
  ];

  const compactQuery = normalizedQuery.replace(/[^a-z0-9]/g, "");
  return values.some(value => {
    const normalizedValue = normalizeCalendarFlightSearch(value);
    return (
      normalizedValue.includes(normalizedQuery) ||
      normalizedValue.replace(/[^a-z0-9]/g, "").includes(compactQuery)
    );
  });
}
