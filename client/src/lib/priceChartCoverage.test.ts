import { describe, expect, it } from "vitest";
import { getPriceChartCoverage } from "./priceChartCoverage";

describe("getPriceChartCoverage", () => {
  it("resume apenas empresas, meses e referências que possuem valores reais", () => {
    const coverage = getPriceChartCoverage(
      [
        { mes: "Jan", latam: 550, azul: 610 },
        { mes: "Fev", latam: 570 },
        { mes: "Mar" },
      ],
      new Set(["latam", "azul", "gol"])
    );

    expect(coverage).toEqual({
      selectedAirlines: 3,
      populatedMonths: 2,
      monthlyReferences: 3,
    });
  });
});
