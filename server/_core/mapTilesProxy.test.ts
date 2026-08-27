import { describe, expect, it } from "vitest";
import { getCartoTileUrl, isValidCartoTileCoordinate } from "./mapTilesProxy";

describe("mapTilesProxy", () => {
  it("monta tiles Carto com subdomínio determinístico", () => {
    expect(getCartoTileUrl(4, 5, 6)).toBe(
      "https://c.basemaps.cartocdn.com/light_all/4/5/6.png"
    );
  });

  it("aceita apenas coordenadas inteiras dentro dos limites do zoom", () => {
    expect(isValidCartoTileCoordinate("0", 0)).toBe(true);
    expect(isValidCartoTileCoordinate("15", 15)).toBe(true);
    expect(isValidCartoTileCoordinate("16", 15)).toBe(false);
    expect(isValidCartoTileCoordinate("-1", 15)).toBe(false);
    expect(isValidCartoTileCoordinate("4.5", 15)).toBe(false);
    expect(isValidCartoTileCoordinate("1e2", 100)).toBe(false);
  });
});
