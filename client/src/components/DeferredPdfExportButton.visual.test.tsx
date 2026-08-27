// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeferredPdfExportButton } from "./DeferredPdfExportButton";

describe("DeferredPdfExportButton — contraste no menu", () => {
  it("mantém o rótulo Exportar PDF visível e contrastado", () => {
    render(
      <DeferredPdfExportButton
        year={2026}
        weeksData={[
          {
            weekNumber: 26,
            departureDate: "23/08/2026",
            returnDate: "28/08/2026",
            isTicketIssued: 1,
            isDeleted: 0,
          },
        ]}
        priceMap={{}}
        totalInvested={0}
      />
    );

    const exportButton = screen.getByRole("button", { name: "Exportar relatório em PDF" });
    expect(exportButton.className).toContain("!text-white");
    expect(exportButton.className).toContain("bg-white/10");
    expect(exportButton.className).toContain("border-white/25");
    expect(screen.getByText("Exportar PDF").className).toContain("!text-white");
  });
});
