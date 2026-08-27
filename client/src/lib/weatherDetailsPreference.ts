export type WeatherLeg = "departure" | "return";

export type WeatherDetailsVisibility = Record<WeatherLeg, boolean>;

export const WEATHER_DETAILS_STORAGE_KEY = "smartfly.calendar.weather-details-visible.v1";

const DEFAULT_VISIBILITY: WeatherDetailsVisibility = {
  departure: true,
  return: true,
};

export function readWeatherDetailsVisibility(
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage
): WeatherDetailsVisibility {
  const raw = storage?.getItem(WEATHER_DETAILS_STORAGE_KEY);
  if (!raw) return DEFAULT_VISIBILITY;

  try {
    const parsed = JSON.parse(raw) as Partial<WeatherDetailsVisibility>;
    if (typeof parsed.departure !== "boolean" || typeof parsed.return !== "boolean") {
      return DEFAULT_VISIBILITY;
    }
    return { departure: parsed.departure, return: parsed.return };
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

export function saveWeatherDetailsVisibility(
  visibility: WeatherDetailsVisibility,
  storage: Pick<Storage, "setItem"> | null = typeof window === "undefined" ? null : window.localStorage
) {
  storage?.setItem(WEATHER_DETAILS_STORAGE_KEY, JSON.stringify(visibility));
}
