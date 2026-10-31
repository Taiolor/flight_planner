// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { readOfflineNextTrips, saveOfflineNextTrips } from "./offlineNextTrips";

const trip = {
  weekNumber: 27,
  departureDate: "30/06/2026",
  returnDate: "04/07/2026",
  route: "GRU → NVT",
  airline: "latam",
  status: "pending" as const,
};

describe("offlineNextTrips", () => {
  afterEach(() => window.localStorage.clear());

  it("armazena até três viagens mínimas sem localizadores, números de voo ou preços", () => {
    saveOfflineNextTrips(2026, [trip, { ...trip, weekNumber: 28 }, { ...trip, weekNumber: 29 }, { ...trip, weekNumber: 30 }], 1_785_000_000_000);

    expect(readOfflineNextTrips(2026, 1_785_000_000_001)?.trips).toHaveLength(3);
    const stored = window.localStorage.getItem("smartfly:offline-next-trips:2026") ?? "";
    expect(stored).not.toContain("locator");
    expect(stored).not.toContain("price");
  });

  it("descarta snapshots expirados ou malformados", () => {
    saveOfflineNextTrips(2026, [trip], 1_785_000_000_000);
    expect(readOfflineNextTrips(2026, 1_785_000_000_000 + 15 * 24 * 60 * 60 * 1000)).toBeNull();
    window.localStorage.setItem("smartfly:offline-next-trips:2027", "invalido");
    expect(readOfflineNextTrips(2027)).toBeNull();
  });
});
