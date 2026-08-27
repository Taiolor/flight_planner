import { afterEach, describe, expect, it, vi } from "vitest";
import { getDestinationWeather } from "./destinationWeather";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("getDestinationWeather", () => {
  const now = new Date("2026-08-01T12:00:00Z");

  it("consulta somente as coordenadas públicas do aeroporto e normaliza a previsão", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        daily: {
          time: ["2026-08-05"],
          temperature_2m_min: [19.4],
          temperature_2m_max: [23.6],
          precipitation_probability_max: [35.4],
          weather_code: [2],
          wind_speed_10m_max: [16.7],
          uv_index_max: [5.6],
          sunrise: ["2026-08-05T06:42"],
          sunset: ["2026-08-05T17:54"],
        },
        hourly: {
          time: ["2026-08-05T14:00", "2026-08-05T15:00"],
          temperature_2m: [22.2, 21.6],
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
      hourlyForecast: {
        time: "2026-08-05T14:00",
        summary: "Chuva moderada",
        temperatureC: 22,
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
      alerts: [{ type: "rain", label: "Atenção: chuva relevante prevista no horário do voo." }],
    });
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.hostname).toBe("api.open-meteo.com");
    expect(requestUrl.searchParams.get("latitude")).toBe("-26.8798");
    expect(requestUrl.searchParams.get("start_date")).toBe("2026-08-05");
    expect(requestUrl.searchParams.get("forecast_days")).toBe("16");
    expect(requestUrl.searchParams.get("hourly")).toContain("wind_gusts_10m");
    expect(requestUrl.searchParams.get("hourly")).toContain("wind_direction_10m");
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
});
