import { describe, expect, it } from "vitest";
import { formatAirlineDisplayName } from "./airlinePresentation";

describe("formatAirlineDisplayName", () => {
  it("normaliza nomes de companhia para caixa alta sem alterar o valor persistido", () => {
    expect(formatAirlineDisplayName("Latam Airlines")).toBe("LATAM AIRLINES");
    expect(formatAirlineDisplayName("gol")).toBe("GOL");
    expect(formatAirlineDisplayName(" OnHappy ")).toBe("ONHAPPY");
  });

  it("mantém um fallback legível quando a companhia não foi informada", () => {
    expect(formatAirlineDisplayName(null)).toBe("—");
    expect(formatAirlineDisplayName("", "COMPANHIA A CONFIRMAR")).toBe(
      "COMPANHIA A CONFIRMAR"
    );
  });
});
