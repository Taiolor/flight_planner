import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Replica o cabeçalho e os cartões de semanas enquanto o planejamento anual é carregado. */
export function FlightQuotesLoadingSkeleton({ year }: { year: number }) {
  return (
    <section
      role="status"
      aria-label={`Carregando cotações de ${year}`}
      aria-busy="true"
      className="animate-pulse"
    >
      <span className="sr-only">Carregando semanas e cotações de {year}...</span>

      <div className="mb-6 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-60 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
          </div>
          <div className="w-full min-w-[180px] space-y-2 sm:w-48">
            <Skeleton className="ml-auto h-4 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="ml-auto h-3 w-40" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-8">
        <div className="mb-4 flex flex-wrap gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              data-testid="quote-week-skeleton"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="h-8 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-44 max-w-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
