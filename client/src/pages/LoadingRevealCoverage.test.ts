import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("cobertura de revelação após carregamento", () => {
  it("aplica fade aos principais conteúdos que sucedem loading", () => {
    const files = [
      "client/src/pages/FinancialDashboard.tsx",
      "client/src/pages/FlightQuotes.tsx",
      "client/src/pages/GeminiBudgetDashboard.tsx",
      "client/src/pages/UsageTelemetryMap.tsx",
    ];

    for (const file of files) {
      expect(readSource(file)).toContain("ContentReveal");
    }
  });

  it("mantém reveal acessível na Home e em Memórias", () => {
    const home = readSource("client/src/pages/Home.tsx");
    const memories = readSource("client/src/pages/Memories.tsx");

    expect(home).toContain("motion-reduce:animate-none");
    expect(memories).toContain("motion-reduce:animate-none");
  });
});
