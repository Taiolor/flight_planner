import { airportNames } from "@/lib/calendarHelper";
import { normalizeCalendarFlightSearch } from "@/lib/calendarFlightSearch";

export type CalendarDestinationSuggestion = {
  airportCode: string;
  destination: string;
};

const destinations = Object.entries(airportNames)
  .map(([airportCode, destination]) => ({ airportCode, destination }))
  .sort((left, right) => left.destination.localeCompare(right.destination, "pt-BR"));

export function getCalendarDestinationSuggestions(
  query: string,
  limit = 6
): CalendarDestinationSuggestion[] {
  const normalizedQuery = normalizeCalendarFlightSearch(query);
  if (normalizedQuery.length < 2 || limit < 1) return [];

  return destinations
    .filter(suggestion => {
      const normalizedDestination = normalizeCalendarFlightSearch(suggestion.destination);
      const normalizedCode = normalizeCalendarFlightSearch(suggestion.airportCode);
      return normalizedDestination.includes(normalizedQuery) || normalizedCode.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftStartsWithQuery = normalizeCalendarFlightSearch(left.destination).startsWith(normalizedQuery);
      const rightStartsWithQuery = normalizeCalendarFlightSearch(right.destination).startsWith(normalizedQuery);
      if (leftStartsWithQuery !== rightStartsWithQuery) return leftStartsWithQuery ? -1 : 1;
      return left.destination.localeCompare(right.destination, "pt-BR");
    })
    .slice(0, limit);
}
