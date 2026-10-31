import { describe, expect, it } from "vitest";
import {
  CALENDAR_STATUS_LEGEND_STORAGE_KEY,
  readCalendarStatusLegendExpanded,
  saveCalendarStatusLegendExpanded,
} from "./calendarStatusLegendPreference";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("calendarStatusLegendPreference", () => {
  it("mantém a legenda expandida quando não existe preferência", () => {
    expect(readCalendarStatusLegendExpanded(createStorage())).toBe(true);
  });

  it("restaura somente booleanos válidos e descarta valores malformados", () => {
    expect(
      readCalendarStatusLegendExpanded(
        createStorage({ [CALENDAR_STATUS_LEGEND_STORAGE_KEY]: "false" })
      )
    ).toBe(false);
    expect(
      readCalendarStatusLegendExpanded(
        createStorage({ [CALENDAR_STATUS_LEGEND_STORAGE_KEY]: '"aberta"' })
      )
    ).toBe(true);
  });

  it("persiste uma escolha reversível com chave namespaced", () => {
    const storage = createStorage();
    saveCalendarStatusLegendExpanded(false, storage);
    expect(storage.getItem(CALENDAR_STATUS_LEGEND_STORAGE_KEY)).toBe("false");
  });
});
