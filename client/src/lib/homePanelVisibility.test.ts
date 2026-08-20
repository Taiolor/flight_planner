import { describe, expect, it } from "vitest";
import {
  areAllHomePanelsOpen,
  getNextHomeGlobalPanelState,
} from "./homePanelVisibility";

describe("visibilidade global dos painéis da Home", () => {
  it("expande todos os painéis quando qualquer um estiver recolhido", () => {
    const current = {
      summary: true,
      filters: false,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: false,
        priceVariation: true,
      },
    };

    expect(areAllHomePanelsOpen(current)).toBe(false);
    expect(getNextHomeGlobalPanelState(current)).toEqual({
      summary: true,
      filters: true,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: true,
        priceVariation: true,
      },
    });
  });

  it("recolhe todos os painéis quando todos estiverem abertos", () => {
    const current = {
      summary: true,
      filters: true,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: true,
        priceVariation: true,
      },
    };

    expect(areAllHomePanelsOpen(current)).toBe(true);
    expect(getNextHomeGlobalPanelState(current)).toEqual({
      summary: false,
      filters: false,
      expandablePanels: {
        annualProgress: false,
        attentionCenter: false,
        priceVariation: false,
      },
    });
  });

  it("mantém abertos os painéis fixados ao recolher todos", () => {
    const current = {
      summary: true,
      filters: true,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: true,
        priceVariation: true,
      },
    };

    expect(getNextHomeGlobalPanelState(current, ["summary", "priceVariation"])).toEqual({
      summary: true,
      filters: false,
      expandablePanels: {
        annualProgress: false,
        attentionCenter: false,
        priceVariation: true,
      },
    });
  });
});
