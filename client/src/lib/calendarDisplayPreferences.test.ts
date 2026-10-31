import { describe, expect, it } from "vitest";
import {
  CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY,
  readCalendarDisplayPreferences,
  saveCalendarDisplayPreferences,
} from "./calendarDisplayPreferences";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("calendarDisplayPreferences", () => {
  it("usa preferências seguras quando não há valor persistido", () => {
    expect(readCalendarDisplayPreferences(createStorage())).toEqual({
      highContrast: false,
      secondaryFiltersExpanded: false,
    });
  });

  it("valida cada preferência persistida separadamente", () => {
    expect(
      readCalendarDisplayPreferences(
        createStorage({
          [CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY]: JSON.stringify({
            highContrast: true,
            secondaryFiltersExpanded: "aberto",
          }),
        })
      )
    ).toEqual({ highContrast: true, secondaryFiltersExpanded: false });
  });

  it("persiste os controles reversíveis do Calendário", () => {
    const storage = createStorage();
    saveCalendarDisplayPreferences(
      { highContrast: true, secondaryFiltersExpanded: true },
      storage
    );

    expect(storage.getItem(CALENDAR_DISPLAY_PREFERENCES_STORAGE_KEY)).toBe(
      '{"highContrast":true,"secondaryFiltersExpanded":true}'
    );
  });
});
