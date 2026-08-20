export function getCalendarWeekFromLocation(location: string): number | null {
  const query = location.includes("?") ? location.slice(location.indexOf("?") + 1) : "";
  const value = Number(new URLSearchParams(query).get("week"));
  return Number.isInteger(value) && value > 0 && value <= 53 ? value : null;
}
