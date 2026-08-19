// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CITY_BACKDROPS,
  CityBackgroundCarousel,
} from "./CityBackgroundCarousel";

describe("CityBackgroundCarousel", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it("usa os ativos fotográficos publicados e preserva os créditos", () => {
    expect(CITY_BACKDROPS).toHaveLength(8);
    expect(CITY_BACKDROPS.every(backdrop => backdrop.src.startsWith("/manus-storage/"))).toBe(true);
    expect(CITY_BACKDROPS.every(backdrop => backdrop.creditUrl.startsWith("https://commons.wikimedia.org/"))).toBe(true);
  });

  it("permite navegar e pausar o carrossel por controles acessíveis", () => {
    render(<CityBackgroundCarousel />);

    expect(screen.getByText("Blumenau")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver próxima cidade" }));
    expect(screen.getByText("São Paulo")).toBeTruthy();

    const pauseButton = screen.getByRole("button", {
      name: "Pausar carrossel de cidades",
    });
    fireEvent.click(pauseButton);
    expect(
      screen.getByRole("button", { name: "Reproduzir carrossel de cidades" })
    ).toBeTruthy();
    expect(screen.getByText("Retomar")).toBeTruthy();
    expect(screen.getByText("Carrossel pausado")).toBeTruthy();
  });
});
