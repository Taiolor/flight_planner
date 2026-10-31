import { describe, expect, it } from "vitest";
import {
  adjustDecisionWeekRelevance,
  persistDecisionCenterPreferences,
  readDecisionCenterPreferences,
} from "./decisionCenterPreferences";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("decisionCenterPreferences", () => {
  it("persiste a fila recolhível e os ajustes por semana no exercício selecionado", () => {
    const storage = createStorage();
    const updated = adjustDecisionWeekRelevance(
      { isExpanded: true, isPinned: false, secondaryQueueOpen: true, relevanceByWeek: {} },
      27,
      "raise"
    );

    persistDecisionCenterPreferences(2026, updated, storage);

    expect(readDecisionCenterPreferences(2026, storage)).toEqual({
      isExpanded: true,
      isPinned: false,
      secondaryQueueOpen: true,
      relevanceByWeek: { 27: 40 },
    });
    expect(readDecisionCenterPreferences(2027, storage)).toEqual({
      isExpanded: true,
      isPinned: false,
      secondaryQueueOpen: false,
      relevanceByWeek: {},
    });
  });

  it("descarta valores persistidos inválidos e limita ajustes manuais", () => {
    const storage = createStorage();
    storage.setItem(
      "viagens.home.decision-center.2026.v1",
      JSON.stringify({ isExpanded: "sim", isPinned: "sim", secondaryQueueOpen: "sim", relevanceByWeek: { 0: 500, 27: 999, 28: "x" } })
    );

    expect(readDecisionCenterPreferences(2026, storage)).toEqual({
      isExpanded: true,
      isPinned: false,
      secondaryQueueOpen: false,
      relevanceByWeek: { 27: 160 },
    });
  });

  it("persiste expansão e fixação da Central apenas com valores booleanos válidos", () => {
    const storage = createStorage();
    persistDecisionCenterPreferences(2026, {
      isExpanded: false,
      isPinned: true,
      secondaryQueueOpen: true,
      relevanceByWeek: {},
    }, storage);

    expect(readDecisionCenterPreferences(2026, storage)).toMatchObject({
      isExpanded: false,
      isPinned: true,
    });
  });
});
