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

  it("mantém os quatro filtros de período alinhados em uma única linha distribuída", () => {
    const source = readFileSync("client/src/pages/UsageTelemetryMap.tsx", "utf8");

    expect(source).toContain('className="grid grid-cols-4 gap-2" aria-label="Filtros de telemetria"');
    expect(source).toContain("const PERIOD_FILTERS = [");
    expect(source).toContain('aria-label={option.ariaLabel}');
    expect(source).toContain('className="col-span-4 justify-center border-slate-600 text-slate-300"');
  });
});
