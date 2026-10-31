import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("quadro de variação de preços da Home", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/Home.tsx"),
    "utf8"
  );

  it("usa uma preferência persistente e controles acessíveis para recolher o quadro", () => {
    expect(source).toContain('updateExpandablePanel("priceVariation")');
    expect(source).toContain('aria-controls="price-variation-content"');
    expect(source).toContain("aria-expanded={expandablePanels.priceVariation}");
    expect(source).toContain("{expandablePanels.priceVariation && (");
  });

  it("mantém o cabeçalho e o conteúdo seguros em telas estreitas", () => {
    expect(source).toContain("bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e]");
    expect(source).toContain("Camada financeira");
    expect(source).toContain('aria-label={expandablePanels.priceVariation ? "Recolher Variação de Preços"');
    expect(source).toContain("motion-reduce:transition-none");
    expect(source).toContain("max-w-full overflow-hidden");
  });

  it("mantém controles e gráficos legíveis sobre a superfície azul", () => {
    expect(source).toContain("border-white/30 bg-white/10 text-sky-50");
    expect(source).toContain('theme="dark"');
    expect(source).toContain("border border-white/15 bg-white/5");
  });
});
