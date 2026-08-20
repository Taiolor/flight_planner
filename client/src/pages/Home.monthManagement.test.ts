import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("frame Gestão de Passagens da Home", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("agrupa a lista mensal em um frame com controle global acessível", () => {
    expect(source).toContain("PassageManagementFrame");
    expect(source).toContain("toggleAllMonths");
    expect(source).toContain("allMonthsExpanded={allMonthsExpanded}");
  });

  it("mantém uma composição responsiva para cabeçalho, resumo e ação global", () => {
    expect(source).toContain("PassageManagementFrame");
    expect(source).toContain("mb-8");
  });
});
