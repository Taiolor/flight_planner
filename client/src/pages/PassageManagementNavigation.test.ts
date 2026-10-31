import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("navegação de Gestão de Passagens", () => {
  const appSource = readFileSync("client/src/App.tsx", "utf8");
  const headerSource = readFileSync(
    "client/src/components/HomeHeaderActions.tsx",
    "utf8"
  );
  const homeSource = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("registra a rota dedicada e mantém a Home como visão resumida", () => {
    expect(appSource).toContain('path={"/gestao-passagens"}');
    expect(appSource).toContain("<PassageManagementPage />");
    expect(homeSource).toContain('mode = "home"');
    expect(homeSource).toContain("isManagementView &&");
    expect(homeSource).toContain("!isManagementView &&");
  });

  it("expõe o acesso direto à gestão no cabeçalho e na navegação secundária", () => {
    expect(headerSource).toContain('href="/gestao-passagens"');
    expect(headerSource).toContain("Gestão de Passagens");
    expect(headerSource).toContain("Abrir Gestão de Passagens");
  });
});
