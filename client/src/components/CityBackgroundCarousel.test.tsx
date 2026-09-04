// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CITY_BACKDROPS,
  CityBackgroundCarousel,
  CAROUSEL_PANEL_COLLAPSED_STORAGE_KEY,
  FAVORITE_BACKDROP_STORAGE_KEY,
} from "./CityBackgroundCarousel";

describe("CityBackgroundCarousel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it("usa os ativos fotográficos publicados e preserva os créditos", () => {
    expect(CITY_BACKDROPS).toHaveLength(11);
    expect(CITY_BACKDROPS.every(backdrop => backdrop.src.startsWith("/smartfly-assets/"))).toBe(true);
    expect(CITY_BACKDROPS.every(backdrop => backdrop.creditUrl.startsWith("https://commons.wikimedia.org/"))).toBe(true);
    expect(CITY_BACKDROPS.map(backdrop => backdrop.city)).toEqual(
      expect.arrayContaining(["Guarulhos", "Piracicaba", "Novo Hamburgo"])
    );
  });

  it("permite navegar e pausar o carrossel por controles acessíveis", () => {
    render(<CityBackgroundCarousel />);

    expect(screen.getByText("Blumenau")).toBeTruthy();
    const nextButton = screen.getByRole("button", { name: "Ver próxima cidade" });
    expect(nextButton.getAttribute("title")).toBeNull();
    expect(screen.getByRole("button", { name: "Ver cidade anterior" }).getAttribute("title")).toBeNull();
    fireEvent.click(nextButton);
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

  it("permite favoritar uma foto e restaurá-la no próximo carregamento", () => {
    const { unmount } = render(<CityBackgroundCarousel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Favoritar foto de Blumenau" })
    );
    expect(window.localStorage.getItem(FAVORITE_BACKDROP_STORAGE_KEY)).toBe(
      "blumenau"
    );
    expect(screen.getByText("Favorita: Blumenau")).toBeTruthy();

    unmount();
    render(<CityBackgroundCarousel />);
    expect(screen.getByText("Blumenau")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Remover Blumenau das favoritas" })
    ).toBeTruthy();
  });

  it("mantém a gestão de fotos no canto inferior sem cobrir a rota anual", () => {
    const { container } = render(<CityBackgroundCarousel />);

    const controls = container.querySelector(
      'aside[aria-label="Controle do carrossel de cidades"]'
    );
    expect(controls).toBeTruthy();
    const className = controls?.className ?? "";
    expect(className).toContain("fixed");
    expect(className).toContain("bottom-20");
    expect(className).not.toContain("top-20");
  });

  it("recolhe o painel para a lateral direita e restaura a escolha no navegador", () => {
    const { container } = render(<CityBackgroundCarousel />);
    const controls = container.querySelector(
      'aside[aria-label="Controle do carrossel de cidades"]'
    );
    const collapseButton = container.querySelector(
      'button[aria-label="Recolher seletor de fotos para a lateral direita"]'
    );

    expect(controls?.className).toContain("bottom-20");
    expect(collapseButton).toBeTruthy();
    fireEvent.click(collapseButton!);

    expect(controls?.className).toContain("w-11");
    expect(
      window.localStorage.getItem(CAROUSEL_PANEL_COLLAPSED_STORAGE_KEY)
    ).toBe("true");
    expect(
      container.querySelector(
        'button[aria-label="Expandir seletor de fotos para a esquerda"]'
      )
    ).toBeTruthy();
  });
});
