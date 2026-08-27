import { describe, expect, it } from "vitest";
import { AIRLINE_LOGO_ASSETS, getAirlineLogoAsset } from "./airlineAssets";

describe("airlineAssets", () => {
  it("usa ativos tipados e estáveis do projeto para as companhias suportadas", () => {
    expect(AIRLINE_LOGO_ASSETS.latam).toMatch(/^\/manus-storage\/smartfly-airline-latam_.*\.png\?v=20260827$/);
    expect(AIRLINE_LOGO_ASSETS.gol).toMatch(/^\/manus-storage\/smartfly-airline-gol_.*\.png\?v=20260827$/);
    expect(AIRLINE_LOGO_ASSETS.azul).toMatch(/^\/manus-storage\/smartfly-airline-azul_.*\.png\?v=20260827$/);
    expect(Object.values(AIRLINE_LOGO_ASSETS).every(asset => asset.startsWith("/"))).toBe(true);
    expect(Object.values(AIRLINE_LOGO_ASSETS).every(asset => !asset.includes("://"))).toBe(true);
  });

  it("normaliza a companhia e preserva fallback sem imagem para valores desconhecidos", () => {
    expect(getAirlineLogoAsset(" LATAM ")).toBe(AIRLINE_LOGO_ASSETS.latam);
    expect(getAirlineLogoAsset("companhia desconhecida")).toBeUndefined();
  });
});
