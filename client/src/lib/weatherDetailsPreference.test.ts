import { describe, expect, it } from "vitest";
import {
  WEATHER_DETAILS_STORAGE_KEY,
  readWeatherDetailsVisibility,
  saveWeatherDetailsVisibility,
} from "./weatherDetailsPreference";

function makeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("weatherDetailsPreference", () => {
  it("mantém os detalhes recolhidos por padrão e persiste cada trecho de forma independente", () => {
    const storage = makeStorage();
    expect(readWeatherDetailsVisibility(storage)).toEqual({ departure: false, return: false });

    saveWeatherDetailsVisibility({ departure: true, return: false }, storage);

    expect(storage.getItem(WEATHER_DETAILS_STORAGE_KEY)).toBe('{"departure":true,"return":false}');
    expect(readWeatherDetailsVisibility(storage)).toEqual({ departure: true, return: false });
  });

  it("descarta valores locais incompletos ou inválidos", () => {
    expect(readWeatherDetailsVisibility(makeStorage({ [WEATHER_DETAILS_STORAGE_KEY]: '{"departure":false}' }))).toEqual({ departure: false, return: false });
    expect(readWeatherDetailsVisibility(makeStorage({ [WEATHER_DETAILS_STORAGE_KEY]: 'invalido' }))).toEqual({ departure: false, return: false });
  });
});
