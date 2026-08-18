import { describe, expect, it, vi } from "vitest";
import {
  hasIssuedPdfTickets,
  loadAndExportPdf,
  type PdfModuleLoader,
} from "./DeferredPdfExportButton";
import type { FlightPdfExportProps } from "./FlightPdfExport";

const pdfProps: FlightPdfExportProps = {
  year: 2026,
  weeksData: [
    {
      weekNumber: 1,
      departureDate: "04/01/2026",
      returnDate: "09/01/2026",
      isTicketIssued: 1,
      isDeleted: 0,
    },
  ],
  priceMap: {},
  totalInvested: 0,
};

describe("DeferredPdfExportButton", () => {
  it("identifica quando há bilhetes elegíveis para exportação", () => {
    expect(hasIssuedPdfTickets(pdfProps.weeksData)).toBe(true);
    expect(
      hasIssuedPdfTickets([{ ...pdfProps.weeksData[0], isDeleted: 1 }])
    ).toBe(false);
  });

  it("carrega o módulo de PDF somente quando a exportação é solicitada", async () => {
    const exportFlightPdf = vi.fn().mockResolvedValue(undefined);
    const loadPdfModule: PdfModuleLoader = vi.fn().mockResolvedValue({
      exportFlightPdf,
    });

    await loadAndExportPdf(pdfProps, loadPdfModule);

    expect(loadPdfModule).toHaveBeenCalledTimes(1);
    expect(exportFlightPdf).toHaveBeenCalledWith(pdfProps);
  });
});
