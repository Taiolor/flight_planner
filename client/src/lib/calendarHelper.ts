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

/** Opções de duração do voo (tempo de chegada) */
export const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '1h de voo', minutes: 60 },
  { label: '1h15 de voo', minutes: 75 },
  { label: '1h30 de voo', minutes: 90 },
  { label: '1h45 de voo', minutes: 105 },
  { label: '2h de voo', minutes: 120 },
];

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
  durationMinutes: number = 75,
): { start: Date; end: Date } {
  const flightDate = new Date(flightDatetime);
  const start = new Date(flightDate.getTime() - leadMinutes * 60 * 1000);
  const end = new Date(flightDate.getTime() + durationMinutes * 60 * 1000);
  return { start, end };
}

/** Gera link para Google Calendar */
export function getGoogleCalendarLink(
  params: CalendarEventParams,
  leadMinutes?: number,
  durationMinutes?: number,
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const dur = durationMinutes ?? 75;
  const { start, end } = getEventTimes(params.flightDatetime, lead, dur);
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
  durationMinutes?: number,
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const dur = durationMinutes ?? 75;
  const { start, end } = getEventTimes(params.flightDatetime, lead, dur);
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
  durationMinutes: number = 75,
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
    const { start, end } = getEventTimes(params.flightDatetime, lead, durationMinutes);
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
  durationMinutes: number = 75,
): void {
  const content = generateICS(events, leadMinutes, durationMinutes);
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
  NVT: 'Aeroporto Internacional de Navegantes (NVT)',
  JOI: 'Aeroporto de Joinville (JOI)',
};

/**
 * Endereços completos dos aeroportos para uso no campo de localização
 * dos eventos de calendário (Google Calendar, Outlook, .ics).
 */
export const airportAddresses: Record<string, string> = {
  GRU: 'Aeroporto Internacional de Guarulhos (GRU) — Rod. Hélio Smidt, s/nº, Cumbica, Guarulhos - SP, CEP 07190-100',
  CGH: 'Aeroporto de Congonhas (CGH) — Av. Washington Luís, s/nº, Vila Congonhas, São Paulo - SP, CEP 04626-911',
  VCP: 'Aeroporto Internacional de Viracopos (VCP) — Rod. Santos Dumont, km 66, Campinas - SP, CEP 13055-900',
  NVT: 'Aeroporto Internacional de Navegantes - Ministro Victor Konder (NVT) — Rua Osmar Gaya, 1297, Meia Praia, Navegantes - SC, CEP 88372-900',
  JOI: 'Aeroporto de Joinville - Lauro Carneiro de Loyola (JOI) — Rua Araranguá, 2011, América, Joinville - SC, CEP 89204-000',
};

/** Mapa de companhias para nomes completos */
export const airlineNames: Record<string, string> = {
  latam: 'LATAM Airlines',
  gol: 'Gol Linhas Aéreas',
  azul: 'Azul Linhas Aéreas',
};

/**
 * Prefixos IATA das companhias aéreas (2 letras)
 * Usados para montar a URL de rastreamento de voo no Google.
 */
export const airlineIataCodes: Record<string, string> = {
  latam: 'LA',
  gol:   'G3',
  azul:  'AD',
};

/**
 * Monta a URL de rastreamento de voo no Google.
 *
 * Formato:
 *   https://www.google.com/search?q=LA+flight+3045+from+GRU+to+NVT,+2026-03-21
 *
 * @param airline       - chave da companhia (ex: 'latam')
 * @param flightNumber  - número completo do voo (ex: 'LA3045' ou '3045')
 * @param departureAirport - sigla do aeroporto de partida (ex: 'GRU')
 * @param arrivalAirport   - sigla do aeroporto de destino (ex: 'NVT')
 * @param flightDatetime   - ISO local 'YYYY-MM-DDTHH:mm'
 */
export function buildFlightTrackUrl(
  airline: string,
  flightNumber: string,
  departureAirport: string,
  arrivalAirport: string,
  flightDatetime: string,
): string {
  const iata = airlineIataCodes[airline.toLowerCase()] ?? airline.toUpperCase().slice(0, 2);
  // Extrair apenas os dígitos do número do voo (ex: 'LA3045' -> '3045', '3045' -> '3045')
  const digits = flightNumber.replace(/[^0-9]/g, '').padStart(4, '0');
  // Extrair data no formato YYYY-MM-DD
  const date = flightDatetime.slice(0, 10);
  const query = `${iata}+flight+${digits}+from+${departureAirport.toUpperCase()}+to+${arrivalAirport.toUpperCase()},+${date}`;
  return `https://www.google.com/search?q=${query}`;
}
