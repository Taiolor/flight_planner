import { describe, expect, it } from "vitest";
import { getFlightDistanceKm } from "./flightDistance";

describe("getFlightDistanceKm", () => {
  it("calcula uma distância geodésica plausível entre GRU e NVT", () => {
    const distance = getFlightDistanceKm("GRU", "NVT");

    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(400);
    expect(distance!).toBeLessThan(500);
  });

  it("trata os códigos de aeroporto sem sensibilidade a maiúsculas", () => {
    expect(getFlightDistanceKm("cgh", "nvt")).toBe(getFlightDistanceKm("CGH", "NVT"));
  });

  it("não inventa uma distância para aeroportos sem coordenadas", () => {
    expect(getFlightDistanceKm("GRU", "XXX")).toBeNull();
  });
});
