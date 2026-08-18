import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("FinancialDashboard deferred charts", () => {
  it("loads the chart module dynamically instead of importing Recharts in the route bundle", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/FinancialDashboard.tsx"),
      "utf8"
    );

    expect(source).toContain(
      'lazy(() => import("@/components/FinancialCharts"))'
    );
    expect(source).not.toContain('from "recharts"');
  });
});
