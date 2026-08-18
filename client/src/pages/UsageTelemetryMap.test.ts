import { describe, expect, it } from "vitest";
import { LOCATIONS_BACK_ROUTE } from "./UsageTelemetryMap";

describe("UsageTelemetryMap navigation", () => {
  it("returns from the protected locations map to the Home route", () => {
    expect(LOCATIONS_BACK_ROUTE).toBe("/");
  });
});
