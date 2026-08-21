// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import FlightPopup from "./FlightPopup";
import type { DayMark } from "./types";

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

describe("FlightPopup", () => {
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
});
