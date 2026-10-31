import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const WEEKDAY_COLUMNS = Array.from({ length: 7 });
const MONTH_CELLS = Array.from({ length: 35 });

/** Mantém a grade anual estável enquanto os voos e trechos adicionais do ano carregam. */
export function CalendarLoadingSkeleton() {
  return (
    <section
      role="status"
      aria-label="Carregando calendário anual"
      aria-busy="true"
      className="min-h-[calc(100vh-4rem)] bg-slate-50"
    >
      <span className="sr-only">Carregando calendário anual...</span>

      <div className="border-b border-purple-200/30 bg-white/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <Skeleton className="h-5 w-72 max-w-full rounded-md" />
          <Skeleton className="h-5 w-48 max-w-full rounded-md" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, monthIndex) => (
            <div
              key={monthIndex}
              data-testid="calendar-month-skeleton"
              className="overflow-hidden rounded-2xl border border-purple-200/30 bg-white shadow-lg"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-600/35 to-cyan-500/35 px-3 py-2">
                <Skeleton className="h-4 w-16 bg-white/55" />
                <Skeleton className="h-4 w-9 rounded-full bg-white/40" />
              </div>
              <div className="grid grid-cols-7 border-b border-blue-100 bg-blue-50 px-1.5 py-1">
                {WEEKDAY_COLUMNS.map((_, index) => (
                  <Skeleton key={index} className="mx-auto h-2 w-2 rounded-full" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 p-1.5">
                {MONTH_CELLS.map((_, index) => (
                  <Skeleton
                    key={index}
                    className="aspect-square w-full rounded-md"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </main>
    </section>
  );
}
