import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';

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

const AIRLINE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  latam: { bg: '#e8002d', text: '#fff', label: 'LATAM' },
  gol:   { bg: '#ff6600', text: '#fff', label: 'GOL' },
  azul:  { bg: '#1a3c8f', text: '#fff', label: 'AZUL' },
};

function formatDatetime(dt: string | null | undefined): string {
  if (!dt) return '—';
  const iso = dt.includes('T') ? dt : dt + 'T12:00';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getMonthLabel(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00`);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ─── Capa (primeira página) ──────────────────────────────────────────────────
function CoverPage({ issued, totalInvested }: { issued: WeekData[]; totalInvested: number }) {
  return (
    <div style={{
      fontFamily: 'Roboto, Arial, sans-serif',
      width: '794px',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0ea5e9 100%)',
      padding: '60px 48px 48px',
      color: '#fff',
      minHeight: '297mm',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>✈</div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Smart Fly</div>
          <div style={{ fontSize: '14px', opacity: 0.75 }}>Relatório de Passagens Aéreas 2026</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '40px', flexWrap: 'wrap' }}>
        {[
          { label: 'Bilhetes Emitidos', value: String(issued.length), color: '#fff' },
          { label: 'Total Investido', value: `R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#34d399' },
          { label: 'Média por Viagem', value: issued.length > 0 ? `R$ ${(totalInvested / issued.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—', color: '#fbbf24' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
            padding: '20px 28px', flex: '1', minWidth: '180px',
          }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '48px', fontSize: '12px', opacity: 0.55 }}>
        Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

// ─── Página de um mês ────────────────────────────────────────────────────────
function MonthPage({ monthLabel, weeks, priceMap }: {
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
    <div style={{
      fontFamily: 'Roboto, Arial, sans-serif',
      width: '794px',
      background: '#f8fafc',
      padding: '32px 48px 40px',
      boxSizing: 'border-box',
    }}>
      {/* Cabeçalho do mês */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '3px solid #1d4ed8', paddingBottom: '12px', marginBottom: '24px',
      }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a', textTransform: 'capitalize' }}>
          {monthLabel}
        </div>
        {monthTotal > 0 && (
          <div style={{
            background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px',
            padding: '6px 18px', fontSize: '13px', fontWeight: 700,
          }}>
            Total: R$ {monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>

      {/* Cards das semanas */}
      {weeks.map((week, wi) => {
        const prices = priceMap[week.weekNumber] || {};
        const depAirlineKey = week.departureAirline?.toLowerCase() ?? '';
        const retAirlineKey = week.returnAirline?.toLowerCase() ?? '';
        const depPrice = depAirlineKey && prices[depAirlineKey] ? parseFloat(prices[depAirlineKey]) : null;
        const depAirlineInfo = AIRLINE_COLORS[depAirlineKey];
        const retAirlineInfo = AIRLINE_COLORS[retAirlineKey];

        return (
          <div
            key={week.weekNumber}
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: wi < weeks.length - 1 ? '16px' : '0',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header do card */}
            <div style={{
              background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)',
              padding: '10px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                Semana {week.weekNumber}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                {week.departureDate} → {week.returnDate}
              </div>
              {depPrice !== null && (
                <div style={{
                  background: '#34d399', color: '#064e3b',
                  borderRadius: '6px', padding: '3px 12px',
                  fontSize: '13px', fontWeight: 800,
                }}>
                  R$ {depPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>

            {/* Corpo: IDA e VOLTA lado a lado */}
            <div style={{ display: 'flex' }}>
              {/* IDA */}
              <div style={{ flex: 1, padding: '16px 20px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '1px', color: '#1d4ed8', marginBottom: '10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>✈</span> IDA
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {week.departureAirline && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', width: '90px', verticalAlign: 'middle' }}>Companhia</td>
                        <td style={{ paddingBottom: '6px', verticalAlign: 'middle' }}>
                          {depAirlineInfo ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: depAirlineInfo.bg,
                              color: depAirlineInfo.text,
                              borderRadius: '4px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              minWidth: '52px',
                              textAlign: 'center',
                            }}>{depAirlineInfo.label}</span>
                          ) : week.departureAirline}
                        </td>
                      </tr>
                    )}
                    {week.departureFlightNumber && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Voo</td>
                        <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', verticalAlign: 'middle' }}>
                          {week.departureFlightNumber}
                        </td>
                      </tr>
                    )}
                    {week.departureLocator && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Localizador</td>
                        <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '1px', verticalAlign: 'middle' }}>
                          {week.departureLocator}
                        </td>
                      </tr>
                    )}
                    {week.departureFlightDatetime && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Data/Hora</td>
                        <td style={{ paddingBottom: '6px', color: '#1e293b', verticalAlign: 'middle' }}>
                          {formatDatetime(week.departureFlightDatetime)}
                        </td>
                      </tr>
                    )}
                    {week.departureAirport && (
                      <tr>
                        <td style={{ color: '#64748b', verticalAlign: 'middle' }}>Aeroporto</td>
                        <td style={{ fontWeight: 600, color: '#1e293b', verticalAlign: 'middle' }}>{week.departureAirport}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* VOLTA */}
              <div style={{ flex: 1, padding: '16px 20px' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '1px', color: '#ea580c', marginBottom: '10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>↩</span> VOLTA
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {week.returnAirline && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', width: '90px', verticalAlign: 'middle' }}>Companhia</td>
                        <td style={{ paddingBottom: '6px', verticalAlign: 'middle' }}>
                          {retAirlineInfo ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: retAirlineInfo.bg,
                              color: retAirlineInfo.text,
                              borderRadius: '4px',
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              minWidth: '52px',
                              textAlign: 'center',
                            }}>{retAirlineInfo.label}</span>
                          ) : week.returnAirline}
                        </td>
                      </tr>
                    )}
                    {week.returnFlightNumber && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Voo</td>
                        <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', verticalAlign: 'middle' }}>
                          {week.returnFlightNumber}
                        </td>
                      </tr>
                    )}
                    {week.returnLocator && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Localizador</td>
                        <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '1px', verticalAlign: 'middle' }}>
                          {week.returnLocator}
                        </td>
                      </tr>
                    )}
                    {week.returnFlightDatetime && (
                      <tr>
                        <td style={{ color: '#64748b', paddingBottom: '6px', verticalAlign: 'middle' }}>Data/Hora</td>
                        <td style={{ paddingBottom: '6px', color: '#1e293b', verticalAlign: 'middle' }}>
                          {formatDatetime(week.returnFlightDatetime)}
                        </td>
                      </tr>
                    )}
                    {week.returnAirport && (
                      <tr>
                        <td style={{ color: '#64748b', verticalAlign: 'middle' }}>Aeroporto</td>
                        <td style={{ fontWeight: 600, color: '#1e293b', verticalAlign: 'middle' }}>{week.returnAirport}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {/* Rodapé da página */}
      <div style={{
        marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '12px',
        fontSize: '10px', color: '#94a3b8', textAlign: 'center',
      }}>
        Smart Fly • Relatório gerado automaticamente • {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}

// ─── Botão de exportação ─────────────────────────────────────────────────────
export function ExportPdfButton({ weeksData, priceMap, totalInvested }: FlightPdfExportProps) {
  const [exporting, setExporting] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  const issued = weeksData.filter(w => w.isTicketIssued && !w.isDeleted);

  // Agrupar por mês
  const byMonth: Record<string, WeekData[]> = {};
  issued.forEach(w => {
    const key = getMonthLabel(w.departureDate);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(w);
  });
  const months = Object.entries(byMonth);

  const handleExport = async () => {
    if (!coverRef.current) return;
    setExporting(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

      // Função auxiliar: renderiza um elemento como imagem e adiciona ao PDF
      const addElementToPdf = async (el: HTMLDivElement, isFirst: boolean) => {
        if (!isFirst) pdf.addPage();

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          width: 794,
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        // Calcular dimensões mantendo proporção dentro do A4
        const ratio = pdfW / (canvasW / 2);
        const imgH = (canvasH / 2) * ratio;

        if (imgH <= pdfH) {
          // Cabe em uma página
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, imgH);
        } else {
          // Conteúdo maior que A4: fatiar verticalmente
          let yOffset = 0;
          let firstSlice = true;
          while (yOffset < imgH) {
            if (!firstSlice) pdf.addPage();
            firstSlice = false;

            const sliceHeightPx = Math.round((pdfH / ratio) * 2);
            const sliceYPx = Math.round((yOffset / ratio) * 2);
            const actualSliceH = Math.min(sliceHeightPx, canvasH - sliceYPx);

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasW;
            sliceCanvas.height = actualSliceH;
            const ctx = sliceCanvas.getContext('2d')!;
            ctx.drawImage(canvas, 0, sliceYPx, canvasW, actualSliceH, 0, 0, canvasW, actualSliceH);

            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            const sliceHMm = (actualSliceH / 2) * ratio;
            pdf.addImage(sliceData, 'JPEG', 0, 0, pdfW, sliceHMm);
            yOffset += pdfH;
          }
        }
      };

      // 1. Capa
      await addElementToPdf(coverRef.current, true);

      // 2. Uma página por mês
      for (let i = 0; i < months.length; i++) {
        const ref = monthRefs.current[i];
        if (ref) await addElementToPdf(ref, false);
      }

      pdf.save('SmartFly-Passagens-2026.pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        disabled={exporting || issued.length === 0}
        title={issued.length === 0 ? 'Nenhum bilhete emitido para exportar' : 'Exportar relatório em PDF'}
        className="bg-white/10 border-white text-white hover:bg-white hover:text-blue-700 transition-all"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span className="hidden sm:inline ml-1">PDF</span>
      </Button>

      {/* Containers ocultos para renderização — um por seção */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1, pointerEvents: 'none' }}>
        {/* Capa */}
        <div ref={coverRef}>
          <CoverPage issued={issued} totalInvested={totalInvested} />
        </div>

        {/* Uma div por mês */}
        {months.map(([monthLabel, weeks], i) => (
          <div key={monthLabel} ref={el => { monthRefs.current[i] = el; }}>
            <MonthPage monthLabel={monthLabel} weeks={weeks} priceMap={priceMap} />
          </div>
        ))}
      </div>
    </>
  );
}
