import { describe, expect, it, vi } from "vitest";
import {
  applyPinnedPanels,
  deleteHomePrioritySet,
  getHomeLayoutProfileState,
  HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
  persistHomeDashboardPreferences,
  readHomeDashboardPreferences,
  reorderPinnedPanels,
  reorderPinnedPanelsByDrop,
  restoreDefaultPinnedOrder,
  upsertHomePrioritySet,
} from "./homeDashboardPreferences";

describe("preferências de layout da Home", () => {
  it("restaura apenas painéis prioritários válidos e elimina duplicatas", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({
          profile: "focus",
          pinnedPanels: ["summary", "priceVariation", "summary", "invalido"],
        })
      ),
    };

    expect(readHomeDashboardPreferences(storage)).toEqual({
      profile: "focus",
      pinnedPanels: ["summary", "priceVariation"],
      prioritySets: [],
      mobilePrimaryAction: "calendar",
    });
  });

  it("aplica o perfil e preserva abertos os painéis prioritários", () => {
    const focused = getHomeLayoutProfileState("focus");

    expect(applyPinnedPanels(focused, ["filters", "priceVariation"])).toEqual({
      summary: true,
      filters: true,
      expandablePanels: {
        annualProgress: true,
        attentionCenter: false,
        priceVariation: true,
      },
    });
  });

  it("persiste perfil e prioridades no armazenamento local", () => {
    const storage = { setItem: vi.fn() };
    const preferences = {
      profile: "compact" as const,
      pinnedPanels: ["summary" as const],
      prioritySets: [],
      mobilePrimaryAction: "passages" as const,
    };

    persistHomeDashboardPreferences(preferences, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  });

  it("reordena prioridades sem alterar os limites da lista", () => {
    const pinnedPanels = ["summary", "filters", "priceVariation"] as const;

    expect(reorderPinnedPanels([...pinnedPanels], "filters", "previous")).toEqual([
      "filters",
      "summary",
      "priceVariation",
    ]);
    expect(reorderPinnedPanels([...pinnedPanels], "summary", "previous")).toEqual(
      pinnedPanels
    );
    expect(reorderPinnedPanels([...pinnedPanels], "priceVariation", "next")).toEqual(
      pinnedPanels
    );
  });

  it("restaura a ordem padrão e permite reposicionar uma prioridade pelo destino", () => {
    const pinnedPanels = ["priceVariation", "summary", "filters"] as const;

    expect(restoreDefaultPinnedOrder([...pinnedPanels])).toEqual([
      "summary",
      "filters",
      "priceVariation",
    ]);
    expect(
      reorderPinnedPanelsByDrop([...pinnedPanels], "priceVariation", "summary")
    ).toEqual(["summary", "priceVariation", "filters"]);
  });

  it("salva, atualiza e exclui conjuntos nomeados de prioridades", () => {
    const saved = upsertHomePrioritySet([], "Viagens de trabalho", ["filters", "summary"]);
    const updated = upsertHomePrioritySet(saved, "Viagens de trabalho", ["priceVariation"]);

    expect(updated).toEqual([
      {
        id: "set-viagens-de-trabalho",
        name: "Viagens de trabalho",
        pinnedPanels: ["priceVariation"],
      },
    ]);
    expect(deleteHomePrioritySet(updated, "set-viagens-de-trabalho")).toEqual([]);
  });
});
