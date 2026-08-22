import { beforeEach, describe, expect, it } from "vitest";
import {
  readTelemetryPeriodPreference,
  saveTelemetryPeriodPreference,
  TELEMETRY_PERIOD_STORAGE_KEY,
} from "./telemetryPeriodPreference";

describe("telemetryPeriodPreference", () => {
  let storage: Storage;

  beforeEach(() => {
    const values = new Map<string, string>();
    storage = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
      clear: () => values.clear(),
      key: index => [...values.keys()][index] ?? null,
      get length() {
        return values.size;
      },
    } as Storage;
  });

  it("restaura o último período válido de telemetria", () => {
    storage.setItem(TELEMETRY_PERIOD_STORAGE_KEY, "168");

    expect(readTelemetryPeriodPreference(storage)).toBe(168);
  });

  it("usa 24 horas como padrão quando a preferência é ausente ou inválida", () => {
    expect(readTelemetryPeriodPreference(storage)).toBe(24);

    storage.setItem(TELEMETRY_PERIOD_STORAGE_KEY, "48");
    expect(readTelemetryPeriodPreference(storage)).toBe(24);
  });

  it("persiste somente um período operacional válido", () => {
    saveTelemetryPeriodPreference(720, storage);

    expect(storage.getItem(TELEMETRY_PERIOD_STORAGE_KEY)).toBe("720");
  });
});
