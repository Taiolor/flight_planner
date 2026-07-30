import { useEffect, useRef } from "react";
import {
  Plane,
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
  buildFlightTrackUrl,
  buildWhatsAppShareUrl,
  CalendarEventParams,
} from "@/lib/calendarHelper";
import { WeekRow, DayMark } from "./types";

// Utils
function extractTime(dt: string | null | undefined): string {
  if (!dt) return "";
  const t = dt.includes("T") ? dt.split("T")[1] : dt.split(" ")[1];
  return t ? t.slice(0, 5) : "";
}

function toIsoDate(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return dateStr;
}

export default function FlightPopup({
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
            {(w.departureRescheduled || w.returnRescheduled) && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                ⚠️ Remarcado
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
