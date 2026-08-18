import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Smart Fly visual branding", () => {
  it("uses Viagens instead of the route-and-year label in the main header", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8"
    );
    const manifest = readFileSync(
      resolve(process.cwd(), "client/public/manifest.json"),
      "utf8"
    );

    expect(source).toContain("Viagens");
    expect(source).not.toContain("{departureAirport} → NVT • {selectedYear}");
    expect(manifest).toContain("Planejamento inteligente de viagens");
  });
});
