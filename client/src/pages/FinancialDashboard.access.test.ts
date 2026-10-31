import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("proteção de acesso do Financeiro", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/FinancialDashboard.tsx"),
    "utf8"
  );

  it("usa a message box centralizada antes de montar o conteúdo financeiro", () => {
    expect(source).toContain("LoginRequiredScreen");
    expect(source).toContain("Financeiro protegido");
    expect(source).toContain('resource="financial"');
    expect(source).toContain("return <FinancialDashboardContent />");
  });

  it("substitui o conteúdo financeiro pelo skeleton completo durante o carregamento", () => {
    expect(source).toContain("FinancialDashboardLoadingSkeleton");
    expect(source).toContain("{isLoading ? (");
    expect(source).toContain("<FinancialDashboardLoadingSkeleton />");
  });

  it("alinha o cabeçalho do módulo à paleta azul-marinho global", () => {
    expect(source).toContain("from-[#071a36] via-[#102f61] to-[#17427e]");
  });

  it("centraliza o Total investido em superfície azul-marinho com texto branco legível", () => {
    expect(source).toContain('import { MetricCard } from "@/components/MetricCard"');
    expect(source).toContain("return <MetricCard title={title}");
    expect(source).toContain('accent="blue"');
  });

  it("mantém cards secundários em azul-marinho com acentos semânticos legíveis", () => {
    expect(source).toContain('accent="green"');
    expect(source).toContain('accent="orange"');
    expect(source).toContain('accent="purple"');
    expect(source).toContain('green: "green"');
  });

  it("alimenta os KPIs com comparação do último mês real contra o anterior", () => {
    expect(source).toContain("getLatestMonthlyKpiComparisons");
    expect(source).toContain("toMonthlyKpiTrend(monthlyKpiComparisons.cash)");
    expect(source).toContain("toMonthlyKpiTrend(monthlyKpiComparisons.averageCash)");
    expect(source).toContain("toMonthlyKpiTrend(monthlyKpiComparisons.smiles)");
    expect(source).toContain("toMonthlyKpiTrend(monthlyKpiComparisons.latamPass)");
  });
});
