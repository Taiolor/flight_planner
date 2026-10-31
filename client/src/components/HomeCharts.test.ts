import { describe, expect, it } from "vitest";
import { shouldRenderDeferredCharts } from "@/lib/chartLoading";

describe("gráficos sob demanda da Home", () => {
  it("só renderiza o gráfico quando existem dados e o usuário o solicita", () => {
    expect(shouldRenderDeferredCharts(false, false)).toBe(false);
    expect(shouldRenderDeferredCharts(true, false)).toBe(false);
    expect(shouldRenderDeferredCharts(false, true)).toBe(false);
    expect(shouldRenderDeferredCharts(true, true)).toBe(true);
  });
});
