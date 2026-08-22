export const TELEMETRY_PERIOD_STORAGE_KEY = "smartfly.telemetry.period-hours";
export const TELEMETRY_PERIOD_VALUES = [24, 72, 168, 720] as const;

export type TelemetryPeriod = (typeof TELEMETRY_PERIOD_VALUES)[number];

function isTelemetryPeriod(value: number): value is TelemetryPeriod {
  return TELEMETRY_PERIOD_VALUES.includes(value as TelemetryPeriod);
}

export function readTelemetryPeriodPreference(
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage
): TelemetryPeriod {
  const storedValue = Number(storage?.getItem(TELEMETRY_PERIOD_STORAGE_KEY));
  return isTelemetryPeriod(storedValue) ? storedValue : 24;
}

export function saveTelemetryPeriodPreference(
  period: TelemetryPeriod,
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(TELEMETRY_PERIOD_STORAGE_KEY, String(period));
}
