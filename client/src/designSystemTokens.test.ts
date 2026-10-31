import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("tokens do design system", () => {
  const source = readFileSync("client/src/index.css", "utf8");

  it("define superfícies navy, texto de contraste e status cancelado reutilizáveis", () => {
    expect(source).toContain("--surface-app: #020617;");
    expect(source).toContain("--surface-navy: #071a36;");
    expect(source).toContain("--surface-navy-raised: #102f61;");
    expect(source).toContain("--border-navy: #315c99;");
    expect(source).toContain("--text-on-navy: #ffffff;");
    expect(source).toContain("--status-cancelled: #4b0082;");
  });
});
