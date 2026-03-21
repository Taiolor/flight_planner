/**
 * Calendar helper — gera links e arquivos .ics para eventos de voo.
 * O evento começa 2h antes do horário do voo (check-in / deslocamento ao aeroporto).
 * Duração padrão do evento: 2h (até o horário do voo).
 */

export interface CalendarEventParams {
  title: string;          // ex: "✈️ Voo LATAM LA3045 — GRU → NVT"
  flightDatetime: string; // ISO local "YYYY-MM-DDTHH:mm"
  location: string;       // ex: "Aeroporto de Guarulhos (GRU)"
  description: string;    // ex: "Localizador: ABC123 | Companhia: LATAM"
}

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

/** Retorna a data de início do evento (2h antes do voo) e fim (horário do voo) */
function getEventTimes(flightDatetime: string): { start: Date; end: Date } {
  const flightDate = new Date(flightDatetime);
  const start = new Date(flightDate.getTime() - 2 * 60 * 60 * 1000); // -2h
  return { start, end: flightDate };
}

/** Gera link para Google Calendar */
export function getGoogleCalendarLink(params: CalendarEventParams): string {
  const { start, end } = getEventTimes(params.flightDatetime);
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
export function getOutlookLink(params: CalendarEventParams): string {
  const { start, end } = getEventTimes(params.flightDatetime);
  // Outlook usa ISO 8601 com timezone local
  const base = 'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent';
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
export function generateICS(events: CalendarEventParams[]): string {
  const fmt = toCalendarDate;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planejador de Passagens//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((params, idx) => {
    const { start, end } = getEventTimes(params.flightDatetime);
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
      'TRIGGER:-PT30M',
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
export function downloadICS(events: CalendarEventParams[], filename: string): void {
  const content = generateICS(events);
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
