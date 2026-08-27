import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home mobile responsiveness", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/Home.tsx"),
    "utf8"
  );

  it("keeps the filters in one column until a comfortable mobile width", () => {
    expect(source).toContain("grid-cols-1 min-[480px]:grid-cols-2");
    expect(source).toContain("[&>div]:min-w-0");
  });

  it("converte os filtros da Gestão em painel inferior com fechamento explícito no mobile", () => {
    expect(source).toContain("fixed inset-0 z-40 bg-slate-950/55 sm:hidden");
    expect(source).toContain("max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0");
    expect(source).toContain("max-sm:max-h-[86dvh] max-sm:overflow-y-auto");
    expect(source).toContain("Filtros de passagens");
    expect(source).toContain('aria-label="Fechar filtros"');
  });

  it("informa filtros ativos no gatilho sem confundir ordenação com critério", () => {
    expect(source).toContain('getActiveManagementFilterCount');
    expect(source).toContain("activeManagementFilterCount > 0");
    expect(source).toContain('aria-label={`${activeManagementFilterCount}');
  });

  it("oferece uma recuperação acessível quando a consulta de semanas falha", () => {
    expect(source).toContain("weeksQuery.isError");
    expect(source).toContain('role="alert"');
    expect(source).toContain("Tentar novamente");
    expect(source).toContain("weeksQuery.refetch()");
  });

  it("informa a última sincronização offline e separa a recuperação sem dados locais", () => {
    expect(source).toContain('import { HomeOfflineRecovery } from "@/components/HomeOfflineRecovery"');
    expect(source).toContain("readPlanningSyncTimestamp(selectedYear)");
    expect(source).toContain("savePlanningSyncTimestamp(selectedYear, now.getTime())");
    expect(source).toContain("data-offline-status=\"true\"");
    expect(source).toContain("shouldShowOfflineRecovery");
    expect(source).toContain("<HomeOfflineRecovery");
    expect(source).toContain("readOfflineNextTrips(selectedYear)");
    expect(source).toContain("saveOfflineNextTrips(selectedYear, nextDecisionTrips)");
  });

  it("posiciona a Central de decisão após o Resumo Anual e preserva CTAs contextuais", () => {
    expect(source).toContain('import { DecisionCenter } from "@/components/DecisionCenter"');
    expect(source).toContain("buildDecisionItemQueue(");
    expect(source).toContain("getNextDecisionTrip(weeksData)");
    expect(source).toContain("secondaryItems={secondaryDecisionItems}");
    expect(source).toContain("readDecisionCenterPreferences(selectedYear)");
    expect(source).toContain("isExpanded={decisionCenterPreferences.isExpanded}");
    expect(source).toContain("onToggleExpanded={() =>");
    expect(source).toContain("/gestao-passagens?week=${weekNumber}");
    expect(source).toContain("/calendar?week=${weekNumber}");
    expect(source.indexOf("<DecisionCenter")).toBeLessThan(source.indexOf("<WeeklyPlanning"));
  });

  it("allows graph actions and empty-state buttons to wrap on small screens", () => {
    expect(source).toContain("flex flex-col gap-2 sm:flex-row");
    expect(source).toContain("max-w-full whitespace-normal");
  });

  it("usa azul-marinho e textos neutros no Resumo Anual", () => {
    expect(source).toContain("via-[#071a36]");
    expect(source).toContain("bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e]");
    expect(source).toContain('import { MetricCard } from "@/components/MetricCard"');
    expect(source).toContain('variant="transparent" title="Bilhetes Emitidos"');
    expect(source).not.toContain("border border-blue-300 border-dashed text-blue-100");
  });
});
