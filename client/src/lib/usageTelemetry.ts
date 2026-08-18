export const USAGE_TELEMETRY_CONSENT_KEY = "smartfly_usage_telemetry_consent";
export const USAGE_TELEMETRY_SESSION_KEY = "smartfly_usage_telemetry_session";

export type ApproximatePosition = {
  latitudeE2: number;
  longitudeE2: number;
};

export function getSafeUsageRoute(pathname: string): string {
  return /^\/[a-zA-Z0-9_/-]*$/.test(pathname) ? pathname : "/";
}

export function approximatePosition(
  latitude: number,
  longitude: number
): ApproximatePosition | undefined {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  return {
    latitudeE2: Math.round(latitude * 100),
    longitudeE2: Math.round(longitude * 100),
  };
}

export function createUsageTelemetrySessionId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
