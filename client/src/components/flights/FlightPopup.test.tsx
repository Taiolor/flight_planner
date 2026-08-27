// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FlightPopup from "./FlightPopup";
import type { DayMark } from "./types";

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
  weatherState.useQuery.mockReset();
  weatherState.useQuery.mockReturnValue({ isLoading: false, data: { available: false } });
});

describe("FlightPopup", () => {
  it("mostra a previsão do destino com fonte na área expandida", () => {
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
      .mockReturnValueOnce({ isLoading: false, data: { available: false } });

    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getAllByText("Clima no destino")).toHaveLength(2);
    expect(screen.getByText("Navegantes: Parcialmente nublado")).toBeTruthy();
    expect(screen.getByText("20–24 °C · chuva 20% · vento 18 km/h · UV 5.6")).toBeTruthy();
    expect(screen.getByText(/Próximo do voo \(14:00\): Chuva moderada/)).toBeTruthy();
    expect(screen.getByText(/vento 23 km\/h NE · rajadas 34 km\/h/)).toBeTruthy();
    expect(screen.getByText("Nascer do sol 06:48")).toBeTruthy();
    expect(screen.getByText("Pôr do sol 17:48")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Ocultar alertas" })).toHaveLength(2);
    expect(screen.getByText("Atenção: chuva relevante prevista no horário do voo.")).toBeTruthy();
    expect(screen.getByText(/Fonte: Open-Meteo/).getAttribute("href")).toBe("https://open-meteo.com/");
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
