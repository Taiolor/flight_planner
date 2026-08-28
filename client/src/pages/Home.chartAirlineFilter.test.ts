import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("filtro de empresas do gráfico", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");
  const filterSource = source.slice(
    source.indexOf("{/* Filtro de empresas do gráfico */}"),
    source.indexOf("{!hasChartData ?")
  );

  it("usa uma sinalização azul uniforme para os itens selecionados", () => {
    expect(filterSource).toContain('border-sky-200/50 bg-sky-300/20 text-white shadow-sm');
    expect(filterSource).toContain('focus-visible:ring-[#315c99]');
    expect(filterSource).not.toContain('kayak: "bg-red-500"');
    expect(filterSource).not.toContain("backgroundColor:");
  });
});
