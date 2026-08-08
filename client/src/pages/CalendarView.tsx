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
  ChevronDown,
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

interface CalendarViewProps {
  year?: number;
}

const DEFAULT_YEAR = 2026;

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
  // 2027
  "2027-01-01": { name: "Confraternização Universal", type: "national" },
  "2027-02-08": { name: "Carnaval (segunda)", type: "observance" },
  "2027-02-09": { name: "Carnaval (terça)", type: "observance" },
  "2027-02-10": { name: "Quarta-feira de Cinzas", type: "observance" },
  "2027-03-26": { name: "Sexta-feira Santa", type: "national" },
  "2027-03-28": { name: "Páscoa", type: "national" },
  "2027-04-21": { name: "Tiradentes", type: "national" },
  "2027-05-01": { name: "Dia do Trabalho", type: "national" },
  "2027-05-27": { name: "Corpus Christi", type: "national" },
  "2027-09-02": { name: "Aniversário de Blumenau", type: "municipal" },
  "2027-09-07": { name: "Independência do Brasil", type: "national" },
  "2027-10-12": { name: "Nossa Senhora Aparecida", type: "national" },
  "2027-11-02": { name: "Finados", type: "national" },
  "2027-11-15": { name: "Proclamação da República", type: "national" },
  "2027-11-20": { name: "Consciência Negra", type: "national" },
  "2027-12-25": { name: "Natal", type: "national" },
  // 2028
  "2028-01-01": { name: "Confraternização Universal", type: "national" },
  "2028-02-28": { name: "Carnaval (segunda)", type: "observance" },
  "2028-02-29": { name: "Carnaval (terça)", type: "observance" },
  "2028-03-01": { name: "Quarta-feira de Cinzas", type: "observance" },
  "2028-04-14": { name: "Sexta-feira Santa", type: "national" },
  "2028-04-16": { name: "Páscoa", type: "national" },
  "2028-04-21": { name: "Tiradentes", type: "national" },
  "2028-05-01": { name: "Dia do Trabalho", type: "national" },
  "2028-05-18": { name: "Corpus Christi", type: "national" },
  "2028-09-02": { name: "Aniversário de Blumenau", type: "municipal" },
  "2028-09-07": { name: "Independência do Brasil", type: "national" },
  "2028-10-12": { name: "Nossa Senhora Aparecida", type: "national" },
  "2028-11-02": { name: "Finados", type: "national" },
  "2028-11-15": { name: "Proclamação da República", type: "national" },
  "2028-11-20": { name: "Consciência Negra", type: "national" },
  "2028-12-25": { name: "Natal", type: "national" },
  // 2029
  "2029-01-01": { name: "Confraternização Universal", type: "national" },
  "2029-02-12": { name: "Carnaval (segunda)", type: "observance" },
  "2029-02-13": { name: "Carnaval (terça)", type: "observance" },
  "2029-02-14": { name: "Quarta-feira de Cinzas", type: "observance" },
  "2029-03-30": { name: "Sexta-feira Santa", type: "national" },
  "2029-04-01": { name: "Páscoa", type: "national" },
  "2029-04-21": { name: "Tiradentes", type: "national" },
  "2029-05-01": { name: "Dia do Trabalho", type: "national" },
  "2029-06-07": { name: "Corpus Christi", type: "national" },
  "2029-09-02": { name: "Aniversário de Blumenau", type: "municipal" },
  "2029-09-07": { name: "Independência do Brasil", type: "national" },
  "2029-10-12": { name: "Nossa Senhora Aparecida", type: "national" },
  "2029-11-02": { name: "Finados", type: "national" },
  "2029-11-15": { name: "Proclamação da República", type: "national" },
  "2029-11-20": { name: "Consciência Negra", type: "national" },
  "2029-12-25": { name: "Natal", type: "national" },
  // 2030
  "2030-01-01": { name: "Confraternização Universal", type: "national" },
  "2030-03-04": { name: "Carnaval (segunda)", type: "observance" },
  "2030-03-05": { name: "Carnaval (terça)", type: "observance" },
  "2030-03-06": { name: "Quarta-feira de Cinzas", type: "observance" },
  "2030-04-19": { name: "Sexta-feira Santa", type: "national" },
  "2030-04-21": { name: "Páscoa", type: "national" },

  "2030-05-01": { name: "Dia do Trabalho", type: "national" },
  "2030-05-30": { name: "Corpus Christi", type: "national" },
  "2030-09-02": { name: "Aniversário de Blumenau", type: "municipal" },
  "2030-09-07": { name: "Independência do Brasil", type: "national" },
  "2030-10-12": { name: "Nossa Senhora Aparecida", type: "national" },
  "2030-11-02": { name: "Finados", type: "national" },
  "2030-11-15": { name: "Proclamação da República", type: "national" },
  "2030-11-20": { name: "Consciência Negra", type: "national" },
  "2030-12-25": { name: "Natal", type: "national" },
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 10) return null;
  let y: number, m: number, d: number;

  if (dateStr.includes("/")) {
    // DD/MM/YYYY
    d = Number(dateStr.substring(0, 2));
    m = Number(dateStr.substring(3, 5)) - 1;
    y = Number(dateStr.substring(6, 10));
  } else {
    // YYYY-MM-DD
    y = Number(dateStr.substring(0, 4));
    m = Number(dateStr.substring(5, 7)) - 1;
    d = Number(dateStr.substring(8, 10));
  }

  // Criar data em meia-noite local sem problemas de timezone
  const date = new Date(y, m, d, 0, 0, 0, 0);
  return date;
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

    // Adicionar o próprio dia do feriado
    extended.add(toKey(date));

    // Se o feriado cair em um dia de semana (seg-sex), adicionar o final de semana seguinte
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Calcular quantos dias faltam para o sábado
      const daysUntilSaturday = 6 - dayOfWeek;
      const saturday = new Date(date);
      saturday.setDate(saturday.getDate() + daysUntilSaturday);

      // Adicionar sábado e domingo
      extended.add(toKey(saturday));
      const sunday = new Date(saturday);
      sunday.setDate(sunday.getDate() + 1);
      extended.add(toKey(sunday));
    } else if (dayOfWeek === 6) {
      // Se for sábado, adicionar domingo
      const sunday = new Date(date);
      sunday.setDate(sunday.getDate() + 1);
      extended.add(toKey(sunday));
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

import { WeekRow, DayMark } from "@/components/flights/types";
import FlightPopup from "@/components/flights/FlightPopup";
export default function CalendarView({
  year = DEFAULT_YEAR,
}: CalendarViewProps = {}) {
  const weeksQuery = trpc.flights.getWeeks.useQuery();
  const [selectedMark, setSelectedMark] = useState<DayMark | null>(null);
  const [showOnlyHolidaysAndWeekends, setShowOnlyHolidaysAndWeekends] =
    useState(false);
  const [showCupPanel, setShowCupPanel] = useState(() => {
    // Carregar preferência do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showCupPanel");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Salvar preferência ao mudar
  useEffect(() => {
    localStorage.setItem("showCupPanel", JSON.stringify(showCupPanel));
  }, [showCupPanel]);

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
        if (depDate.getFullYear() === year) {
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
        map[key].departureRescheduled = week.departureRescheduled === 1;
      }

      if (retDate) {
        const key = toKey(retDate);
        const isPast = retDate < today;
        if (!map[key])
          map[key] = { departure: false, return: false, isPast, week };
        if (!isOneway) {
          map[key].return = true;
          map[key].returnRescheduled = week.returnRescheduled === 1;
        }
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

  // ⚡ Bolt: Pre-calculate the grid layout for all 12 months once since year is static.
  // Prevents allocating new nested arrays and Date objects 12 times per render cycle.
  const monthGrids = useMemo(() => {
    const grids: (number | null)[][][] = [];
    for (let i = 0; i < 12; i++) grids.push(buildMonthGrid(year, i));
    return grids;
  }, [year]);

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
          <button
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 rounded-sm"
            aria-label="Voltar para a página inicial"
          >
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
          onClick={() => setShowCupPanel((v: boolean) => !v)}
          className="ml-auto flex items-center gap-1 bg-transparent hover:bg-slate-50 border border-slate-300/50 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded transition-all duration-200"
          title={showCupPanel ? "Ocultar Copa 2026" : "Mostrar Copa 2026"}
          aria-label={
            showCupPanel
              ? "Ocultar painel da Copa do Mundo 2026"
              : "Mostrar painel da Copa do Mundo 2026"
          }
          aria-expanded={showCupPanel}
        >
          <span className="text-xs">🇧🇷</span>
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
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Remarcado
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
          <label
            htmlFor="holiday-filter"
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              id="holiday-filter"
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
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showCupPanel ? "max-h-96 py-3" : "max-h-0 py-0"
          }`}
        >
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

                        const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
                          // Verificar se TODOS os voos marcados neste dia são remarcados
                          const allRescheduled =
                            (mark.departure &&
                              mark.departureRescheduled &&
                              !mark.return) ||
                            (mark.return &&
                              mark.returnRescheduled &&
                              !mark.departure) ||
                            (mark.departure &&
                              mark.departureRescheduled &&
                              mark.return &&
                              mark.returnRescheduled);
                          // Verificar se ALGUM voo neste dia é remarcado
                          const anyRescheduled =
                            (mark.departure && mark.departureRescheduled) ||
                            (mark.return && mark.returnRescheduled);

                          if (allRescheduled) {
                            cellBg = "bg-red-500";
                            textColor = "text-white";
                          } else if (anyRescheduled) {
                            cellBg = "bg-red-400";
                            textColor = "text-white";
                          } else {
                            cellBg = mark.isPast
                              ? "bg-slate-500"
                              : "bg-emerald-500";
                            textColor = "text-white";
                          }
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
                              cellBg = "bg-orange-200";
                              textColor = "text-orange-800 font-bold";
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
                          const isBrazilHome =
                            cupMatch.homeTeam === "Brasil" ||
                            cupMatch.homeTeam.includes("Brasil");
                          const opponent = isBrazilHome
                            ? cupMatch.awayTeam
                            : cupMatch.homeTeam;
                          const score =
                            cupMatch.status === "finished"
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
                                {cupMatch.status === "finished"
                                  ? cupMatch.brazilResult === "win"
                                    ? "✓"
                                    : cupMatch.brazilResult === "draw"
                                      ? "—"
                                      : "✗"
                                  : "⚽"}
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
