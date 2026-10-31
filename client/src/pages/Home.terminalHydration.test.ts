import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hidratação de terminal na Gestão de Passagens", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("preserva os terminais retornados pela API no modelo da semana", () => {
    expect(source).toContain("departureTerminal: (w as any).departureTerminal ?? null");
    expect(source).toContain("returnTerminal: (w as any).returnTerminal ?? null");
  });

  it("reidrata os campos de terminal após a invalidação da semana salva", () => {
    expect(source).toContain("setTempDepartureTerminal(prev =>");
    expect(source).toContain("const saved = (w as any).departureTerminal ?? \"\"");
    expect(source).toContain("setTempReturnTerminal(prev =>");
    expect(source).toContain("const saved = (w as any).returnTerminal ?? \"\"");
  });
});
