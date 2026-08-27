const FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const MAX_FORECAST_BYTES = 64_000;
const FORECAST_WINDOW_DAYS = 16;
const FORECAST_CACHE_TTL_MS = 10 * 60_000;

const weatherCache = new Map<string, { expiresAt: number; value: DestinationWeather }>();

export function clearDestinationWeatherCacheForTests() {
  weatherCache.clear();
}

const airportWeatherLocations: Record<string, { latitude: number; longitude: number; label: string }> = {
  GRU: { latitude: -23.4356, longitude: -46.4731, label: "Guarulhos" },
  CGH: { latitude: -23.6261, longitude: -46.6333, label: "São Paulo" },
  VCP: { latitude: -23.0074, longitude: -47.1345, label: "Campinas" },
  NVT: { latitude: -26.8798, longitude: -48.6514, label: "Navegantes" },
};

const weatherCodeLabels: Record<number, string> = {
  0: "Céu limpo", 1: "Predominantemente limpo", 2: "Parcialmente nublado", 3: "Nublado",
  45: "Neblina", 48: "Neblina com geada", 51: "Garoa leve", 53: "Garoa moderada",
  55: "Garoa intensa", 61: "Chuva fraca", 63: "Chuva moderada", 65: "Chuva forte",
  80: "Pancadas leves", 81: "Pancadas moderadas", 82: "Pancadas fortes", 95: "Trovoadas",
};

type OpenMeteoResponse = {
  daily?: { time?: string[]; sunrise?: string[]; sunset?: string[]; temperature_2m_min?: number[]; temperature_2m_max?: number[]; precipitation_probability_max?: number[]; weather_code?: number[]; wind_speed_10m_max?: number[]; uv_index_max?: number[] };
  hourly?: { time?: string[]; temperature_2m?: number[]; apparent_temperature?: number[]; visibility?: number[]; precipitation_probability?: number[]; precipitation?: number[]; weather_code?: number[]; wind_speed_10m?: number[]; wind_gusts_10m?: number[]; wind_direction_10m?: number[] };
};

type WeatherAlert = { type: "rain" | "wind" | "visibility"; label: string };
type HourlyForecast = { time: string; temperatureC: number; apparentTemperatureC: number; visibilityKm: number; precipitationProbability: number; precipitationMm: number; windSpeedKmh: number; windGustsKmh: number; windDirectionDegrees: number; windDirectionLabel: string; weatherCode: number; summary: string };

export type DestinationWeather =
  | { available: true; airportCode: string; destinationLabel: string; forecastDate: string; summary: string; weatherCode: number; temperatureMinC: number; temperatureMaxC: number; precipitationProbability: number; windSpeedKmh: number; uvIndexMax: number; sunriseTime: string | null; sunsetTime: string | null; hourlyForecast: HourlyForecast | null; alerts: WeatherAlert[]; sourceLabel: string; sourceUrl: string }
  | { available: false; reason: "unsupported_destination" | "outside_forecast_window" | "unavailable" };

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

function getHourlyIndex(times: string[] | undefined, flightDate: string, flightTime?: string): number | null {
  if (!times?.length || !/^\d{2}:\d{2}$/.test(flightTime ?? "")) return null;
  const exact = `${flightDate}T${flightTime}`;
  const exactIndex = times.indexOf(exact);
  if (exactIndex >= 0) return exactIndex;
  const target = Date.parse(exact);
  if (Number.isNaN(target)) return null;
  let closestIndex = -1;
  let closestDifference = Number.POSITIVE_INFINITY;
  times.forEach((time, index) => {
    const candidate = Date.parse(time);
    const difference = Math.abs(candidate - target);
    if (!Number.isNaN(candidate) && difference < closestDifference) { closestIndex = index; closestDifference = difference; }
  });
  return closestIndex >= 0 ? closestIndex : null;
}

function getWindDirectionLabel(degrees: number) {
  const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % directions.length];
}

function getTime(value?: string) { return value?.split("T")[1]?.slice(0, 5) ?? null; }

function getAlerts(hourly: Pick<HourlyForecast, "precipitationProbability" | "precipitationMm" | "windSpeedKmh" | "windGustsKmh" | "visibilityKm"> | null): WeatherAlert[] {
  if (!hourly) return [];
  const alerts: WeatherAlert[] = [];
  if (hourly.precipitationProbability >= 70 || hourly.precipitationMm >= 2) alerts.push({ type: "rain", label: "Atenção: chuva relevante prevista no horário do voo." });
  if (hourly.windSpeedKmh >= 40 || hourly.windGustsKmh >= 45) alerts.push({ type: "wind", label: "Atenção: vento forte previsto no horário do voo." });
  if (hourly.visibilityKm <= 5) alerts.push({ type: "visibility", label: "Atenção: visibilidade reduzida prevista no horário do voo." });
  return alerts;
}

export async function getDestinationWeather(airportCode: string, flightDate: string, flightTimeOrNow?: string | Date, currentNow = new Date()): Promise<DestinationWeather> {
  const flightTime = typeof flightTimeOrNow === "string" ? flightTimeOrNow : undefined;
  const now = flightTimeOrNow instanceof Date ? flightTimeOrNow : currentNow;
  const normalizedAirportCode = airportCode.trim().toUpperCase();
  const location = airportWeatherLocations[normalizedAirportCode];
  if (!location) return { available: false, reason: "unsupported_destination" };
  const dayOffset = getForecastDateOffset(flightDate, now);
  if (dayOffset === null || dayOffset < 0 || dayOffset > FORECAST_WINDOW_DAYS) return { available: false, reason: "outside_forecast_window" };

  const cacheKey = `${normalizedAirportCode}:${flightDate}:${flightTime ?? "daily"}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const requestUrl = new URL(FORECAST_BASE_URL);
  requestUrl.searchParams.set("latitude", String(location.latitude));
  requestUrl.searchParams.set("longitude", String(location.longitude));
  requestUrl.searchParams.set("daily", "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset");
  requestUrl.searchParams.set("hourly", "weather_code,temperature_2m,apparent_temperature,visibility,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m");
  requestUrl.searchParams.set("forecast_days", String(FORECAST_WINDOW_DAYS));
  requestUrl.searchParams.set("timezone", "America/Sao_Paulo");
  requestUrl.searchParams.set("start_date", flightDate);
  requestUrl.searchParams.set("end_date", flightDate);

  try {
    const response = await fetch(requestUrl, { signal: AbortSignal.timeout(2_500) });
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
    const uvIndexMax = daily?.uv_index_max?.[0];
    if (!forecastDate || typeof temperatureMinC !== "number" || typeof temperatureMaxC !== "number" || typeof precipitationProbability !== "number" || typeof weatherCode !== "number" || typeof windSpeedKmh !== "number" || typeof uvIndexMax !== "number") throw new Error("Weather provider response is incomplete");

    const hourlyIndex = getHourlyIndex(payload.hourly?.time, flightDate, flightTime);
    const hourlyForecast = hourlyIndex === null ? null : (() => {
      const temperatureC = payload.hourly?.temperature_2m?.[hourlyIndex];
      const apparentTemperatureC = payload.hourly?.apparent_temperature?.[hourlyIndex];
      const visibilityMeters = payload.hourly?.visibility?.[hourlyIndex];
      const hourlyPrecipitationProbability = payload.hourly?.precipitation_probability?.[hourlyIndex];
      const precipitationMm = payload.hourly?.precipitation?.[hourlyIndex];
      const hourlyWeatherCode = payload.hourly?.weather_code?.[hourlyIndex];
      const hourlyWindSpeed = payload.hourly?.wind_speed_10m?.[hourlyIndex];
      const windGustsKmh = payload.hourly?.wind_gusts_10m?.[hourlyIndex];
      const windDirectionDegrees = payload.hourly?.wind_direction_10m?.[hourlyIndex];
      const time = payload.hourly?.time?.[hourlyIndex];
      if (!time || typeof temperatureC !== "number" || typeof apparentTemperatureC !== "number" || typeof visibilityMeters !== "number" || typeof hourlyPrecipitationProbability !== "number" || typeof precipitationMm !== "number" || typeof hourlyWeatherCode !== "number" || typeof hourlyWindSpeed !== "number" || typeof windGustsKmh !== "number" || typeof windDirectionDegrees !== "number") return null;
      return { time, temperatureC: Math.round(temperatureC), apparentTemperatureC: Math.round(apparentTemperatureC), visibilityKm: Number((visibilityMeters / 1000).toFixed(1)), precipitationProbability: Math.round(hourlyPrecipitationProbability), precipitationMm: Number(precipitationMm.toFixed(1)), windSpeedKmh: Math.round(hourlyWindSpeed), windGustsKmh: Math.round(windGustsKmh), windDirectionDegrees: Math.round(windDirectionDegrees), windDirectionLabel: getWindDirectionLabel(windDirectionDegrees), weatherCode: hourlyWeatherCode, summary: weatherCodeLabels[hourlyWeatherCode] ?? "Condições variáveis" };
    })();

    const result: DestinationWeather = { available: true, airportCode: normalizedAirportCode, destinationLabel: location.label, forecastDate, summary: weatherCodeLabels[weatherCode] ?? "Condições variáveis", weatherCode, temperatureMinC: Math.round(temperatureMinC), temperatureMaxC: Math.round(temperatureMaxC), precipitationProbability: Math.round(precipitationProbability), windSpeedKmh: Math.round(windSpeedKmh), uvIndexMax: Number(uvIndexMax.toFixed(1)), sunriseTime: getTime(daily?.sunrise?.[0]), sunsetTime: getTime(daily?.sunset?.[0]), hourlyForecast, alerts: getAlerts(hourlyForecast), sourceLabel: "Open-Meteo", sourceUrl: "https://open-meteo.com/" };
    weatherCache.set(cacheKey, { value: result, expiresAt: Date.now() + FORECAST_CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.warn("[DestinationWeather] Forecast unavailable:", error instanceof Error ? error.message : error);
    return { available: false, reason: "unavailable" };
  }
}
