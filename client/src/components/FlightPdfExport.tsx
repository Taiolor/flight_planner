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
  gol: { bg: '#ff6600', text: '#fff', label: 'GOL' },
  azul: { bg: '#1a3c8f', text: '#fff', label: 'AZUL' },
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

function PdfContent({ weeksData, priceMap, totalInvested }: FlightPdfExportProps) {
  // Agrupar semanas emitidas por mês
  const issued = weeksData.filter(w => w.isTicketIssued && !w.isDeleted);

  const byMonth: Record<string, WeekData[]> = {};
  issued.forEach(w => {
    const key = getMonthLabel(w.departureDate);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(w);
  });

  const months = Object.entries(byMonth);

  return (
    <div
      style={{
        fontFamily: 'Roboto, Arial, sans-serif',
        background: '#f8fafc',
        padding: '0',
        width: '794px', // A4 width at 96dpi
      }}
    >
      {/* Capa / Cabeçalho */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0ea5e9 100%)',
          padding: '40px 48px 32px',
          color: '#fff',
          marginBottom: '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>✈</div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>Smart Fly</div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>Relatório de Passagens Aéreas 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Bilhetes Emitidos</div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>{issued.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Investido</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399' }}>
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Média por Viagem</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24' }}>
              R$ {issued.length > 0 ? (totalInvested / issued.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.6 }}>
          Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Meses */}
      {months.map(([monthLabel, weeks], mi) => {
        const monthTotal = weeks.reduce((acc, w) => {
          const prices = priceMap[w.weekNumber];
          if (!prices) return acc;
          const airline = w.departureAirline?.toLowerCase();
          const price = airline && prices[airline] ? parseFloat(prices[airline]) : 0;
          return acc + (isNaN(price) ? 0 : price);
        }, 0);

        return (
          <div key={monthLabel} style={{ pageBreakBefore: mi > 0 ? 'always' : 'auto', padding: '32px 48px' }}>
            {/* Cabeçalho do mês */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '3px solid #1d4ed8', paddingBottom: '12px', marginBottom: '20px',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e3a8a', textTransform: 'capitalize' }}>
                {monthLabel}
              </div>
              {monthTotal > 0 && (
                <div style={{
                  background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px',
                  padding: '6px 16px', fontSize: '13px', fontWeight: 700,
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
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    pageBreakInside: 'avoid',
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
                  <div style={{ display: 'flex', gap: '0' }}>
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
                              <td style={{ color: '#64748b', paddingBottom: '6px', width: '90px' }}>Companhia</td>
                              <td style={{ paddingBottom: '6px' }}>
                                {depAirlineInfo ? (
                                  <span style={{
                                    background: depAirlineInfo.bg, color: depAirlineInfo.text,
                                    borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                                  }}>{depAirlineInfo.label}</span>
                                ) : week.departureAirline}
                              </td>
                            </tr>
                          )}
                          {week.departureFlightNumber && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Voo</td>
                              <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b' }}>
                                {week.departureFlightNumber}
                              </td>
                            </tr>
                          )}
                          {week.departureLocator && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Localizador</td>
                              <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {week.departureLocator}
                              </td>
                            </tr>
                          )}
                          {week.departureFlightDatetime && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Data/Hora</td>
                              <td style={{ paddingBottom: '6px', color: '#1e293b' }}>
                                {formatDatetime(week.departureFlightDatetime)}
                              </td>
                            </tr>
                          )}
                          {week.departureAirport && (
                            <tr>
                              <td style={{ color: '#64748b' }}>Aeroporto</td>
                              <td style={{ fontWeight: 600, color: '#1e293b' }}>{week.departureAirport}</td>
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
                              <td style={{ color: '#64748b', paddingBottom: '6px', width: '90px' }}>Companhia</td>
                              <td style={{ paddingBottom: '6px' }}>
                                {retAirlineInfo ? (
                                  <span style={{
                                    background: retAirlineInfo.bg, color: retAirlineInfo.text,
                                    borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                                  }}>{retAirlineInfo.label}</span>
                                ) : week.returnAirline}
                              </td>
                            </tr>
                          )}
                          {week.returnFlightNumber && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Voo</td>
                              <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b' }}>
                                {week.returnFlightNumber}
                              </td>
                            </tr>
                          )}
                          {week.returnLocator && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Localizador</td>
                              <td style={{ paddingBottom: '6px', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {week.returnLocator}
                              </td>
                            </tr>
                          )}
                          {week.returnFlightDatetime && (
                            <tr>
                              <td style={{ color: '#64748b', paddingBottom: '6px' }}>Data/Hora</td>
                              <td style={{ paddingBottom: '6px', color: '#1e293b' }}>
                                {formatDatetime(week.returnFlightDatetime)}
                              </td>
                            </tr>
                          )}
                          {week.returnAirport && (
                            <tr>
                              <td style={{ color: '#64748b' }}>Aeroporto</td>
                              <td style={{ fontWeight: 600, color: '#1e293b' }}>{week.returnAirport}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Rodapé */}
      <div style={{
        background: '#1e3a8a', color: 'rgba(255,255,255,0.6)',
        padding: '16px 48px', fontSize: '11px', textAlign: 'center',
      }}>
        Smart Fly • Relatório gerado automaticamente • {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}

export function ExportPdfButton({ weeksData, priceMap, totalInvested }: FlightPdfExportProps) {
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / (imgWidth / 2); // scale=2, so divide by 2
      const totalHeightMm = (imgHeight / 2) * ratio;

      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < totalHeightMm) {
        if (pageNum > 0) pdf.addPage();

        // Calcular a fatia da imagem para esta página
        const sliceHeightPx = Math.round((pdfHeight / ratio) * 2); // em pixels do canvas
        const sliceYPx = Math.round((yOffset / ratio) * 2);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = Math.min(sliceHeightPx, imgHeight - sliceYPx);
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, sliceYPx, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height);

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const sliceHeightMm = (sliceCanvas.height / 2) * ratio;

        pdf.addImage(sliceData, 'JPEG', 0, 0, pdfWidth, sliceHeightMm);

        yOffset += pdfHeight;
        pageNum++;
      }

      pdf.save(`SmartFly-Passagens-2026.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const issued = weeksData.filter(w => w.isTicketIssued && !w.isDeleted);

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

      {/* Container oculto para renderização */}
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '794px',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div ref={containerRef}>
          <PdfContent weeksData={weeksData} priceMap={priceMap} totalInvested={totalInvested} />
        </div>
      </div>
    </>
  );
}
