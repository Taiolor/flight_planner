/** Mantém valores armazenados intactos e normaliza apenas sua apresentação. */
export function formatAirlineDisplayName(
  airline: string | null | undefined,
  fallback = "—"
): string {
  return airline?.trim().toUpperCase() || fallback;
}
