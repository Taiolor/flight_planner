import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/OpenStreetMap", () => ({
  OpenStreetMap: () => null,
}));

import { LOCATIONS_BACK_ROUTE } from "./UsageTelemetryMap";

describe("UsageTelemetryMap navigation", () => {
  it("returns from the protected locations map to the Home route", () => {
    expect(LOCATIONS_BACK_ROUTE).toBe("/");
  });

  it("substitui o spinner azul-brilhante por um acento neutro na telemetria", () => {
    const source = readFileSync("client/src/pages/UsageTelemetryMap.tsx", "utf8");

    expect(source).toContain("animate-spin text-slate-300");
    expect(source).not.toContain("animate-spin text-blue-400");
  });
});
