// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenStreetMap } from "./OpenStreetMap";

const OPENSTREETMAP_TILE_URL = "/map-tiles/{z}/{x}/{y}.png";

const mapMock = vi.hoisted(() => ({
  fitBounds: vi.fn(),
  setView: vi.fn(),
  latLngBounds: vi.fn(() => ({ isValid: () => true })),
  flyTo: vi.fn(),
  getZoom: vi.fn(() => 7),
}));

vi.mock("leaflet", () => ({
  latLngBounds: mapMock.latLngBounds,
}));

vi.mock("react-leaflet", async () => {
  const ReactModule = await import("react");
  return {
    MapContainer: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement("div", { "data-testid": "osm-map" }, children),
    TileLayer: ({ url }: { url: string }) =>
      ReactModule.createElement("div", { "data-testid": "osm-tiles", "data-url": url }),
    CircleMarker: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement("div", { "data-testid": "osm-marker" }, children),
    Tooltip: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement("span", null, children),
    useMap: () => ({
    fitBounds: mapMock.fitBounds,
    setView: mapMock.setView,
    flyTo: mapMock.flyTo,
    getZoom: mapMock.getZoom,
  }),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OpenStreetMap", () => {
  it("renderiza os pontos e ajusta o enquadramento para múltiplas localizações", async () => {
    render(
      <OpenStreetMap
        initialCenter={{ lat: -14.235, lng: -51.9253 }}
        initialZoom={4}
        points={[
          { id: 1, position: { lat: -23.55, lng: -46.63 }, color: "#2563eb", label: "São Paulo" },
          { id: 2, position: { lat: -22.9, lng: -43.17 }, color: "#7c3aed", label: "Rio de Janeiro" },
        ]}
      />
    );

    expect(screen.getByTestId("osm-map")).toBeTruthy();
    expect(screen.getByTestId("osm-tiles").getAttribute("data-url")).toBe(
      OPENSTREETMAP_TILE_URL
    );
    expect(screen.getAllByTestId("osm-marker")).toHaveLength(2);

    await waitFor(() => {
      expect(mapMock.fitBounds).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ maxZoom: 7, padding: [48, 48] })
      );
    });
  });

  it("centraliza na localização atual quando o usuário concede permissão", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: -26.3044, longitude: -48.8487 },
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });

    render(
      <OpenStreetMap
        initialCenter={{ lat: -14.235, lng: -51.9253 }}
        initialZoom={4}
        points={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Centralizar na minha localização atual" }));

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ enableHighAccuracy: false, timeout: 10_000 })
      );
      expect(mapMock.flyTo).toHaveBeenCalledWith(
        [-26.3044, -48.8487],
        13,
        expect.objectContaining({ animate: true, duration: 0.6 })
      );
      expect(screen.getByText("Sua localização atual")).toBeTruthy();
      expect(screen.getByRole("status").textContent).toContain("Mapa centralizado");
    });
  });

  it("informa quando a geolocalização é negada", async () => {
    const getCurrentPosition = vi.fn((_: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: "Permission denied" } as GeolocationPositionError);
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(
      <OpenStreetMap
        initialCenter={{ lat: -14.235, lng: -51.9253 }}
        initialZoom={4}
        points={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Centralizar na minha localização atual" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Não foi possível acessar sua localização");
    });
  });

  it("centraliza em um único ponto com zoom legível", async () => {
    const point = { id: 1, position: { lat: -15.78, lng: -47.93 }, label: "Brasília" };
    render(
      <OpenStreetMap
        initialCenter={{ lat: -14.235, lng: -51.9253 }}
        initialZoom={4}
        points={[point]}
      />
    );

    await waitFor(() => {
      expect(mapMock.setView).toHaveBeenCalledWith(point.position, 7);
    });
  });
});
