import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("rota dedicada de Gestão de Passagens", () => {
  it("reutiliza o contexto anual em modo dedicado", () => {
    const source = readFileSync(
      "client/src/pages/PassageManagementPage.tsx",
      "utf8"
    );
    expect(source).toContain('<Home mode="passage-management" />');
  });
});
