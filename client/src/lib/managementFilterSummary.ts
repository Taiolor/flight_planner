export type ManagementFilterState = {
  month: string;
  airline: string;
  ticketStatus: string;
  cheapestOnly: boolean;
  departureTime: number;
  returnTime: number;
};

/** Conta somente critérios que realmente restringem a lista de semanas. */
export function getActiveManagementFilterCount(
  filters: ManagementFilterState
): number {
  return [
    filters.month !== "all",
    filters.airline !== "all",
    filters.ticketStatus !== "all",
    filters.cheapestOnly,
    filters.departureTime > 0,
    filters.returnTime > 0,
  ].filter(Boolean).length;
}
