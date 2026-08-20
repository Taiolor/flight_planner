import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desativação reversível de Layout dos quadros", () => {
  const source = readFileSync("client/src/pages/Home.tsx", "utf8");

  it("oculta os controles da Home por uma flag explícita sem remover a implementação", () => {
    expect(source).toContain("const LAYOUT_CONTROLS_ENABLED = false");
    expect(source).toContain("LAYOUT_CONTROLS_ENABLED && (");
    expect(source).toContain("<HomeDashboardControls");
    expect(source).toContain("useHomePanelToggleShortcut(toggleAllHomePanels, LAYOUT_CONTROLS_ENABLED)");
  });
});
