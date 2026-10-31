import { describe, expect, it } from "vitest";
import { getMileagePurchasesSummaryByYear } from "./mileagePurchasesDb";

describe("mileage purchases database helpers", () => {
  it("aggregates miles and paid values by program without mixing records", async () => {
    const summary = await getMileagePurchasesSummaryByYear(2026, [
      {
        id: 1,
        year: 2026,
        purchaseDate: "2026-08-14",
        miles: 50000,
        program: "SMILES",
        paidPriceCents: 79990,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        year: 2026,
        purchaseDate: "2026-09-02",
        miles: 25000,
        program: "LATAM PASS",
        paidPriceCents: 45000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    expect(summary).toEqual({
      purchaseCount: 2,
      totalMiles: 75000,
      totalPaidCents: 124990,
      byProgram: {
        SMILES: { miles: 50000, paidCents: 79990, count: 1 },
        "LATAM PASS": { miles: 25000, paidCents: 45000, count: 1 },
      },
    });
  });
});
