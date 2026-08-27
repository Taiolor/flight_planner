const FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const MAX_FORECAST_BYTES = 64_000;
const FORECAST_WINDOW_DAYS = 16;

const airportWeatherLocations: Record<string, { latitude: number; longitude: number; label: string }> = {
  GRU: { latitude: -23.4356, longitude: -46.4731, label: "Guarulhos" },
  CGH: { latitude: -23.6261, longitude: -46.6566, label: "São Paulo" },
  VCP: { latitude: -23.0074, longitude: -47.1345, label: "Campinas" },
  NVT: { latitude: -26.8798, longitude: -48.6514, label: "Navegantes" },
};

const weatherCodeLabels: Record<number, string> = {
  0: "Céu limpo",
  1: "Predominantemente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina com geada",
  51: "Garoa leve",
  53: "Garoa moderada",
  55: "Garoa intensa",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva forte",
  80: "Pancadas leves",
  81: "Pancadas moderadas",
  82: "Pancadas fortes",
  95: "Trovoadas",
};

type OpenMeteoResponse = {
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
    wind_speed_10m_max?: number[];
  };
};

export type DestinationWeather =
  | {
      available: true;
      airportCode: string;
      destinationLabel: string;
      forecastDate: string;
      summary: string;
      temperatureMinC: number;
      temperatureMaxC: number;
      precipitationProbability: number;
      windSpeedKmh: number;
      sourceLabel: string;
      sourceUrl: string;
    }
  | {
      available: false;
      reason: "unsupported_destination" | "outside_forecast_window" | "unavailable";
    };

function toUtcDay(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(value) ? null : value;
}

function getForecastDateOffset(flightDate: string, now: Date): number | null {
  const flightDay = toUtcDay(flightDate);
  if (flightDay === null) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((flightDay - today) / 86_400_000);
}

export async function getDestinationWeather(
  airportCode: string,
  flightDate: string,
  now = new Date()
): Promise<DestinationWeather> {
  const normalizedAirportCode = airportCode.trim().toUpperCase();
  const location = airportWeatherLocations[normalizedAirportCode];
  if (!location) return { available: false, reason: "unsupported_destination" };

  const dayOffset = getForecastDateOffset(flightDate, now);
  if (dayOffset === null || dayOffset < 0 || dayOffset > FORECAST_WINDOW_DAYS) {
    return { available: false, reason: "outside_forecast_window" };
  }

  const requestUrl = new URL(FORECAST_BASE_URL);
  requestUrl.searchParams.set("latitude", String(location.latitude));
  requestUrl.searchParams.set("longitude", String(location.longitude));
  requestUrl.searchParams.set("daily", "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max");
  requestUrl.searchParams.set("timezone", "America/Sao_Paulo");
  requestUrl.searchParams.set("start_date", flightDate);
  requestUrl.searchParams.set("end_date", flightDate);

  try {
    const response = await fetch(requestUrl, { signal: AbortSignal.timeout(4_000) });
    if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
    const rawBody = await response.text();
    if (rawBody.length > MAX_FORECAST_BYTES) throw new Error("Weather provider payload exceeded limit");
    const payload = JSON.parse(rawBody) as OpenMeteoResponse;
    const daily = payload.daily;
    const forecastDate = daily?.time?.[0];
    const temperatureMinC = daily?.temperature_2m_min?.[0];
    const temperatureMaxC = daily?.temperature_2m_max?.[0];
    const precipitationProbability = daily?.precipitation_probability_max?.[0];
    const weatherCode = daily?.weather_code?.[0];
    const windSpeedKmh = daily?.wind_speed_10m_max?.[0];

    if (
      !forecastDate ||
      typeof temperatureMinC !== "number" ||
      typeof temperatureMaxC !== "number" ||
      typeof precipitationProbability !== "number" ||
      typeof weatherCode !== "number" ||
      typeof windSpeedKmh !== "number"
    ) {
      throw new Error("Weather provider response is incomplete");
    }

    return {
      available: true,
      airportCode: normalizedAirportCode,
      destinationLabel: location.label,
      forecastDate,
      summary: weatherCodeLabels[weatherCode] ?? "Condições variáveis",
      temperatureMinC: Math.round(temperatureMinC),
      temperatureMaxC: Math.round(temperatureMaxC),
      precipitationProbability: Math.round(precipitationProbability),
      windSpeedKmh: Math.round(windSpeedKmh),
      sourceLabel: "Open-Meteo",
      sourceUrl: "https://open-meteo.com/",
    };
  } catch (error) {
    console.warn("[DestinationWeather] Forecast unavailable:", error instanceof Error ? error.message : error);
    return { available: false, reason: "unavailable" };
  }
}
