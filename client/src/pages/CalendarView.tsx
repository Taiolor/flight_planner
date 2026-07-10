import { useMemo, useState, useEffect, useRef } from "react";
import BrazilWorldCupPanel from "@/components/BrazilWorldCupPanel";
import { brazilMatchByDate } from "@/lib/worldCup2026";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Plane,
  Circle,
  X,
  MessageCircle,
  CalendarPlus,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  getGoogleCalendarLink,
  getOutlookLink,
  downloadICS,
  airportNames,
  airportAddresses,
  airlineNames,
  airlineIataCodes,
  buildFlightTrackUrl,
  buildWhatsAppShareUrl,
  CalendarEventParams,
} from "@/lib/calendarHelper";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const YEAR = 2026;

interface HolidayInfo {
  name: string;
  type: "national" | "municipal" | "state" | "observance";
}

const HOLIDAYS: Record<string, HolidayInfo> = {
  "2026-01-01": { name: "Confraternização Universal", type: "national" },
  "2026-02-16": { name: "Carnaval (segunda)", type: "observance" },
  "2026-02-17": { name: "Carnaval (terça)", type: "observance" },
  "2026-02-18": { name: "Quarta-feira de Cinzas", type: "observance" },
  "2026-04-03": { name: "Sexta-feira Santa", type: "national" },
  "2026-04-05": { name: "Páscoa", type: "national" },
  "2026-04-21": { name: "Tiradentes", type: "national" },
  "2026-05-01": { name: "Dia do Trabalho", type: "national" },
  "2026-06-04": { name: "Corpus Christi", type: "national" },
  "2026-09-02": { name: "Aniversário de Blumenau", type: "municipal" },
  "2026-09-07": { name: "Independência do Brasil", type: "national" },
  "2026-10-12": { name: "Nossa Senhora Aparecida", type: "national" },
  "2026-11-02": { name: "Finados", type: "national" },
  "2026-11-15": { name: "Proclamação da República", type: "national" },
  "2026-11-20": { name: "Consciência Negra", type: "national" },
  "2026-12-25": { name: "Natal", type: "national" },
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 10) return null;
  if (dateStr.includes("/")) {
    // DD/MM/YYYY
    const d = Number(dateStr.substring(0, 2));
    const m = Number(dateStr.substring(3, 5)) - 1;
    const y = Number(dateStr.substring(6, 10));
    return new Date(y, m, d);
  }
  // YYYY-MM-DD
  const y = Number(dateStr.substring(0, 4));
  const m = Number(dateStr.substring(5, 7)) - 1;
  const d = Number(dateStr.substring(8, 10));
  return new Date(y, m, d);
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getExtendedWeekends(
  holidays: Record<string, HolidayInfo>
): Set<string> {
  const extended = new Set<string>();

  Object.entries(holidays).forEach(([dateStr]) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 5) {
      for (let i = 0; i < 4; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    } else if (dayOfWeek === 1) {
      for (let i = -2; i < 2; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    } else if (dayOfWeek === 4) {
      for (let i = 0; i < 5; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    } else if (dayOfWeek === 2) {
      for (let i = -3; i < 2; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    } else if (dayOfWeek === 3) {
      for (let i = -4; i < 2; i++) {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      const friday = new Date(date);
      friday.setDate(friday.getDate() - (dayOfWeek === 0 ? 2 : 1));
      for (let i = 0; i < 4; i++) {
        const d = new Date(friday);
        d.setDate(d.getDate() + i);
        extended.add(toKey(d));
      }
    }
  });

  return extended;
}

/** Extrai HH:mm de um datetime "YYYY-MM-DDTHH:mm" ou "DD/MM/YYYY HH:mm" */
function extractTime(dt: string | null | undefined): string {
  if (!dt) return "";
  const t = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1];
  return t ? t.slice(0, 5) : "";
}

/** Converte "DD/MM/YYYY" para "YYYY-MM-DD" */
function toIsoDate(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
}

type WeekRow = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  isTicketIssued: number | boolean;
  departureAirline?: string | null;
  returnAirline?: string | null;
  departureFlightDatetime?: string | null;
  returnFlightDatetime?: string | null;
  departureAirport?: string | null;
  returnAirport?: string | null;
  departureLocator?: string | null;
  returnLocator?: string | null;
  departureFlightNumber?: string | null;
  returnFlightNumber?: string | null;
  ticketType?: string | null;
  isDeleted?: number | boolean;
};

type DayMark = {
  departure: boolean;
  return: boolean;
  isPast: boolean;
  week: WeekRow;
};

// Popup de detalhes do voo
function FlightPopup({
  mark,
  onClose,
}: {
  mark: DayMark;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const w = mark.week;
  const isOneway = (w.ticketType ?? "roundtrip") === "oneway";

  const depTime = extractTime(w.departureFlightDatetime);
  const retTime = extractTime(w.returnFlightDatetime);
  const depIsoDate = toIsoDate(w.departureDate);
  const retIsoDate = toIsoDate(w.returnDate);

  const depAirlineName =
    airlineNames[(w.departureAirline ?? "").toLowerCase()] ??
    w.departureAirline ??
    "—";
  const retAirlineName =
    airlineNames[(w.returnAirline ?? "").toLowerCase()] ??
    w.returnAirline ??
    "—";

  const depAirport = w.departureAirport || "GRU";
  const retAirport = w.returnAirport || "NVT";

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Fechar com Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Montar eventos de calendário
  const depEvent: CalendarEventParams | null = w.departureFlightDatetime
    ? {
        title: `✈️ Voo IDA ${w.departureFlightNumber ?? ""} — ${depAirlineName}`,
        flightDatetime: w.departureFlightDatetime,
        location:
          airportAddresses[depAirport] ??
          airportNames[depAirport] ??
          depAirport,
        description: [
          `Semana ${w.weekNumber}`,
          `Companhia: ${depAirlineName}`,
          w.departureFlightNumber ? `Voo: ${w.departureFlightNumber}` : "",
          w.departureLocator ? `Localizador: ${w.departureLocator}` : "",
          `Rota: ${depAirport} → ${retAirport}`,
        ]
          .filter(Boolean)
          .join("\n"),
      }
    : null;

  const retEvent: CalendarEventParams | null =
    !isOneway && w.returnFlightDatetime
      ? {
          title: `✈️ Voo VOLTA ${w.returnFlightNumber ?? ""} — ${retAirlineName}`,
          flightDatetime: w.returnFlightDatetime,
          location:
            airportAddresses[retAirport] ??
            airportNames[retAirport] ??
            retAirport,
          description: [
            `Semana ${w.weekNumber}`,
            `Companhia: ${retAirlineName}`,
            w.returnFlightNumber ? `Voo: ${w.returnFlightNumber}` : "",
            w.returnLocator ? `Localizador: ${w.returnLocator}` : "",
            `Rota: ${retAirport} → ${depAirport}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }
      : null;

  const allEvents = [depEvent, retEvent].filter(
    Boolean
  ) as CalendarEventParams[];

  // WhatsApp
  const whatsappUrl = buildWhatsAppShareUrl({
    weekLabel: `Semana ${w.weekNumber}`,
    departureDate: depIsoDate,
    departureTime: depTime,
    departureAirport: depAirport,
    departureAirline: w.departureAirline ?? "",
    departureFlightNumber: w.departureFlightNumber ?? "",
    departureLocator: w.departureLocator ?? "",
    returnDate: isOneway ? "" : retIsoDate,
    returnTime: isOneway ? "" : retTime,
    returnAirport: isOneway ? "" : retAirport,
    returnAirline: isOneway ? "" : (w.returnAirline ?? ""),
    returnFlightNumber: isOneway ? "" : (w.returnFlightNumber ?? ""),
    returnLocator: isOneway ? "" : (w.returnLocator ?? ""),
  });

  // Rastreamento
  const depTrackUrl =
    w.departureFlightNumber && depIsoDate
      ? buildFlightTrackUrl(
          w.departureAirline ?? "",
          w.departureFlightNumber,
          depAirport,
          retAirport,
          depIsoDate + "T00:00"
        )
      : null;
  const retTrackUrl =
    !isOneway && w.returnFlightNumber && retIsoDate
      ? buildFlightTrackUrl(
          w.returnAirline ?? "",
          w.returnFlightNumber,
          retAirport,
          depAirport,
          retIsoDate + "T00:00"
        )
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        ref={popupRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="bg-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">
              Semana {w.weekNumber}
            </span>
            {isOneway && (
              <span className="text-[10px] bg-orange-400 text-white px-2 py-0.5 rounded-full font-semibold">
                Somente Ida
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 rounded-sm"
            title="Fechar"
            aria-label="Fechar calendário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Trecho IDA */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
            <div className="bg-blue-600 px-3 py-1.5 flex items-center gap-1.5">
              <Plane className="w-3 h-3 text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Ida
              </span>
              <span className="ml-auto text-[10px] text-blue-200">
                {depAirport} → {retAirport}
              </span>
            </div>
            <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Data
                </span>
                <span className="text-slate-700 font-medium">
                  {w.departureDate || "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Horário
                </span>
                <span className="text-slate-700 font-medium">
                  {depTime || "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Companhia
                </span>
                <span className="text-slate-700 font-medium">
                  {depAirlineName}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                  Voo
                </span>
                <span className="text-slate-700 font-mono font-medium">
                  {w.departureFlightNumber || "—"}
                </span>
              </div>
              {w.departureLocator && (
                <div className="col-span-2">
                  <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide block">
                    Localizador
                  </span>
                  <span className="text-slate-700 font-mono font-bold tracking-widest">
                    {w.departureLocator}
                  </span>
                </div>
              )}
              {depTrackUrl && (
                <div className="col-span-2">
                  <a
                    href={depTrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Rastrear voo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Trecho VOLTA (só se não for somente ida) */}
          {!isOneway && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 overflow-hidden">
              <div className="bg-orange-500 px-3 py-1.5 flex items-center gap-1.5">
                <Plane className="w-3 h-3 text-white rotate-180" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Volta
                </span>
                <span className="ml-auto text-[10px] text-orange-200">
                  {retAirport} → {depAirport}
                </span>
              </div>
              <div className="px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Data
                  </span>
                  <span className="text-slate-700 font-medium">
                    {w.returnDate || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Horário
                  </span>
                  <span className="text-slate-700 font-medium">
                    {retTime || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Companhia
                  </span>
                  <span className="text-slate-700 font-medium">
                    {retAirlineName}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                    Voo
                  </span>
                  <span className="text-slate-700 font-mono font-medium">
                    {w.returnFlightNumber || "—"}
                  </span>
                </div>
                {w.returnLocator && (
                  <div className="col-span-2">
                    <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-wide block">
                      Localizador
                    </span>
                    <span className="text-slate-700 font-mono font-bold tracking-widest">
                      {w.returnLocator}
                    </span>
                  </div>
                )}
                {retTrackUrl && (
                  <div className="col-span-2">
                    <a
                      href={retTrackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> Rastrear voo
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ações de compartilhamento */}
          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Compartilhar & Agenda
            </span>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              Compartilhar via WhatsApp
            </a>

            {/* Agenda */}
            {allEvents.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {/* Google Calendar */}
                {depEvent && (
                  <a
                    href={getGoogleCalendarLink(depEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-blue-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Google Ida
                  </a>
                )}
                {retEvent && (
                  <a
                    href={getGoogleCalendarLink(retEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-orange-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Google Volta
                  </a>
                )}
                {depEvent && (
                  <a
                    href={getOutlookLink(depEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 transition-colors text-blue-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Outlook Ida
                  </a>
                )}
                {retEvent && (
                  <a
                    href={getOutlookLink(retEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-orange-200 hover:bg-orange-50 transition-colors text-orange-700 text-[11px] font-semibold"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Outlook Volta
                  </a>
                )}
                {/* Download ICS */}
                <button
                  onClick={() =>
                    downloadICS(allEvents, `voo-semana-${w.weekNumber}.ics`)
                  }
                  className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-[11px] font-semibold border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar .ics (Apple / Outros)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const weeksQuery = trpc.flights.getWeeks.useQuery();
  const [selectedMark, setSelectedMark] = useState<DayMark | null>(null);
  const [showOnlyHolidaysAndWeekends, setShowOnlyHolidaysAndWeekends] =
    useState(false);
  const [showCupPanel, setShowCupPanel] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = useMemo(() => toKey(today), [today]);

  const extendedWeekends = useMemo(() => {
    return getExtendedWeekends(HOLIDAYS);
  }, []);

  const {
    markedDays,
    issuedPerMonth,
    futureIssuedCount,
    pastIssuedCount,
    unissuedCount,
  } = useMemo(() => {
    const map: Record<string, DayMark> = {};
    const issuedPerMonth = new Array(12).fill(0);
    let futureIssuedCount = 0;
    let pastIssuedCount = 0;
    let unissuedCount = 0;

    if (!weeksQuery.data) {
      return {
        markedDays: map,
        issuedPerMonth,
        futureIssuedCount,
        pastIssuedCount,
        unissuedCount,
      };
    }

    for (const week of weeksQuery.data as WeekRow[]) {
      if (!week.isTicketIssued) {
        if (!week.isDeleted) {
          unissuedCount++;
        }
        continue;
      }

      const depDate = parseDate(week.departureDate);
      const retDate = parseDate(week.returnDate);
      const isOneway = (week.ticketType ?? "roundtrip") === "oneway";

      if (depDate) {
        if (depDate.getFullYear() === YEAR) {
          issuedPerMonth[depDate.getMonth()]++;
        }
        if (depDate >= today) {
          futureIssuedCount++;
        } else {
          pastIssuedCount++;
        }

        const key = toKey(depDate);
        const isPast = depDate < today;
        if (!map[key])
          map[key] = { departure: false, return: false, isPast, week };
        map[key].departure = true;
        map[key].isPast = isPast;
        map[key].week = week;
      }

      if (!isOneway && retDate) {
        const key = toKey(retDate);
        const isPast = retDate < today;
        if (!map[key])
          map[key] = { departure: false, return: false, isPast, week };
        map[key].return = true;
        if (!map[key].departure) {
          map[key].isPast = isPast;
          map[key].week = week;
        }
      }
    }
    return {
      markedDays: map,
      issuedPerMonth,
      futureIssuedCount,
      pastIssuedCount,
      unissuedCount,
    };
  }, [weeksQuery.data, today]);

  function buildMonthGrid(year: number, month: number): (number | null)[][] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  // ⚡ Bolt: Pre-calculate the grid layout for all 12 months once since YEAR is static.
  // Prevents allocating new nested arrays and Date objects 12 times per render cycle.
  const monthGrids = useMemo(() => {
    const grids: (number | null)[][][] = [];
    for (let i = 0; i < 12; i++) grids.push(buildMonthGrid(YEAR, i));
    return grids;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Popup flutuante */}
      {selectedMark && (
        <FlightPopup
          mark={selectedMark}
          onClose={() => setSelectedMark(null)}
        />
      )}

      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 rounded-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Plane className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">
            Calendário de Voos 2026
          </h1>
        </div>
        <button
          onClick={() => setShowCupPanel(v => !v)}
          className="ml-auto flex items-center gap-1 bg-transparent hover:bg-slate-100/50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-medium px-2 py-1 rounded transition-all duration-200"
          title={showCupPanel ? "Ocultar Copa 2026" : "Mostrar Copa 2026"}
        >
          <span className="text-sm">🇧🇷</span>
          <span className="text-[10px]">{showCupPanel ? "−" : "+"}</span>
        </button>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            Emitido (futuro)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
            Emitido (passado)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-300 inline-block" />
            Feriado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-400 inline-block" />
            ⚽ Brasil
          </span>
        </div>
      </header>

      {/* Filtro */}
      <div className="px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-purple-200/30 sticky top-16 z-9">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyHolidaysAndWeekends}
              onChange={e => setShowOnlyHolidaysAndWeekends(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Mostrar apenas feriados e finais de semana prolongados
            </span>
          </label>
        </div>
      </div>

      {/* Painel Copa Brasil - Sanfona Discreto */}
      <div className="px-4 max-w-7xl mx-auto">
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showCupPanel ? "max-h-96 py-3" : "max-h-0 py-0"
        }`}>
          <BrazilWorldCupPanel />
        </div>
      </div>

      {/* Grade anual */}
      <main className="px-4 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {MONTHS.map((monthName, monthIdx) => {
            const grid = monthGrids[monthIdx];
            const issuedCount = issuedPerMonth[monthIdx];

            return (
              <div
                key={monthIdx}
                className="bg-white rounded-2xl shadow-lg border border-purple-200/30 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-purple-600 to-cyan-500 px-3 py-2 flex items-center justify-between">
                  <span className="text-white font-bold text-sm">
                    {monthName}
                  </span>
                  {issuedCount > 0 && (
                    <span className="flex items-center gap-1 bg-cyan-400/20 border border-cyan-300/40 text-cyan-100 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <Plane className="w-2.5 h-2.5" />
                      {issuedCount} {issuedCount === 1 ? "voo" : "voos"}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-7 bg-blue-50 border-b border-blue-100">
                  {WEEKDAYS.map((wd, i) => (
                    <div
                      key={i}
                      className={`text-center text-[9px] font-bold py-1 ${
                        i === 0
                          ? "text-red-400"
                          : i === 6
                            ? "text-blue-400"
                            : "text-slate-400"
                      }`}
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                <div className="p-1.5">
                  {grid.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-0.5">
                      {week.map((day, di) => {
                        if (!day) return <div key={di} />;

                        const key = `${YEAR}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const mark = markedDays[key];
                        const holiday = HOLIDAYS[key];
                        const cupMatch = brazilMatchByDate[key];
                        const isToday = key === todayKey;
                        const isSunday = di === 0;
                        const isSaturday = di === 6;

                        let cellBg = "";
                        let textColor = isSunday
                          ? "text-red-500"
                          : isSaturday
                            ? "text-blue-500"
                            : "text-slate-700";
                        const isClickable = !!mark;
                        const isExtendedWeekend = extendedWeekends.has(key);

                        // Determinar cor do indicador de feriado baseado no tipo
                        let holidayDotColor = "bg-amber-400";
                        if (holiday) {
                          if (holiday.type === "national")
                            holidayDotColor = "bg-red-500";
                          else if (holiday.type === "municipal")
                            holidayDotColor = "bg-blue-500";
                          else if (holiday.type === "state")
                            holidayDotColor = "bg-green-500";
                          else holidayDotColor = "bg-amber-400";
                        }

                        if (mark) {
                          cellBg = mark.isPast
                            ? "bg-slate-500"
                            : "bg-emerald-500";
                          textColor = "text-white";
                        } else if (isToday) {
                          cellBg = "bg-blue-100";
                          textColor = "text-blue-700 font-bold";
                        } else if (isExtendedWeekend && !mark) {
                          cellBg = "bg-purple-100";
                          textColor = "text-purple-700";
                        }

                        // Destacar dias de jogo do Brasil no calendário
                        if (cupMatch && !mark) {
                          if (cupMatch.status === "finished") {
                            if (cupMatch.brazilResult === "win") {
                              cellBg = "bg-emerald-200";
                              textColor = "text-emerald-800 font-bold";
                            } else if (cupMatch.brazilResult === "draw") {
                              cellBg = "bg-amber-200";
                              textColor = "text-amber-800 font-bold";
                            } else if (cupMatch.brazilResult === "loss") {
                              cellBg = "bg-red-200";
                              textColor = "text-red-800 font-bold";
                            }
                          } else if (cupMatch.status === "upcoming") {
                            cellBg = "bg-yellow-200 ring-1 ring-yellow-400";
                            textColor = "text-yellow-800 font-bold";
                          }
                        }

                        // Construir tooltip com informação do feriado
                        let tooltipText: string | undefined = undefined;
                        if (mark) {
                          tooltipText = `Semana ${mark.week.weekNumber} — clique para detalhes`;
                        } else if (cupMatch) {
                          const isBrazilHome = cupMatch.homeTeam === "Brasil" || cupMatch.homeTeam.includes("Brasil");
                          const opponent = isBrazilHome ? cupMatch.awayTeam : cupMatch.homeTeam;
                          const score = cupMatch.status === "finished"
                            ? ` ${isBrazilHome ? cupMatch.homeScore : cupMatch.awayScore}×${isBrazilHome ? cupMatch.awayScore : cupMatch.homeScore}`
                            : " — Em breve";
                          tooltipText = `⚽ Brasil × ${opponent}${score} (${cupMatch.phaseLabel})`;
                        } else if (holiday) {
                          tooltipText = `${holiday.name} (${holiday.type === "national" ? "Feriado Nacional" : holiday.type === "municipal" ? "Feriado Municipal" : holiday.type === "state" ? "Feriado Estadual" : "Observância"})`;
                        } else if (isExtendedWeekend) {
                          tooltipText = "Fim de semana prolongado";
                        }

                        // Aplicar filtro: mostrar apenas se tem feriado ou fim de semana prolongado
                        if (
                          showOnlyHolidaysAndWeekends &&
                          !holiday &&
                          !isExtendedWeekend
                        ) {
                          return <div key={di} className="aspect-square" />;
                        }

                        return (
                          <div
                            key={di}
                            title={tooltipText}
                            onClick={() => mark && setSelectedMark(mark)}
                            className={`relative flex flex-col items-center justify-center rounded-md aspect-square text-[10px] font-medium select-none transition-all
                              ${cellBg || "hover:bg-slate-50"}
                              ${textColor}
                              ${isToday && !mark ? "ring-1 ring-blue-400" : ""}
                              ${isClickable ? "cursor-pointer hover:brightness-110 hover:scale-110 active:scale-95 shadow-sm" : "cursor-default"}
                            `}
                          >
                            <span>{day}</span>
                            {cupMatch && !mark && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] leading-none">
                                {cupMatch.status === "finished" ? (cupMatch.brazilResult === "win" ? "✓" : cupMatch.brazilResult === "draw" ? "—" : "✗") : "⚽"}
                              </span>
                            )}
                            {holiday && !mark && !cupMatch && (
                              <span
                                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${holidayDotColor}`}
                              />
                            )}
                            {mark && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {mark.departure && (
                                  <span
                                    className={`w-1 h-1 rounded-full ${mark.isPast ? "bg-slate-300" : "bg-white"}`}
                                  />
                                )}
                                {mark.return && (
                                  <span
                                    className={`w-1 h-1 rounded-full ${mark.isPast ? "bg-slate-300" : "bg-emerald-200"}`}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com resumo */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-6 items-center">
          <div className="text-sm text-slate-500 font-medium">Resumo 2026</div>
          {weeksQuery.isLoading ? (
            <span className="text-xs text-slate-400">Carregando...</span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-sm font-semibold text-slate-700">
                  {futureIssuedCount} voos futuros emitidos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500 inline-block" />
                <span className="text-sm font-semibold text-slate-700">
                  {pastIssuedCount} voos passados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-3 h-3 text-slate-300" />
                <span className="text-sm font-semibold text-slate-700">
                  {unissuedCount} semanas sem bilhete
                </span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
