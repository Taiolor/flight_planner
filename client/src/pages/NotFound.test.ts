import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("NotFound", () => {
  const source = readFileSync("client/src/pages/NotFound.tsx", "utf8");

  it("localiza a mensagem e adota a superfície azul-marinho do Smart Fly", () => {
    expect(source).toContain("Página não encontrada");
    expect(source).toContain("Voltar ao início");
    expect(source).toContain("#071a36");
    expect(source).not.toContain("Page Not Found");
  });
});
