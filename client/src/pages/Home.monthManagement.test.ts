import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("frame Gestão de Passagens da Home", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("agrupa a lista mensal em um frame com controle global acessível", () => {
    expect(source).toContain("PassageManagementFrame");
    expect(source).toContain("toggleAllMonths");
    expect(source).toContain("allMonthsExpanded={allMonthsExpanded}");
    expect(source).toContain("isManagementView &&");
    expect(source).toContain("Gestão de Passagens");
  });

  it("mantém uma composição responsiva para cabeçalho, resumo e ação global", () => {
    expect(source).toContain("PassageManagementFrame");
    expect(source).toContain("mb-8");
  });

  it("anima a expansão mensal sem expor conteúdo recolhido ao teclado", () => {
    expect(source).toContain("transition-[grid-template-rows,opacity]");
    expect(source).toContain("grid-rows-[1fr] opacity-100");
    expect(source).toContain("grid-rows-[0fr] opacity-0 pointer-events-none");
    expect(source).toContain("inert={!isOpen}");
    expect(source).toContain("motion-reduce:transition-none");
  });

  it("faz os cards semanais entrarem em sequência ao abrir o mês", () => {
    expect(source).toContain("monthWeeks.map((week, weekIndex)");
    expect(source).toContain("slide-in-from-bottom-2");
    expect(source).toContain("Math.min(weekIndex, 7) * 45");
    expect(source).toContain('animationFillMode: "both"');
    expect(source).toContain("motion-reduce:animate-none");
  });

  it("mantém os terminais do resumo semanal desativados de forma reversível", () => {
    expect(source).toContain("const SHOW_TERMINALS_IN_WEEK_SUMMARY = false;");
    expect(source).toContain("SHOW_TERMINALS_IN_WEEK_SUMMARY &&");
    expect(source).toContain("Terminal ida:");
    expect(source).toContain("Terminal volta:");
  });
});
