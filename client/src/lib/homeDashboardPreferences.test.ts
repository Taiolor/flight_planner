import { describe, expect, it, vi } from "vitest";
import {
  applyPinnedPanels,
  getHomeLayoutProfileState,
  HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
  persistHomeDashboardPreferences,
  readHomeDashboardPreferences,
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
    const preferences = { profile: "compact" as const, pinnedPanels: ["summary" as const] };

    persistHomeDashboardPreferences(preferences, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      HOME_DASHBOARD_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  });
});
