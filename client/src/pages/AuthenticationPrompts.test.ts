import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readPage = (fileName: string) =>
  readFileSync(resolve(process.cwd(), "client/src/pages", fileName), "utf8");

describe("avisos de autenticação", () => {
  it("usa a message box compartilhada nos estados de página protegida", () => {
    for (const page of [
      "Memories.tsx",
      "AdminNotifications.tsx",
      "UsageTelemetryMap.tsx",
      "GeminiBudgetDashboard.tsx",
    ]) {
      expect(readPage(page)).toContain("LoginRequiredScreen");
    }
  });

  it("substitui o banner de Cotações pela message box centralizada", () => {
    const quotesSource = readPage("FlightQuotes.tsx");
    expect(quotesSource).toContain("LoginRequiredMessageBox");
    expect(quotesSource).toContain("showLoginRequiredMessage");
    expect(quotesSource).not.toContain(
      "Faça login para buscar preços pela API e salvar suas cotações."
    );
  });
});
