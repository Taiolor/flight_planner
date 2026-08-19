import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Financial dashboard mobile responsiveness", () => {
  const dashboardSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/FinancialDashboard.tsx"),
    "utf8"
  );
  const chartsSource = readFileSync(
    resolve(process.cwd(), "client/src/components/FinancialCharts.tsx"),
    "utf8"
  );

  it("uses mobile cards for financial tables while preserving desktop tables", () => {
    expect(dashboardSource).toContain("space-y-3 sm:hidden");
    expect(dashboardSource).toContain("hidden overflow-x-auto sm:block");
  });

  it("uses compact chart axis ticks and mobile-safe pie labels", () => {
    expect(chartsSource).toContain("interval=\"preserveStartEnd\"");
    expect(chartsSource).toContain("outerRadius={78} label={false}");
    expect(chartsSource).toContain("Legend verticalAlign=\"bottom\"");
  });
});
