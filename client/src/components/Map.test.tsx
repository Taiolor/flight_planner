// @vitest-environment jsdom
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapView } from "./Map";

const originalGoogle = window.google;

afterEach(() => {
  Object.defineProperty(window, "google", {
    configurable: true,
    value: originalGoogle,
  });
});

describe("MapView", () => {
  it("inicializa a interface Google Maps quando a API já está disponível", async () => {
    const map = {} as google.maps.Map;
    const MapConstructor = vi.fn(function GoogleMapConstructor() {
      return map;
    });
    const onMapReady = vi.fn();

    Object.defineProperty(window, "google", {
      configurable: true,
      value: { maps: { Map: MapConstructor } },
    });

    render(
      <MapView
        initialCenter={{ lat: -14.235, lng: -51.9253 }}
        initialZoom={4}
        onMapReady={onMapReady}
      />
    );

    await waitFor(() => {
      expect(MapConstructor).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          center: { lat: -14.235, lng: -51.9253 },
          zoom: 4,
        })
      );
      expect(onMapReady).toHaveBeenCalledWith(map);
    });
  });
});
