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
});
