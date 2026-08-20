import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("controle global de painéis da Home", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/Home.tsx"),
    "utf8"
  );

  it("sincroniza resumo, filtros, progresso, atenção e preços em uma ação persistente", () => {
    expect(source).toContain("const toggleAllHomePanels = () =>");
    expect(source).toContain("getNextHomeGlobalPanelState");
    expect(source).toContain("setExpandSummary(next.summary)");
    expect(source).toContain("setExpandFilters(next.filters)");
    expect(source).toContain(
      "persistHomePanelPreferences({ summary: next.summary, filters: next.filters })"
    );
    expect(source).toContain("persistHomeExpandablePanels(next.expandablePanels)");
  });

  it("expõe um botão global acessível com rótulo que reflete o próximo estado", () => {
    expect(source).toContain('aria-label={allHomePanelsAreOpen ? "Recolher todos os quadros" : "Expandir todos os quadros"}');
    expect(source).toContain("{allHomePanelsAreOpen ? \"Recolher todos\" : \"Expandir todos\"}");
    expect(source).toContain("inline-flex min-h-10");
    expect(source).toContain("mb-4 flex justify-end sm:mb-6");
  });
});
