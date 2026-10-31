export const WEATHER_ALERTS_STORAGE_KEY = "smartfly.calendar.weather-alerts-visible.v1";

export function readWeatherAlertsVisible(
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage
): boolean {
  const raw = storage?.getItem(WEATHER_ALERTS_STORAGE_KEY);
  if (raw === null || raw === undefined) return true;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : true;
  } catch {
    return true;
  }
}

export function saveWeatherAlertsVisible(
  visible: boolean,
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(WEATHER_ALERTS_STORAGE_KEY, JSON.stringify(visible));
}
