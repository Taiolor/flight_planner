import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HOME_PANEL_PREFERENCES,
  HOME_PANEL_PREFERENCES_STORAGE_KEY,
  persistHomePanelPreferences,
  readHomePanelPreferences,
} from "./Home";

describe("Home panel preferences", () => {
  it("uses open panels by default when no preference was saved", () => {
    const storage = { getItem: vi.fn().mockReturnValue(null) };

    expect(readHomePanelPreferences(storage)).toEqual(
      DEFAULT_HOME_PANEL_PREFERENCES
    );
  });

  it("restores the last saved open and closed states independently", () => {
    const storage = {
      getItem: vi
        .fn()
        .mockReturnValue(JSON.stringify({ summary: false, filters: true })),
    };

    expect(readHomePanelPreferences(storage)).toEqual({
      summary: false,
      filters: true,
    });
  });

  it("persists both panel states under the Home preference key", () => {
    const storage = { setItem: vi.fn() };

    persistHomePanelPreferences({ summary: true, filters: false }, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      HOME_PANEL_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ summary: true, filters: false })
    );
  });

  it("falls back safely when the stored value is invalid", () => {
    const storage = { getItem: vi.fn().mockReturnValue("not-json") };

    expect(readHomePanelPreferences(storage)).toEqual(
      DEFAULT_HOME_PANEL_PREFERENCES
    );
  });
});
