/**
 * Calendar helper — gera links para eventos de voo em Google Calendar e Outlook.
 * Espelhado do client/src/lib/calendarHelper.ts para uso no servidor.
 */

/** Mapa de códigos IATA das companhias aéreas */
const airlineIataCodes: Record<string, string> = {
  latam: "LA",
  gol: "G3",
  azul: "AD",
  avianca: "AV",
  onhappy: "OH",
};

/** Formata data ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY) */
export function formatDateToBrazilian(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** Constrói URL de rastreamento de voo no Google */
export function buildFlightTrackUrl(
  airline: string,
  flightNumber: string,
  departureAirport: string,
  arrivalAirport: string,
  flightDatetime: string
): string {
  const iata =
    airlineIataCodes[airline.toLowerCase()] ??
    airline.toUpperCase().slice(0, 2);
  // Extrair apenas os dígitos do número do voo e pegar os últimos 4
  const allDigits = flightNumber.replace(/[^0-9]/g, "");
  const digits = allDigits.slice(-4).padStart(4, "0");
  // Extrair data no formato YYYY-MM-DD
  const date = flightDatetime.slice(0, 10);
  const query = `${iata}+flight+${digits}+from+${departureAirport.toUpperCase()}+to+${arrivalAirport.toUpperCase()},+${date}`;
  return `https://www.google.com/search?q=${query}`;
}

export interface CalendarEventParams {
  title: string; // ex: "✈️ Voo IDA LA3045 — LATAM Airlines"
  flightDatetime: string; // ISO local "YYYY-MM-DDTHH:mm"
  location: string; // ex: "Aeroporto de Guarulhos (GRU)"
  description: string; // ex: "Localizador: ABC123\nCompanhia: LATAM"
  leadMinutes?: number; // antecedência em minutos antes do voo (padrão: 120)
}

/** Formata data para o formato Google/Outlook: YYYYMMDDTHHmmss */
function toCalendarDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    "00"
  );
}

/**
 * Retorna os horários do evento:
 *   start = horário do voo - antecedência (leadMinutes)
 *   end   = horário do voo + duração do voo (durationMinutes)
 */
function getEventTimes(
  flightDatetime: string,
  leadMinutes: number = 120,
  durationMinutes: number = 75
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
  durationMinutes?: number
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const dur = durationMinutes ?? 75;
  const { start, end } = getEventTimes(params.flightDatetime, lead, dur);
  const fmt = toCalendarDate;
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
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
  durationMinutes?: number
): string {
  const lead = leadMinutes ?? params.leadMinutes ?? 120;
  const dur = durationMinutes ?? 75;
  const { start, end } = getEventTimes(params.flightDatetime, lead, dur);
  const base =
    "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent";
  const query = new URLSearchParams({
    subject: params.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: params.description,
    location: params.location,
  });
  return `${base}&${query.toString()}`;
}

/** Mapa de aeroportos para nomes completos */
export const airportNames: Record<string, string> = {
  GRU: "Aeroporto Internacional de Guarulhos (GRU)",
  CGH: "Aeroporto de Congonhas (CGH)",
  VCP: "Aeroporto Internacional de Viracopos (VCP)",
  NVT: "Aeroporto Internacional de Navegantes (NVT)",
  JOI: "Aeroporto de Joinville (JOI)",
};

/**
 * Endereços completos dos aeroportos para uso no campo de localização
 * dos eventos de calendário (Google Calendar, Outlook, .ics).
 */
export const airportAddresses: Record<string, string> = {
  GRU: "Aeroporto Internacional de Guarulhos (GRU) — Rod. Hélio Smidt, s/nº, Cumbica, Guarulhos - SP, CEP 07190-100",
  CGH: "Aeroporto de Congonhas (CGH) — Av. Washington Luís, s/nº, Vila Congonhas, São Paulo - SP, CEP 04626-911",
  VCP: "Aeroporto Internacional de Viracopos (VCP) — Rod. Santos Dumont, km 66, Campinas - SP, CEP 13055-900",
  NVT: "Aeroporto Internacional de Navegantes - Ministro Victor Konder (NVT) — Rua Osmar Gaya, 1297, Meia Praia, Navegantes - SC, CEP 88372-900",
  JOI: "Aeroporto de Joinville - Lauro Carneiro de Loyola (JOI) — Rua Araranguá, 2011, América, Joinville - SC, CEP 89204-000",
};

/** Mapa de companhias para nomes completos */
export const airlineNames: Record<string, string> = {
  latam: "LATAM Airlines",
  gol: "Gol Linhas Aéreas",
  azul: "Azul Linhas Aéreas",
};
