import { describe, expect, it } from "vitest";
import {
  parseMileagePurchasePriceToCents,
  validateMileagePurchaseDraft,
} from "./mileagePurchaseValidation";

describe("mileage purchase validation", () => {
  it("converts Brazilian decimal values to cents", () => {
    expect(parseMileagePurchasePriceToCents("799,90")).toBe(79990);
    expect(parseMileagePurchasePriceToCents("0")).toBe(0);
    expect(parseMileagePurchasePriceToCents("abc")).toBeNull();
  });

  it("requires the purchase date to belong to the selected year", () => {
    const draft = {
      purchaseDate: "2026-08-14",
      miles: "50000",
      program: "SMILES",
      paidValue: "799,90",
    };
    expect(validateMileagePurchaseDraft(draft, 2026)).toBeNull();
    expect(validateMileagePurchaseDraft({ ...draft, purchaseDate: "2027-01-01" }, 2026)).toContain("2026");
  });

  it("rejects incomplete or non-positive values", () => {
    const draft = {
      purchaseDate: "2026-08-14",
      miles: "0",
      program: "",
      paidValue: "-1",
    };
    expect(validateMileagePurchaseDraft(draft, 2026)).toBe("Informe uma quantidade de milhas maior que zero.");
  });
});
