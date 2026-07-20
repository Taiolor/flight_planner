import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

interface WeekData {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  departureDayOfWeek?: string;
  returnDayOfWeek?: string;
  isTicketIssued: number;
  isDeleted: number;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureFlightNumber?: string | null;
  returnFlightNumber?: string | null;
  departureLocator?: string | null;
  returnLocator?: string | null;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
}

interface PriceMap {
  [weekNumber: number]: { [airline: string]: string };
}

interface FlightPdfExportProps {
  weeksData: WeekData[];
  priceMap: PriceMap;
  totalInvested: number;
}

const AIRLINE_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  latam: { bg: "#e8002d", text: "#fff", label: "LATAM" },
  gol: { bg: "#ff6600", text: "#fff", label: "GOL" },
  azul: { bg: "#1a3c8f", text: "#fff", label: "AZUL" },
};

function formatDatetime(dt: string | null | undefined): string {
  if (!dt) return "—";
  const iso = dt.includes("T") ? dt : dt + "T12:00";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMonthLabel(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00`);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── Componentes de página (sem hooks — apenas JSX puro para renderToStaticMarkup) ─

interface FlightDetailsProps {
  title: string;
  titleColor: string;
  borderRight?: boolean;
  airline?: string | null;
  airlineInfo?: { bg: string; text: string; label: string };
  flightNumber?: string | null;
  locator?: string | null;
  flightDatetime?: string | null;
  airport?: string | null;
}

function FlightDetailsSection({
  title,
  titleColor,
  borderRight,
  airline,
  airlineInfo,
  flightNumber,
  locator,
  flightDatetime,
  airport,
}: FlightDetailsProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: "16px 20px",
        borderRight: borderRight ? "1px solid #e2e8f0" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: titleColor,
          marginBottom: "10px",
        }}
      >
        {title}
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <tbody>
          {airline && (
            <tr>
              <td
                style={{
                  color: "#64748b",
                  paddingBottom: "6px",
                  width: "90px",
                  verticalAlign: "middle",
                }}
              >
                Companhia
              </td>
              <td
                style={{
                  paddingBottom: "6px",
                  verticalAlign: "middle",
                }}
              >
                {airlineInfo ? (
                  <span
                    style={{
                      display: "inline-block",
                      background: airlineInfo.bg,
                      color: airlineInfo.text,
                      borderRadius: "4px",
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      minWidth: "52px",
                      textAlign: "center",
                    }}
                  >
                    {airlineInfo.label}
                  </span>
                ) : (
                  airline
                )}
              </td>
            </tr>
          )}
          {flightNumber && (
            <tr>
              <td
                style={{
                  color: "#64748b",
                  paddingBottom: "6px",
                  verticalAlign: "middle",
                }}
              >
                Voo
              </td>
              <td
                style={{
                  paddingBottom: "6px",
                  fontWeight: 700,
                  color: "#1e293b",
                  verticalAlign: "middle",
                }}
              >
                {flightNumber}
              </td>
            </tr>
          )}
          {locator && (
            <tr>
              <td
                style={{
                  color: "#64748b",
                  paddingBottom: "6px",
                  verticalAlign: "middle",
                }}
              >
                Localizador
              </td>
              <td
                style={{
                  paddingBottom: "6px",
                  fontWeight: 700,
                  color: "#1e293b",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                  verticalAlign: "middle",
                }}
              >
                {locator}
              </td>
            </tr>
          )}
          {flightDatetime && (
            <tr>
              <td
                style={{
                  color: "#64748b",
                  paddingBottom: "6px",
                  verticalAlign: "middle",
                }}
              >
                Data/Hora
              </td>
              <td
                style={{
                  paddingBottom: "6px",
                  color: "#1e293b",
                  verticalAlign: "middle",
                }}
              >
                {formatDatetime(flightDatetime)}
              </td>
            </tr>
          )}
          {airport && (
            <tr>
              <td style={{ color: "#64748b", verticalAlign: "middle" }}>
                Aeroporto
              </td>
              <td
                style={{
                  fontWeight: 600,
                  color: "#1e293b",
                  verticalAlign: "middle",
                }}
              >
                {airport}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CoverHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
        }}
      >
        ✈
      </div>
      <div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
          }}
        >
          Smart Fly
        </div>
        <div style={{ fontSize: "14px", opacity: 0.75 }}>
          Relatório de Passagens Aéreas 2026
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.15)",
        borderRadius: "12px",
        padding: "20px 28px",
        flex: "1",
        minWidth: "180px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          opacity: 0.7,
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function CoverPage({
  issued,
  totalInvested,
}: {
  issued: WeekData[];
  totalInvested: number;
}) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: "794px",
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0ea5e9 100%)",
        padding: "60px 48px 48px",
        color: "#fff",
        minHeight: "1123px",
        boxSizing: "border-box",
      }}
    >
      <CoverHeader />

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "40px",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: "Bilhetes Emitidos",
            value: String(issued.length),
            color: "#fff",
          },
          {
            label: "Total Investido",
            value: `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "#34d399",
          },
          {
            label: "Média por Viagem",
            value:
              issued.length > 0
                ? `R$ ${(totalInvested / issued.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "—",
            color: "#fbbf24",
          },
        ].map(item => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            color={item.color}
          />
        ))}
      </div>

      <div style={{ marginTop: "48px", fontSize: "12px", opacity: 0.55 }}>
        Gerado em{" "}
        {new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

function WeekCard({
  week,
  isLast,
  priceMap,
}: {
  week: WeekData;
  isLast: boolean;
  priceMap: PriceMap;
}) {
  const prices = priceMap[week.weekNumber] || {};
  const depAirlineKey = week.departureAirline?.toLowerCase() ?? "";
  const retAirlineKey = week.returnAirline?.toLowerCase() ?? "";
  const depPrice =
    depAirlineKey && prices[depAirlineKey]
      ? parseFloat(prices[depAirlineKey])
      : null;
  const depAirlineInfo = AIRLINE_COLORS[depAirlineKey];
  const retAirlineInfo = AIRLINE_COLORS[retAirlineKey];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        marginBottom: isLast ? "0" : "16px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)",
          color: "#fff",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "14px" }}>
          Semana {week.weekNumber} — {week.departureDate} → {week.returnDate}
        </div>
        {depPrice !== null && !isNaN(depPrice) && (
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              padding: "3px 12px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            R${" "}
            {depPrice.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex" }}>
        <FlightDetailsSection
          title="→ IDA"
          titleColor="#1d4ed8"
          borderRight={true}
          airline={week.departureAirline}
          airlineInfo={depAirlineInfo}
          flightNumber={week.departureFlightNumber}
          locator={week.departureLocator}
          flightDatetime={week.departureFlightDatetime}
          airport={week.departureAirport}
        />
        <FlightDetailsSection
          title="↩ VOLTA"
          titleColor="#ea580c"
          airline={week.returnAirline}
          airlineInfo={retAirlineInfo}
          flightNumber={week.returnFlightNumber}
          locator={week.returnLocator}
          flightDatetime={week.returnFlightDatetime}
          airport={week.returnAirport}
        />
      </div>
    </div>
  );
}

function MonthPage({
  monthLabel,
  weeks,
  priceMap,
}: {
  monthLabel: string;
  weeks: WeekData[];
  priceMap: PriceMap;
}) {
  const monthTotal = weeks.reduce((acc, w) => {
    const prices = priceMap[w.weekNumber];
    if (!prices) return acc;
    const airline = w.departureAirline?.toLowerCase();
    const price = airline && prices[airline] ? parseFloat(prices[airline]) : 0;
    return acc + (isNaN(price) ? 0 : price);
  }, 0);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: "794px",
        background: "#f8fafc",
        padding: "32px 48px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "3px solid #1d4ed8",
          paddingBottom: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#1e3a8a",
            textTransform: "capitalize",
          }}
        >
          {monthLabel}
        </div>
        {monthTotal > 0 && (
          <div
            style={{
              background: "#dbeafe",
              color: "#1d4ed8",
              borderRadius: "8px",
              padding: "6px 18px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Total: R${" "}
            {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {weeks.map((week, wi) => (
        <WeekCard
          key={week.weekNumber}
          week={week}
          isLast={wi === weeks.length - 1}
          priceMap={priceMap}
        />
      ))}

      <div
        style={{
          marginTop: "24px",
          paddingTop: "12px",
          borderTop: "1px solid #e2e8f0",
          fontSize: "10px",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Smart Fly • Relatório gerado automaticamente •{" "}
        {new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>
  );
}

// ─── Renderiza JSX como HTML estático em iframe e captura com html2canvas ────
async function renderPageToCanvas(
  jsx: React.ReactElement
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    // Gerar HTML puro (sem React runtime — apenas string HTML)
    const htmlContent = renderToStaticMarkup(jsx);

    // Criar div oculto diretamente no DOM principal (html2canvas não consegue capturar iframes)
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:794px",
      "min-height:1123px",
      "background:#fff",
      "z-index:-9999",
      "pointer-events:none",
      "overflow:visible",
      "font-family:Arial,sans-serif",
    ].join(";");
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Aguardar o browser renderizar o conteúdo
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const el = container.firstElementChild as HTMLElement;
          if (!el) throw new Error("Elemento não encontrado no container");

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            width: 794,
            windowWidth: 794,
            logging: false,
            allowTaint: true,
          });

          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error("Canvas gerado com dimensões inválidas");
          }

          resolve(canvas);
        } catch (err) {
          reject(err);
        } finally {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        }
      }, 200);
    });
  });
}

function addCanvasToPdfHelper(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  isFirst: boolean,
  pdfW: number,
  pdfH: number
) {
  if (!isFirst) pdf.addPage();

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const canvasW = canvas.width;
  const canvasH = canvas.height;

  // Validar dimensões do canvas
  if (!canvasW || !canvasH || canvasW === 0 || canvasH === 0) {
    console.error("[PDF Debug] Canvas inválido, pulando página");
    return;
  }

  // O canvas é gerado com scale:2 (dobro da resolução)
  // canvasW/2 = largura real em pixels CSS (794px)
  // pdfW = largura do PDF em mm (210mm para A4)
  const scale = pdfW / (canvasW / 2);
  const imgH = (canvasH / 2) * scale;

  // Tolerância de 1mm para evitar entrar no branch de múltiplas páginas por diferença de arredondamento
  const TOLERANCE_MM = 1.0;
  if (imgH <= pdfH + TOLERANCE_MM) {
    // Cabe em uma única página — clipa a altura para o tamanho exato da página
    const finalH = Math.min(imgH, pdfH);
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, finalH);
  } else {
    let yOffset = 0;
    let firstSlice = true;
    while (yOffset < imgH) {
      if (!firstSlice) pdf.addPage();
      firstSlice = false;

      const sliceHeightPx = Math.round((pdfH / scale) * 2);
      const sliceYPx = Math.round((yOffset / scale) * 2);
      const actualSliceH = Math.min(sliceHeightPx, canvasH - sliceYPx);

      // Ignorar fatias com altura zero (fim do canvas)
      if (actualSliceH <= 0) break;

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvasW;
      sliceCanvas.height = actualSliceH;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, actualSliceH);
      ctx.drawImage(
        canvas,
        0,
        sliceYPx,
        canvasW,
        actualSliceH,
        0,
        0,
        canvasW,
        actualSliceH
      );

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
      const sliceHMm = (actualSliceH / 2) * scale;
      if (sliceHMm > 0) {
        pdf.addImage(sliceData, "JPEG", 0, 0, pdfW, sliceHMm);
      }
      yOffset += pdfH;
    }
  }
}

// ─── Botão de exportação ─────────────────────────────────────────────────────
export function ExportPdfButton({
  weeksData,
  priceMap,
  totalInvested,
}: FlightPdfExportProps) {
  const [exporting, setExporting] = useState(false);

  const issued = weeksData.filter(w => !!w.isTicketIssued && !w.isDeleted);

  // Agrupar por mês
  const byMonth: Record<string, WeekData[]> = {};
  issued.forEach(w => {
    const key = getMonthLabel(w.departureDate);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(w);
  });
  const months = Object.entries(byMonth);

  const handleExport = async () => {
    if (issued.length === 0) return;
    setExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // 1. Capa
      const coverCanvas = await renderPageToCanvas(
        <CoverPage issued={issued} totalInvested={totalInvested} />
      );
      addCanvasToPdfHelper(pdf, coverCanvas, true, pdfW, pdfH);

      // 2. Uma página por mês
      for (let i = 0; i < months.length; i++) {
        const [monthLabel, weeks] = months[i];
        const monthCanvas = await renderPageToCanvas(
          <MonthPage
            monthLabel={monthLabel}
            weeks={weeks}
            priceMap={priceMap}
          />
        );
        addCanvasToPdfHelper(pdf, monthCanvas, false, pdfW, pdfH);
      }

      pdf.save("SmartFly-Passagens-2026.pdf");
    } catch (err) {
      console.error("[PDF Export Error]", err);
      alert("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={exporting || issued.length === 0}
      title={
        issued.length === 0
          ? "Nenhum bilhete emitido para exportar"
          : "Exportar relatório em PDF"
      }
      aria-label="Exportar relatório em PDF"
      className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-700 transition-all"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      <span className="hidden sm:inline ml-1">PDF</span>
    </Button>
  );
}
