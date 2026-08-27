import { describe, expect, it } from "vitest";
import {
  dismissDecisionWeatherAlert,
  readDecisionWeatherDismissals,
  saveDecisionWeatherDismissals,
} from "./decisionWeatherDismissals";

function createStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  };
}

describe("dispensas de alertas meteorológicos", () => {
  it("persiste somente identificadores de previsão válidos e isolados por ano", () => {
    const storage = createStorage();
    saveDecisionWeatherDismissals(2026, ["weather-27-2026-08-30", "inválido", "weather-27-2026-08-30"], storage);

    expect(readDecisionWeatherDismissals(2026, storage)).toEqual(["weather-27-2026-08-30"]);
    expect(readDecisionWeatherDismissals(2027, storage)).toEqual([]);
  });

  it("mantém a dispensa idempotente até o usuário reativar os alertas", () => {
    const first = dismissDecisionWeatherAlert([], "weather-27-2026-08-30");
    expect(dismissDecisionWeatherAlert(first, "weather-27-2026-08-30")).toEqual(first);
  });
});
