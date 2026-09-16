// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestinationWeatherPanel } from "./FlightPopup";

const weatherForecast = {
  available: true as const,
  airportCode: "NVT",
  destinationLabel: "Navegantes",
  forecastDate: "2026-09-07",
  summary: "Garoa leve",
  weatherCode: 51,
  temperatureMinC: 18,
  temperatureMaxC: 23,
  precipitationProbability: 50,
  windSpeedKmh: 16,
  uvIndexMax: 4,
  sunriseTime: "06:21",
  sunsetTime: "18:04",
  hourlyForecast: {
    time: "2026-09-07T18:00",
    temperatureC: 20,
    apparentTemperatureC: 20,
    visibilityKm: 20,
    precipitationProbability: 52,
    precipitationMm: 0.2,
    windSpeedKmh: 11,
    windGustsKmh: 20,
    windDirectionDegrees: 45,
    windDirectionLabel: "NE",
    weatherCode: 51,
    summary: "Garoa leve",
  },
  dailyForecast: [],
  alerts: [],
  sourceLabel: "Open-Meteo",
  sourceUrl: "https://open-meteo.com/",
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    destinationWeather: {
      forecast: {
        useQuery: vi.fn(() => ({ data: weatherForecast, isLoading: false, isError: false, refetch: vi.fn() })),
      },
    },
  },
}));

describe("DestinationWeatherPanel", () => {
  const baseProps = {
    originCode: "GRU",
    destinationCode: "NVT",
    destinationDate: "2026-09-07",
    destinationTime: "17:55",
    tone: "blue" as const,
    detailsId: "weather-details-departure",
  };

  it("recolhe de fato os detalhes e expõe um controle acessível para reabri-los", () => {
    const onToggleDetails = vi.fn();
    const { rerender } = render(
      <DestinationWeatherPanel {...baseProps} detailsVisible={true} onToggleDetails={onToggleDetails} />
    );

    const hideButton = screen.getByRole("button", { name: "Ocultar detalhes" });
    expect(hideButton.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/Próximo do voo/)).toBeTruthy();
    fireEvent.click(hideButton);
    expect(onToggleDetails).toHaveBeenCalledTimes(1);

    rerender(<DestinationWeatherPanel {...baseProps} detailsVisible={false} onToggleDetails={onToggleDetails} />);

    expect(screen.getByRole("button", { name: "Ver detalhes" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Detalhes da previsão ocultos.")).toBeTruthy();
    expect(screen.queryByText(/Próximo do voo/)).toBeNull();
  });
});
