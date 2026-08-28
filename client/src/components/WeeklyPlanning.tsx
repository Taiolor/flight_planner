import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight, Plane, Star, Ticket } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import { AirlineBadge } from "@/components/AirlineBadge";
import type { WeeklyWindowPosition } from "@/lib/weeklyPlanningWindow";

export type WeeklyPlanningItem = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  route: string;
  airline: string | null;
  lowestPrice: number | null;
  favorite: boolean;
  temporalPosition: WeeklyWindowPosition;
  status: "issued" | "watch" | "pending";
};

type WeeklyPlanningProps = {
  year: number;
  items: WeeklyPlanningItem[];
  hideValues: boolean;
  onToggleFavorite?: (weekNumber: number) => void;
};

const statusCopy = {
  issued: { label: "Emitido", className: "border-emerald-200/50 bg-emerald-300/15 text-emerald-100" },
  watch: { label: "Acompanhar preço", className: "border-amber-200/50 bg-amber-300/15 text-amber-100" },
  pending: { label: "Pendente", className: "border-white/30 bg-white/10 text-sky-100" },
} as const;

const temporalCopy: Record<WeeklyWindowPosition, string> = {
  previous: "Semana anterior",
  current: "Semana atual",
  next: "Próxima semana",
};

function formatDateRange(departureDate: string, returnDate: string) {
  if (!departureDate && !returnDate) return "Datas a definir";
  if (!returnDate || departureDate === returnDate) return departureDate;
  return `${departureDate} — ${returnDate}`;
}

function parseBrazilianDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function MonthPreview({ departureDate, returnDate }: Pick<WeeklyPlanningItem, "departureDate" | "returnDate">) {
  const departure = parseBrazilianDate(departureDate);
  const returnTrip = parseBrazilianDate(returnDate);
  if (!departure) return null;

  const year = departure.getFullYear();
  const month = departure.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const highlighted = new Set([departure.getDate()]);
  if (returnTrip && returnTrip.getFullYear() === year && returnTrip.getMonth() === month) {
    highlighted.add(returnTrip.getDate());
  }

  return (
    <div
      className="w-[104px] shrink-0 rounded-lg border border-white/15 bg-white/10 p-2"
      aria-label={`Prévia de ${departure.toLocaleDateString("pt-BR", { month: "long" })}`}
    >
      <div className="mb-1 text-center text-[9px] font-bold capitalize text-sky-100">
        {departure.toLocaleDateString("pt-BR", { month: "short" })}
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[8px] leading-3 text-slate-300">
        {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          return (
            <span key={day} className={highlighted.has(day) ? "rounded-sm bg-sky-300 font-bold text-slate-950" : ""}>
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Acesso operacional compacto às próximas semanas relevantes do planejamento. */
export function WeeklyPlanning({ year, items, hideValues, onToggleFavorite = () => {} }: WeeklyPlanningProps) {
  return (
    <section className="mb-6 sm:mb-10" aria-labelledby="weekly-planning-title">
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Operação diária</p>
          <h2 id="weekly-planning-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">Planejamento por semanas</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Próximos bilhetes e atividades do exercício {year}.</p>
        </div>
        <Link href="/calendar" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800">
          <CalendarDays className="size-4" aria-hidden="true" />
          Ver calendário completo
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item => {
            const status = statusCopy[item.status];
            return (
              <article
                key={item.weekNumber}
                data-flight-card="weekly"
                className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e] p-4 text-white shadow-xl shadow-blue-950/20 transition-[transform,border-color,box-shadow] duration-200 hover:border-sky-200/50 hover:shadow-2xl hover:shadow-blue-950/30 motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
              >
                <button
                  type="button"
                  aria-pressed={item.favorite}
                  aria-label={item.favorite ? `Remover semana ${item.weekNumber} dos favoritos` : `Favoritar semana ${item.weekNumber}`}
                  onClick={() => onToggleFavorite(item.weekNumber)}
                  className={`absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${item.favorite ? "bg-amber-300/20 text-amber-100" : "text-sky-100 hover:bg-white/15 hover:text-amber-100"}`}
                >
                  <Star className={`size-4 ${item.favorite ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
                <Link href={`/calendar?week=${item.weekNumber}`} aria-label={`Abrir semana ${item.weekNumber} no Calendário`} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <div className="flex items-start justify-between gap-3 pr-10">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-100">{temporalCopy[item.temporalPosition]}</span>
                      <span className="mt-1 block text-xs font-medium text-sky-200">Semana {item.weekNumber}</span>
                      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-white transition-colors duration-200 group-hover:text-sky-100 motion-reduce:transition-none"><Plane className="size-4 text-sky-200" aria-hidden="true" />{item.route}</p>
                    </div>
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-200">{formatDateRange(item.departureDate, item.returnDate)}</p>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3 text-sm">
                    <div className="min-w-0">
                      <AirlineBadge airline={item.airline} fallback="COMPANHIA A DEFINIR" className="max-w-full" />
                      <span className="mt-1 flex items-center gap-1 font-semibold text-sky-50">
                        <Ticket className="size-3.5 text-sky-200" aria-hidden="true" />
                        {hideValues ? "••••" : item.lowestPrice !== null ? `R$ ${item.lowestPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem cotação"}
                        <ChevronRight className="size-4 text-sky-100 transition-transform duration-200 motion-safe:group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                      </span>
                    </div>
                    <MonthPreview departureDate={item.departureDate} returnDate={item.returnDate} />
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <Link href="/calendar" className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-700 dark:hover:bg-slate-900">
          <CalendarDays className="size-6 text-blue-600 dark:text-blue-300" aria-hidden="true" />
          <span className="mt-2 font-semibold text-slate-800 dark:text-slate-100">Nenhuma semana em acompanhamento</span>
          <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">Selecione semanas ou registre um bilhete no Calendário.</span>
        </Link>
      )}
    </section>
  );
}
