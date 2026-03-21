/**
 * Calendar helper — gera links e arquivos .ics para eventos de voo.
 *
 * Lógica de horários:
 *   - Início do evento: horário do voo MENOS a antecedência configurável (padrão 2h)
 *   - Fim do evento: horário do voo MAIS 1h15 (tempo estimado de voo GRU↔NVT)
 *
 * Exemplo com antecedência de 2h e voo às 10:00:
 *   Evento: 08:00 → 11:15
 */

export interface CalendarEventParams {
  title: string;           // ex: "✈️ Voo IDA LA3045 — LATAM Airlines"
  flightDatetime: string;  // ISO local "YYYY-MM-DDTHH:mm"
  location: string;        // ex: "Aeroporto de Guarulhos (GRU)"
  description: string;     // ex: "Localizador: ABC123\nCompanhia: LATAM"
  leadMinutes?: number;    // antecedência em minutos antes do voo (padrão: 120)
}

/** Opções de antecedência disponíveis para o usuário */
export const LEAD_OPTIONS: { label: string; minutes: number }[] = [
  { label: '1h antes', minutes: 60 },
  { label: '1h30 antes', minutes: 90 },
  { label: '2h antes', minutes: 120 },
  { label: '2h30 antes', minutes: 150 },
  { label: '3h antes', minutes: 180 },
];

/** Duração estimada do voo GRU ↔ NVT em minutos */
const FLIGHT_DURATION_MINUTES = 75; // 1h15

/** Formata data para o formato Google/Outlook: YYYYMMDDTHHmmss */
function toCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    '00'
  );
}

/**
 * Retorna os horários do evento:
 *   start = horário do voo - antecedência (leadMinutes)
 *   end   = horário do voo + duração do voo (1h15)
 */
function getEventTimes(
  flightDatetime: string,
  leadMinutes: number = 120,
): { start: Date; end: Date } {
  const flightDate = new Date(flightDatetime);
  const start = new Date(flightDate.getTime() - leadMinutes * 60 * 1000);
  const end = new Date(flightDate.getTime() + FLIGHT_DURATION_MINUTES * 60 * 1000);
  return { start, end };
}

/** Gera link para Google Calendar */
export function getGoogleCalendarLink(
  params: CalendarEventParams,
  leadMinutes?: number,
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const { start, end } = getEventTimes(params.flightDatetime, lead);
  const fmt = toCalendarDate;
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const query = new URLSearchParams({
    text: params.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: params.description,
    location: params.location,
  });
  return `${base}&${query.toString()}`;
}

/** Gera link para Outlook Web */
export function getOutlookLink(
  params: CalendarEventParams,
  leadMinutes?: number,
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const { start, end } = getEventTimes(params.flightDatetime, lead);
  const base =
    'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
  const query = new URLSearchParams({
    subject: params.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: params.description,
    location: params.location,
  });
  return `${base}&${query.toString()}`;
}

/** Gera conteúdo de arquivo .ics para download */
export function generateICS(
  events: CalendarEventParams[],
  leadMinutes: number = 120,
): string {
  const fmt = toCalendarDate;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planejador de Passagens//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((params, idx) => {
    const lead = leadMinutes ?? params.leadMinutes ?? 120;
    const { start, end } = getEventTimes(params.flightDatetime, lead);
    const uid = `flight-${Date.now()}-${idx}@passagens`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${params.title}`,
      `DESCRIPTION:${params.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${params.location}`,
      'BEGIN:VALARM',
      `TRIGGER:-PT${lead}M`,
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete de voo',
      'END:VALARM',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Dispara download de arquivo .ics no browser */
export function downloadICS(
  events: CalendarEventParams[],
  filename: string,
  leadMinutes: number = 120,
): void {
  const content = generateICS(events, leadMinutes);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Mapa de aeroportos para nomes completos */
export const airportNames: Record<string, string> = {
  GRU: 'Aeroporto Internacional de Guarulhos (GRU)',
  CGH: 'Aeroporto de Congonhas (CGH)',
  VCP: 'Aeroporto Internacional de Viracopos (VCP)',
  NVT: 'Aeroporto de Navegantes (NVT)',
  JOI: 'Aeroporto de Joinville (JOI)',
};

/** Mapa de companhias para nomes completos */
export const airlineNames: Record<string, string> = {
  latam: 'LATAM Airlines',
  gol: 'Gol Linhas Aéreas',
  azul: 'Azul Linhas Aéreas',
};
