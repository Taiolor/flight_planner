/** @vitest-environment jsdom */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
            favorite: false,
            status: "issued",
          },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Planejamento por semanas" })).toBeTruthy();
    expect(screen.getByText("Emitido")).toBeTruthy();
    expect(
      screen.getByLabelText("Abrir semana 18 no Calendário").getAttribute("href")
    ).toBe("/calendar?week=18");
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

  it("encaminha a semana pela URL e permite alternar seu favorito", () => {
    const onToggleFavorite = vi.fn();
    const { container } = render(
      <WeeklyPlanning
        year={2026}
        hideValues={false}
        onToggleFavorite={onToggleFavorite}
        items={[{ weekNumber: 18, departureDate: "02/05/2026", returnDate: "06/05/2026", route: "GRU → NVT", airline: "LATAM", lowestPrice: 850, favorite: true, status: "issued" }]}
      />
    );
    const current = within(container);

    expect(current.getByLabelText("Abrir semana 18 no Calendário").getAttribute("href")).toBe("/calendar?week=18");
    current.getByRole("button", { name: "Remover semana 18 dos favoritos" }).click();
    expect(onToggleFavorite).toHaveBeenCalledWith(18);
    expect(current.getByLabelText("Prévia de maio")).toBeTruthy();
  });
});
