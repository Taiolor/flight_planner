import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDestinationWeatherCacheForTests, getDestinationWeather } from "./destinationWeather";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
  clearDestinationWeatherCacheForTests();
});

describe("getDestinationWeather", () => {
  const now = new Date("2026-08-01T12:00:00Z");

  it("consulta somente as coordenadas públicas do aeroporto e normaliza a previsão", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        daily: {
          time: ["2026-08-05", "2026-08-06", "2026-08-07"],
          temperature_2m_min: [19.4, 18.2, 17.6],
          temperature_2m_max: [23.6, 25.4, 22.1],
          precipitation_probability_max: [35.4, 70, 15],
          weather_code: [2, 61, 0],
          wind_speed_10m_max: [16.7, 21.2, 12.4],
          uv_index_max: [5.6, 4.2, 6.1],
          sunrise: ["2026-08-05T06:42", "2026-08-06T06:42", "2026-08-07T06:43"],
          sunset: ["2026-08-05T17:54", "2026-08-06T17:54", "2026-08-07T17:55"],
        },
        hourly: {
          time: ["2026-08-05T14:00", "2026-08-05T15:00"],
          temperature_2m: [22.2, 21.6],
          apparent_temperature: [21.1, 20.4],
          visibility: [4_200, 10_000],
          precipitation_probability: [75, 30],
          precipitation: [2.4, 0],
          weather_code: [63, 2],
          wind_speed_10m: [22.5, 14.2],
          wind_gusts_10m: [34.2, 18.4],
          wind_direction_10m: [67, 120],
        },
      }),
    });
    global.fetch = fetchMock;

    const result = await getDestinationWeather("nvt", "2026-08-05", "14:25", now);

    expect(result).toMatchObject({
      available: true,
      airportCode: "NVT",
      destinationLabel: "Navegantes",
      summary: "Parcialmente nublado",
      temperatureMinC: 19,
      temperatureMaxC: 24,
      precipitationProbability: 35,
      windSpeedKmh: 17,
      uvIndexMax: 5.6,
      weatherCode: 2,
      dailyForecast: [
        { date: "2026-08-05", summary: "Parcialmente nublado", weatherCode: 2, temperatureMinC: 19, temperatureMaxC: 24, precipitationProbability: 35 },
        { date: "2026-08-06", summary: "Chuva fraca", weatherCode: 61, temperatureMinC: 18, temperatureMaxC: 25, precipitationProbability: 70 },
        { date: "2026-08-07", summary: "Céu limpo", weatherCode: 0, temperatureMinC: 18, temperatureMaxC: 22, precipitationProbability: 15 },
      ],
      hourlyForecast: {
        time: "2026-08-05T14:00",
        summary: "Chuva moderada",
        temperatureC: 22,
        apparentTemperatureC: 21,
        visibilityKm: 4.2,
        precipitationProbability: 75,
        precipitationMm: 2.4,
        windSpeedKmh: 23,
        windGustsKmh: 34,
        windDirectionDegrees: 67,
        windDirectionLabel: "NE",
        weatherCode: 63,
      },
      sunriseTime: "06:42",
      sunsetTime: "17:54",
      alerts: [
        { type: "rain", label: "Atenção: chuva relevante prevista no horário do voo." },
        { type: "visibility", label: "Atenção: visibilidade reduzida prevista no horário do voo." },
      ],
    });
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.hostname).toBe("api.open-meteo.com");
    expect(requestUrl.searchParams.get("latitude")).toBe("-26.8798");
    expect(requestUrl.searchParams.get("start_date")).toBe("2026-08-05");
    expect(requestUrl.searchParams.get("end_date")).toBe("2026-08-09");
    expect(requestUrl.searchParams.has("forecast_days")).toBe(false);
    expect(requestUrl.searchParams.get("hourly")).toContain("wind_gusts_10m");
    expect(requestUrl.searchParams.get("hourly")).toContain("wind_direction_10m");
    expect(requestUrl.searchParams.get("hourly")).toContain("apparent_temperature");
    expect(requestUrl.searchParams.get("hourly")).toContain("visibility");
    expect(requestUrl.searchParams.get("daily")).toContain("sunrise");
    expect(requestUrl.searchParams.get("daily")).toContain("uv_index_max");
  });

  it("não consulta a internet para aeroporto desconhecido ou fora da janela de previsão", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    await expect(getDestinationWeather("XXX", "2026-08-05", now)).resolves.toEqual({
      available: false,
      reason: "unsupported_destination",
    });
    await expect(getDestinationWeather("NVT", "2026-09-30", now)).resolves.toEqual({
      available: false,
      reason: "outside_forecast_window",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falha de forma segura quando a fonte meteorológica não responde", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("timeout"));

    await expect(getDestinationWeather("GRU", "2026-08-05", now)).resolves.toEqual({
      available: false,
      reason: "unavailable",
    });
  });

  it("reutiliza por dez minutos uma previsão válida do mesmo aeroporto, data e horário", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        daily: { time: ["2026-08-06"], temperature_2m_min: [18], temperature_2m_max: [25], precipitation_probability_max: [20], weather_code: [1], wind_speed_10m_max: [12], uv_index_max: [6], sunrise: ["2026-08-06T06:42"], sunset: ["2026-08-06T17:54"] },
        hourly: { time: ["2026-08-06T14:00"], temperature_2m: [24], apparent_temperature: [24], visibility: [10_000], precipitation_probability: [10], precipitation: [0], weather_code: [1], wind_speed_10m: [12], wind_gusts_10m: [18], wind_direction_10m: [90] },
      }),
    });
    global.fetch = fetchMock;

    await getDestinationWeather("NVT", "2026-08-06", "14:00", now);
    await getDestinationWeather("NVT", "2026-08-06", "14:00", now);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
