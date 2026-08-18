import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlightPdfExportProps } from "./FlightPdfExport";

type PdfModule = Pick<typeof import("./FlightPdfExport"), "exportFlightPdf">;

export type PdfModuleLoader = () => Promise<PdfModule>;

const defaultLoadPdfModule: PdfModuleLoader = () => import("./FlightPdfExport");

interface DeferredPdfExportButtonProps extends FlightPdfExportProps {
  loadPdfModule?: PdfModuleLoader;
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
      className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-700 transition-all"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline ml-1">
        {isGenerating ? "Gerando..." : "PDF"}
      </span>
    </Button>
  );
}
