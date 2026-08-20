/** @vitest-environment jsdom */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeeklyPlanning } from "./WeeklyPlanning";

describe("WeeklyPlanning", () => {
  it("mostra cards semanais com status e ligação ao Calendário", () => {
    render(
      <WeeklyPlanning
        year={2026}
        hideValues={false}
        items={[
          {
            weekNumber: 18,
            departureDate: "02/05/2026",
            returnDate: "06/05/2026",
            route: "GRU → NVT",
            airline: "LATAM",
            lowestPrice: 850,
            status: "issued",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Planejamento por semanas" })).toBeTruthy();
    expect(screen.getByText("Emitido")).toBeTruthy();
    expect(
      screen.getByLabelText("Abrir semana 18 no Calendário").getAttribute("href")
    ).toBe("/calendar");
    expect(screen.getByText("R$ 850,00")).toBeTruthy();
  });

  it("direciona ao Calendário quando não há semanas selecionadas", () => {
    const { container } = render(
      <WeeklyPlanning year={2026} hideValues={false} items={[]} />
    );
    const getCurrentByText = within(container).getByText;

    expect(getCurrentByText("Nenhuma semana em acompanhamento")).toBeTruthy();
    expect(getCurrentByText("Ver calendário completo").getAttribute("href")).toBe(
      "/calendar"
    );
  });
});
