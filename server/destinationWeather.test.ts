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
        },
      }),
    });
    global.fetch = fetchMock;

    const result = await getDestinationWeather("nvt", "2026-08-05", now);

    expect(result).toMatchObject({
      available: true,
      airportCode: "NVT",
      destinationLabel: "Navegantes",
      summary: "Parcialmente nublado",
      temperatureMinC: 19,
      temperatureMaxC: 24,
      precipitationProbability: 35,
      windSpeedKmh: 17,
    });
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.hostname).toBe("api.open-meteo.com");
    expect(requestUrl.searchParams.get("latitude")).toBe("-26.8798");
    expect(requestUrl.searchParams.get("start_date")).toBe("2026-08-05");
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
