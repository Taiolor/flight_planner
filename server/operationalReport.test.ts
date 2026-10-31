import { describe, expect, it } from "vitest";
import { buildOperationalExecutiveReportEmail } from "./operationalReport";

describe("buildOperationalExecutiveReportEmail", () => {
  it("escapa detalhes operacionais antes de interpolá-los no e-mail", () => {
    const html = buildOperationalExecutiveReportEmail(2026, {
      totals: { pendingPurchases: 2, incompleteChecklistItems: 1, activeCreditsCents: 12345 },
      decisions: [{ title: "<script>", description: "Erro & pendência", severity: "critical" }],
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Erro &amp; pendência");
    expect(html).not.toContain("<script>");
  });
});
