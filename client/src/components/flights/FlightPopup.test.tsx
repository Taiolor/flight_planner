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
          temperatureMinC: 20,
          temperatureMaxC: 24,
          precipitationProbability: 20,
          windSpeedKmh: 18,
          forecastDate: "2026-08-23",
          sourceLabel: "Open-Meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      })
      .mockReturnValueOnce({ isLoading: false, data: { available: false } });

    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.getByText("Clima no destino")).toBeTruthy();
    expect(screen.getByText("Navegantes: Parcialmente nublado")).toBeTruthy();
    expect(screen.getByText("20–24 °C · chuva 20% · vento 18 km/h")).toBeTruthy();
    expect(screen.getByText(/Fonte: Open-Meteo/).getAttribute("href")).toBe("https://open-meteo.com/");
  });

  it("mantém os detalhes do voo legíveis quando a previsão está indisponível", () => {
    weatherState.useQuery.mockReturnValue({ isLoading: false, data: { available: false } });
    render(<FlightPopup mark={makeMark()} onClose={() => {}} />);

    expect(screen.queryByText("Clima no destino")).toBeNull();
    expect(screen.getAllByText("Terminal")).toHaveLength(2);
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
