// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FlightPopup from "./FlightPopup";
import type { DayMark } from "./types";
import { WEATHER_DETAILS_STORAGE_KEY } from "@/lib/weatherDetailsPreference";

const weatherState = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    destinationWeather: {
      forecast: {
        useQuery: weatherState.useQuery,
      },
    },
  },
}));

const makeMark = (ticketType: "roundtrip" | "oneway" = "roundtrip"): DayMark => ({
  departure: true,
  return: ticketType === "roundtrip",
  isPast: false,
  week: {
    weekNumber: 26,
    departureDate: "23/08/2026",
    returnDate: "28/08/2026",
    isTicketIssued: 1,
    departureAirport: "GRU",
    returnAirport: "NVT",
    departureAirline: "latam",
    returnAirline: "gol",
    departureFlightNumber: "LA3000",
    returnFlightNumber: "G31234",
    departureFlightDatetime: "2026-08-23T14:30:00",
    returnFlightDatetime: "2026-08-28T10:00:00",
    departureTerminal: "2",
    returnTerminal: "1",
    ticketType,
  },
});

afterEach(cleanup);

afterEach(() => {
  window.localStorage.clear();
  weatherState.useQuery.mockReset();
  weatherState.useQuery.mockReturnValue({ isLoading: false, data: { available: false } });
});

describe("FlightPopup", () => {
  it("mostra a previsão do destino com fonte na área expandida", () => {
    window.localStorage.setItem(WEATHER_DETAILS_STORAGE_KEY, '{"departure":true,"return":true}');
    weatherState.useQuery
      .mockReturnValueOnce({
        isLoading: false,
        data: {
          available: true,
          destinationLabel: "Navegantes",
          summary: "Parcialmente nublado",
          weatherCode: 63,
          temperatureMinC: 20,
          temperatureMaxC: 24,
          precipitationProbability: 20,
          windSpeedKmh: 18,
          uvIndexMax: 5.6,
          forecastDate: "2026-08-23",
          sunriseTime: "06:48",
          sunsetTime: "17:48",
          hourlyForecast: {
            time: "2026-08-23T14:00",
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
          alerts: [{ type: "rain", label: "Atenção: chuva relevante prevista no horário do voo." }],
          sourceLabel: "Open-Meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      })
      .mockReturnValueOnce({
        isLoading: false,
        data: {
          available: true,
          destinationLabel: "Guarulhos",
          summary: "Céu limpo",
          weatherCode: 0,
          temperatureMinC: 18,
          temperatureMaxC: 25,
          precipitationProbability: 0,
          windSpeedKmh: 12,
          forecastDate: "2026-08-23",
          sunriseTime: "06:47",
          sunsetTime: "17:47",
          hourlyForecast: {
            time: "2026-08-23T14:00",
            summary: "Céu limpo",
            temperatureC: 24,
            apparentTemperatureC: 24,
            visibilityKm: 10,
            precipitationProbability: 0,
            precipitationMm: 0,
            windSpeedKmh: 10,
            windGustsKmh: 16,
            windDirectionDegrees: 0,
            windDirectionLabel: "N",
            weatherCode: 0,
          },
          alerts: [],
          sourceLabel: "Open-Meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      })
      .mockReturnValueOnce({ isLoading: false, data: { available: false } })
      .mockReturnValueOnce({ isLoading: false, data: { available: false } });

    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getAllByText("Clima no destino")).toHaveLength(2);
    expect(screen.getByText("Navegantes: Parcialmente nublado")).toBeTruthy();
    expect(screen.getByText("20–24 °C · chuva 20% · vento 18 km/h · UV 5.6")).toBeTruthy();
    expect(screen.getByText(/Próximo do voo \(14:00\): Chuva moderada/)).toBeTruthy();
    expect(screen.getByText(/Próximo do voo \(14:00\).*sensação 21 °C/)).toBeTruthy();
    expect(screen.getByText(/vento 23 km\/h NE · rajadas 34 km\/h · visibilidade 4.2 km/)).toBeTruthy();
    expect(screen.getByText("Nascer do sol 06:48")).toBeTruthy();
    expect(screen.getByText("Pôr do sol 17:48")).toBeTruthy();
    expect(screen.getByText(/Origem × destino no horário do voo/)).toBeTruthy();
    expect(screen.getByText(/Guarulhos: 24 °C, sensação 24 °C, visibilidade 10 km/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Ocultar detalhes" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /alertas/ })).toBeNull();
    expect(screen.getByText("Atenção: chuva relevante prevista no horário do voo.")).toBeTruthy();
    expect(screen.getByText(/Fonte: Open-Meteo/).getAttribute("href")).toBe("https://open-meteo.com/");
  });

  it("posiciona o clima depois do localizador e do rastreamento em cada trecho", () => {
    const mark = makeMark();
    mark.week.departureLocator = "IDA123";
    mark.week.returnLocator = "VOLTA456";
    render(<FlightPopup mark={mark} onClose={() => {}} />);

    const departureGrid = screen.getByLabelText("Previsão no destino NVT").parentElement;
    const returnGrid = screen.getByLabelText("Previsão no destino GRU").parentElement;
    expect(departureGrid).toBeTruthy();
    expect(returnGrid).toBeTruthy();

    for (const grid of [departureGrid!, returnGrid!]) {
      const children = Array.from(grid.children);
      const weatherIndex = children.findIndex(child => child.tagName === "SECTION");
      const locatorIndex = children.findIndex(child => child.textContent?.includes("Localizador"));
      const trackingIndex = children.findIndex(child => child.textContent?.includes("Rastrear voo"));
      expect(weatherIndex).toBeGreaterThan(locatorIndex);
      expect(weatherIndex).toBeGreaterThan(trackingIndex);
    }
  });

  it("recolhe os detalhes de um trecho sem ocultar o resumo ou o outro trecho", () => {
    window.localStorage.setItem(WEATHER_DETAILS_STORAGE_KEY, '{"departure":true,"return":true}');
    weatherState.useQuery.mockReturnValue({
      isLoading: false,
      data: {
        available: true,
        destinationLabel: "Navegantes",
        summary: "Parcialmente nublado",
        weatherCode: 2,
        temperatureMinC: 20,
        temperatureMaxC: 24,
        precipitationProbability: 20,
        windSpeedKmh: 18,
        uvIndexMax: 5.6,
        forecastDate: "2026-08-23",
        sunriseTime: null,
        sunsetTime: null,
        hourlyForecast: null,
        alerts: [],
        sourceLabel: "Open-Meteo",
        sourceUrl: "https://open-meteo.com/",
      },
    });
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ocultar detalhes" })[0]!);

    expect(screen.getAllByText("Detalhes da previsão ocultos.")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Ver detalhes" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByText("Navegantes: Parcialmente nublado")).toHaveLength(2);
    expect(screen.getAllByText(/20–24 °C/)).toHaveLength(1);
  });

  it("inicia o detalhe do bilhete em modo compacto quando não há preferência anterior", () => {
    weatherState.useQuery.mockReturnValue({
      isLoading: false,
      data: {
        available: true,
        destinationLabel: "Navegantes",
        summary: "Parcialmente nublado",
        weatherCode: 2,
        temperatureMinC: 20,
        temperatureMaxC: 24,
        precipitationProbability: 20,
        windSpeedKmh: 18,
        uvIndexMax: 5.6,
        forecastDate: "2026-08-23",
        sunriseTime: null,
        sunsetTime: null,
        hourlyForecast: null,
        alerts: [],
        sourceLabel: "Open-Meteo",
        sourceUrl: "https://open-meteo.com/",
      },
    });
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getAllByRole("button", { name: "Ver detalhes" })).toHaveLength(2);
    expect(screen.getAllByText("Detalhes da previsão ocultos.")).toHaveLength(2);
  });

  it("mantém o botão de fechamento acessível enquanto o conteúdo do modal rola", () => {
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog", { name: "Semana 26" });
    const closeButton = screen.getByRole("button", { name: "Fechar calendário" });

    expect(dialog.className).toContain("max-h-[calc(100dvh-1rem)]");
    expect(dialog.className).toContain("flex-col");
    expect(closeButton.className).toContain("size-10");
    expect(closeButton.getAttribute("type")).toBe("button");
    expect(closeButton.getAttribute("aria-label")).toBe("Fechar calendário");
  });

  it("mantém o card de clima visível e explica quando a previsão está indisponível", () => {
    weatherState.useQuery.mockReturnValue({ isLoading: false, data: { available: false } });
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getAllByText("Clima no destino")).toHaveLength(2);
    expect(screen.getAllByText("Não foi possível consultar a previsão agora.")).toHaveLength(2);
    expect(screen.getAllByText("Terminal")).toHaveLength(2);
  });

  it("informa a janela de 16 dias quando a previsão ainda não pode ser disponibilizada", () => {
    weatherState.useQuery.mockReturnValue({
      isLoading: false,
      data: { available: false, reason: "outside_forecast_window" },
    });
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getAllByText("A previsão detalhada é liberada até 16 dias antes do voo.")).toHaveLength(2);
  });
  it("exibe os terminais de ida e volta nos detalhes do bilhete", () => {
    const view = render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(view.getAllByText("Terminal")).toHaveLength(2);
    expect(view.getByText("2")).toBeTruthy();
    expect(view.getByText("1")).toBeTruthy();
  });

  it("mantém apenas o terminal de ida em bilhete somente ida", () => {
    const view = render(<FlightPopup mark={makeMark("oneway")} onClose={() => {}} />);

    expect(view.getAllByText("Terminal")).toHaveLength(1);
    expect(view.getByText("2")).toBeTruthy();
    expect(view.queryByText("Volta")).toBeNull();
  });

  it("exibe a data efetiva de um bilhete somente ida e não a data planejada", () => {
    const mark = makeMark("oneway");
    mark.week.weekNumber = 42;
    mark.week.departureDate = "13/12/2026";
    mark.week.returnDate = "17/12/2026";
    mark.week.departureFlightDatetime = "2026-12-17T19:30";

    const view = render(<FlightPopup mark={mark} onClose={() => {}} />);

    expect(view.getByText("17/12/2026")).toBeTruthy();
    expect(view.queryByText("13/12/2026")).toBeNull();
  });

  it("não exibe zero ao lado da semana quando as flags de status estão desativadas", () => {
    const mark = makeMark();
    mark.week.departureRescheduled = 0;
    mark.week.returnRescheduled = 0;
    mark.week.departureCancelled = 0;
    mark.week.returnCancelled = 0;

    const view = render(<FlightPopup mark={mark} onClose={() => {}} />);
    const header = view.getByText("Semana 26").parentElement;

    expect(view.getByText("Semana 26")).toBeTruthy();
    expect(header?.textContent).not.toContain("0");
    expect(view.queryByText("⚠️ Remarcado")).toBeNull();
    expect(view.queryByText("Cancelado")).toBeNull();
    expect(view.queryByText("Status")).toBeNull();
  });

  it("não exibe zero no trecho adicional com flags numéricas desativadas", () => {
    const mark = makeMark();
    mark.additionalFlights = [
      {
        id: 1,
        weekNumber: 26,
        direction: "departure",
        airline: "azul",
        cancelled: 0,
        rescheduled: 0,
      },
    ];

    const view = render(<FlightPopup mark={mark} onClose={() => {}} />);
    const additionalPanel = view.getByText("Trechos adicionais").parentElement?.parentElement;

    expect(additionalPanel?.textContent).not.toContain("0");
    expect(view.queryByText("Remarcado")).toBeNull();
    expect(view.queryByText("Cancelado")).toBeNull();
  });
});
