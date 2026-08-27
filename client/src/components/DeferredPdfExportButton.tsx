import React, { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlightPdfExportProps } from "./FlightPdfExport";

type PdfModule = Pick<typeof import("./FlightPdfExport"), "exportFlightPdf">;

export type PdfModuleLoader = () => Promise<PdfModule>;

const defaultLoadPdfModule: PdfModuleLoader = () => import("./FlightPdfExport");

export const PDF_EXPORT_MENU_BUTTON_CLASS =
  "group h-10 w-full justify-start rounded-lg border border-white/25 bg-white/10 px-2 !text-white shadow-none hover:bg-white/18 hover:!text-white focus-visible:ring-2 focus-visible:ring-white disabled:border-white/15 disabled:bg-white/5 disabled:!text-slate-300 disabled:opacity-100";

interface DeferredPdfExportButtonProps extends FlightPdfExportProps {
  loadPdfModule?: PdfModuleLoader;
  className?: string;
}

export function hasIssuedPdfTickets(weeksData: FlightPdfExportProps["weeksData"]) {
  return weeksData.some(
    week =>
      !week.isDeleted &&
      (!!week.isTicketIssued || week.additionalFlights?.some(flight => !!flight.isTicketIssued))
  );
}

export async function loadAndExportPdf(
  pdfProps: FlightPdfExportProps,
  loadPdfModule: PdfModuleLoader = defaultLoadPdfModule
) {
  const { exportFlightPdf } = await loadPdfModule();
  await exportFlightPdf(pdfProps);
}

export function DeferredPdfExportButton({
  loadPdfModule = defaultLoadPdfModule,
  className,
  ...pdfProps
}: DeferredPdfExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const hasIssuedTickets = hasIssuedPdfTickets(pdfProps.weeksData);

  const handleExport = async () => {
    if (!hasIssuedTickets) return;

    setIsGenerating(true);
    try {
      await loadAndExportPdf(pdfProps, loadPdfModule);
    } catch (error) {
      console.error("[PDF Export Error]", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={isGenerating || !hasIssuedTickets}
      title={
        !hasIssuedTickets
          ? "Nenhum bilhete emitido para exportar"
          : isGenerating
            ? "Gerando relatório em PDF"
            : "Exportar relatório em PDF"
      }
      aria-label={
        isGenerating ? "Gerando relatório em PDF" : "Exportar relatório em PDF"
      }
      className={`${PDF_EXPORT_MENU_BUTTON_CLASS} ${className ?? ""}`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="ml-1 text-sm font-semibold !text-white group-disabled:!text-slate-300">
        {isGenerating ? "Gerando PDF..." : "Exportar PDF"}
      </span>
    </Button>
  );
}
