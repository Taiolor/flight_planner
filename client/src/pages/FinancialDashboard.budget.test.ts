import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("envelope de orçamento financeiro", () => {
  it("busca e persiste envelopes por exercício antes de renderizar o comparativo", () => {
    const source = readSource("client/src/pages/FinancialDashboard.tsx");

    expect(source).toContain("financial.getMonthlyBudgets.useQuery");
    expect(source).toContain("financial.upsertMonthlyBudget.useMutation");
    expect(source).toContain("financial.copyMonthlyBudgets.useMutation");
    expect(source).toContain("buildMonthlyBudgetEnvelopes");
    expect(source).toContain('kind="monthlyBudget"');
  });

  it("mantém a edição de orçamento protegida enquanto os valores estão ocultos", () => {
    const source = readSource("client/src/pages/FinancialDashboard.tsx");

    expect(source).toContain("{showValues ? (");
    expect(source).toContain("Exiba os valores para configurar este orçamento.");
    expect(source).toContain("Copiar envelopes para");
    expect(source).toContain("Confirmar cópia");
  });

  it("destaca envelopes a partir do limiar de atenção de 90%", () => {
    const source = readSource("client/src/pages/FinancialDashboard.tsx");

    expect(source).toContain("getBudgetAlerts");
    expect(source).toContain('role="alert"');
    expect(source).toContain("envelope(s) em atenção");
  });

  it("oferece as três séries mensais no gráfico de envelope", () => {
    const chartSource = readSource("client/src/components/FinancialCharts.tsx");

    expect(chartSource).toContain('kind === "monthlyBudget"');
    expect(chartSource).toContain('dataKey="budget"');
    expect(chartSource).toContain('dataKey="realizado"');
    expect(chartSource).toContain('dataKey="projetado"');
  });
});
