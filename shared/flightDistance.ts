export type AirportCoordinate = {
  latitude: number;
  longitude: number;
};

/** Coordenadas de referência para os aeroportos atualmente usados no planejador. */
export const airportCoordinates: Record<string, AirportCoordinate> = {
  GRU: { latitude: -23.43556, longitude: -46.47306 },
  CGH: { latitude: -23.62611, longitude: -46.65639 },
  NVT: { latitude: -26.87861, longitude: -48.65083 },
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Retorna a distância geodésica estimada entre dois aeroportos em quilômetros. */
export function getFlightDistanceKm(
  origin?: string | null,
  destination?: string | null
): number | null {
  const from = origin ? airportCoordinates[origin.trim().toUpperCase()] : undefined;
  const to = destination
    ? airportCoordinates[destination.trim().toUpperCase()]
    : undefined;
  if (!from || !to) return null;

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

export function getSaoPauloDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
