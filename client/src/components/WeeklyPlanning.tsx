import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight, Plane, Star, Ticket } from "lucide-react";
import React from "react";
import { Link } from "wouter";

export type WeeklyPlanningItem = {
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  route: string;
  airline: string | null;
  lowestPrice: number | null;
  favorite: boolean;
  status: "issued" | "watch" | "pending";
};

type WeeklyPlanningProps = {
  year: number;
  items: WeeklyPlanningItem[];
  hideValues: boolean;
  onToggleFavorite?: (weekNumber: number) => void;
};

const statusCopy = {
  issued: { label: "Emitido", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  watch: { label: "Acompanhar preço", className: "border-amber-200 bg-amber-50 text-amber-700" },
  pending: { label: "Pendente", className: "border-slate-200 bg-slate-100 text-slate-600" },
} as const;

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
      className="w-[104px] shrink-0 rounded-lg bg-slate-50 p-2 dark:bg-slate-800"
      aria-label={`Prévia de ${departure.toLocaleDateString("pt-BR", { month: "long" })}`}
    >
      <div className="mb-1 text-center text-[9px] font-bold capitalize text-slate-500 dark:text-slate-400">
        {departure.toLocaleDateString("pt-BR", { month: "short" })}
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[8px] leading-3 text-slate-400">
        {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          return (
            <span key={day} className={highlighted.has(day) ? "rounded-sm bg-blue-600 font-bold text-white" : ""}>
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
              <article key={item.weekNumber} className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
                <button
                  type="button"
                  aria-pressed={item.favorite}
                  aria-label={item.favorite ? `Remover semana ${item.weekNumber} dos favoritos` : `Favoritar semana ${item.weekNumber}`}
                  onClick={() => onToggleFavorite(item.weekNumber)}
                  className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${item.favorite ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" : "text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"}`}
                >
                  <Star className={`size-4 ${item.favorite ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
                <Link href={`/calendar?week=${item.weekNumber}`} aria-label={`Abrir semana ${item.weekNumber} no Calendário`} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <div className="flex items-start justify-between gap-3 pr-10">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Semana {item.weekNumber}</span>
                      <p className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Plane className="size-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />{item.route}</p>
                    </div>
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{formatDateRange(item.departureDate, item.returnDate)}</p>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                    <div className="min-w-0">
                      <span className="block truncate text-slate-500 dark:text-slate-400">{item.airline || "Companhia a definir"}</span>
                      <span className="mt-1 flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                        <Ticket className="size-3.5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
                        {hideValues ? "••••" : item.lowestPrice !== null ? `R$ ${item.lowestPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem cotação"}
                        <ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
