import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = (name: string) =>
  readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

describe("tooltips das telas administrativas", () => {
  it.each([
    ["AdminNotifications.tsx", "Limpar pesquisa do histórico"],
    ["FinancialDashboard.tsx", "valores financeiros"],
    ["OperationalControl.tsx", "Remover ${item.label}"],
  ])("mantém TooltipLabel em %s para %s", (fileName, expectedLabel) => {
    const source = pageSource(fileName);
    expect(source).toContain("@/components/ui/tooltip-label");
    expect(source).toContain("<TooltipLabel");
    expect(source).toContain(expectedLabel);
  });
});
