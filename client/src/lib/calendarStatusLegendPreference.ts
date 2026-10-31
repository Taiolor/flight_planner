export const CALENDAR_STATUS_LEGEND_STORAGE_KEY =
  "smartfly.calendar.status-legend-expanded.v1";

export function readCalendarStatusLegendExpanded(
  storage: Pick<Storage, "getItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
): boolean {
  const raw = storage?.getItem(CALENDAR_STATUS_LEGEND_STORAGE_KEY);
  if (raw === null || raw === undefined) return true;

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : true;
  } catch {
    return true;
  }
}

export function saveCalendarStatusLegendExpanded(
  expanded: boolean,
  storage: Pick<Storage, "setItem"> | null =
    typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(CALENDAR_STATUS_LEGEND_STORAGE_KEY, JSON.stringify(expanded));
}
