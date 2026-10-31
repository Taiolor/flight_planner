import type { DecisionTrip } from "@/lib/decisionCenter";

const STORAGE_PREFIX = "smartfly:offline-next-trips";
const CACHE_VERSION = 1;
const CACHE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const STATUSES = new Set<DecisionTrip["status"]>(["issued", "pending", "rescheduled", "cancelled"]);

export type OfflineNextTripsSnapshot = {
  version: number;
  cachedAt: number;
  trips: DecisionTrip[];
};

function cacheKey(year: number) {
  return `${STORAGE_PREFIX}:${year}`;
}

function isValidTrip(value: unknown): value is DecisionTrip {
  if (!value || typeof value !== "object") return false;
  const trip = value as DecisionTrip;
  return (
    Number.isInteger(trip.weekNumber) && trip.weekNumber > 0 && trip.weekNumber <= 53 &&
    typeof trip.departureDate === "string" && DATE_PATTERN.test(trip.departureDate) &&
    typeof trip.returnDate === "string" && DATE_PATTERN.test(trip.returnDate) &&
    typeof trip.route === "string" && trip.route.length > 0 && trip.route.length <= 80 &&
    (trip.airline === null || (typeof trip.airline === "string" && trip.airline.length <= 60)) &&
    typeof trip.status === "string" && STATUSES.has(trip.status)
  );
}

function sanitizeTrip(trip: DecisionTrip): DecisionTrip {
  return {
    weekNumber: trip.weekNumber,
    departureDate: trip.departureDate,
    returnDate: trip.returnDate,
    route: trip.route.trim(),
    airline: trip.airline?.trim() || null,
    status: trip.status,
  };
}

/** Guarda no máximo três próximos deslocamentos e nunca inclui localizadores, números de voo ou valores. */
export function saveOfflineNextTrips(year: number, trips: DecisionTrip[], cachedAt = Date.now()) {
  if (typeof window === "undefined" || !Number.isInteger(year) || !Number.isFinite(cachedAt) || cachedAt <= 0) return;
  const sanitizedTrips = trips.filter(isValidTrip).slice(0, 3).map(sanitizeTrip);
  if (!sanitizedTrips.length) return;
  const snapshot: OfflineNextTripsSnapshot = {
    version: CACHE_VERSION,
    cachedAt,
    trips: sanitizedTrips,
  };
  window.localStorage.setItem(cacheKey(year), JSON.stringify(snapshot));
}

export function readOfflineNextTrips(
  year: number,
  now = Date.now()
): OfflineNextTripsSnapshot | null {
  if (typeof window === "undefined" || !Number.isInteger(year)) return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(year));
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as OfflineNextTripsSnapshot;
    const valid =
      snapshot.version === CACHE_VERSION &&
      Number.isFinite(snapshot.cachedAt) &&
      snapshot.cachedAt > 0 &&
      now >= snapshot.cachedAt &&
      now - snapshot.cachedAt <= CACHE_MAX_AGE_MS &&
      Array.isArray(snapshot.trips) &&
      snapshot.trips.length > 0 &&
      snapshot.trips.length <= 3 &&
      snapshot.trips.every(isValidTrip);
    return valid ? snapshot : null;
  } catch {
    return null;
  }
}
