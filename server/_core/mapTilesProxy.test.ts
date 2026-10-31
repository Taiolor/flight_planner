import { describe, expect, it } from "vitest";
import { getOpenStreetMapTileUrl, isValidMapTileCoordinate } from "./mapTilesProxy";

describe("mapTilesProxy", () => {
  it("monta tiles públicos do OpenStreetMap sem API key", () => {
    expect(getOpenStreetMapTileUrl(4, 5, 6)).toBe(
      "https://tile.openstreetmap.org/4/5/6.png"
    );
  });

  it("aceita apenas coordenadas inteiras dentro dos limites do zoom", () => {
    expect(isValidMapTileCoordinate("0", 0)).toBe(true);
    expect(isValidMapTileCoordinate("15", 15)).toBe(true);
    expect(isValidMapTileCoordinate("16", 15)).toBe(false);
    expect(isValidMapTileCoordinate("-1", 15)).toBe(false);
    expect(isValidMapTileCoordinate("4.5", 15)).toBe(false);
    expect(isValidMapTileCoordinate("1e2", 100)).toBe(false);
  });
});
