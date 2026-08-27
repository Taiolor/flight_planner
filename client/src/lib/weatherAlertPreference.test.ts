import { describe, expect, it } from "vitest";
import { WEATHER_ALERTS_STORAGE_KEY, readWeatherAlertsVisible, saveWeatherAlertsVisible } from "./weatherAlertPreference";

function makeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("weatherAlertPreference", () => {
  it("mantém os alertas meteorológicos visíveis por padrão e persiste a escolha", () => {
    const storage = makeStorage();
    expect(readWeatherAlertsVisible(storage)).toBe(true);
    saveWeatherAlertsVisible(false, storage);
    expect(storage.getItem(WEATHER_ALERTS_STORAGE_KEY)).toBe("false");
    expect(readWeatherAlertsVisible(storage)).toBe(false);
  });

  it("descarta valores locais inválidos", () => {
    expect(readWeatherAlertsVisible(makeStorage({ [WEATHER_ALERTS_STORAGE_KEY]: '"invalido"' }))).toBe(true);
  });
});
