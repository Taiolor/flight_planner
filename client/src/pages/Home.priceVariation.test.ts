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
    expect(source).toContain("flex w-full items-start justify-between gap-3");
    expect(source).toContain("sm:items-center sm:gap-4");
    expect(source).toContain('<span className="hidden sm:inline">');
    expect(source).toContain("max-w-full overflow-hidden");
  });
});
