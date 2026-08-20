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

  it("integra o componente de organização com o estado atual dos painéis", () => {
    expect(source).toContain("useHomePanelToggleShortcut(toggleAllHomePanels)");
    expect(source).toContain("<HomeDashboardControls");
    expect(source).toContain("allPanelsOpen={allHomePanelsAreOpen}");
    expect(source).toContain("onTogglePriority={togglePriorityPanel}");
  });
});
