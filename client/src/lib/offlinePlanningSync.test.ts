// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  formatPlanningSyncTimestamp,
  readLatestPlanningSyncTimestamp,
  readPlanningSyncTimestamp,
  savePlanningSyncTimestamp,
} from "./offlinePlanningSync";

describe("offlinePlanningSync", () => {
  afterEach(() => window.localStorage.clear());

  it("persiste somente o timestamp da última sincronização por exercício e globalmente", () => {
    savePlanningSyncTimestamp(2026, 1_785_000_000_000);

    expect(readPlanningSyncTimestamp(2026)).toBe(1_785_000_000_000);
    expect(readLatestPlanningSyncTimestamp()).toBe(1_785_000_000_000);
    expect(window.localStorage.getItem("smartfly:planning-sync:2026")).toBe("1785000000000");
  });

  it("descarta timestamps inválidos e formata apenas valores válidos", () => {
    window.localStorage.setItem("smartfly:planning-sync:2026", "indefinido");

    expect(readPlanningSyncTimestamp(2026)).toBeNull();
    expect(formatPlanningSyncTimestamp(null)).toBeNull();
  });
});
