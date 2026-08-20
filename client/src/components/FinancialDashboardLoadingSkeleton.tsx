import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Mantém a estrutura espacial da aba financeira enquanto os dados anuais carregam. */
export function FinancialDashboardLoadingSkeleton() {
  return (
    <section
      role="status"
      aria-label="Carregando dados financeiros"
      aria-busy="true"
      className="space-y-6 sm:space-y-10"
    >
      <span className="sr-only">Carregando dados financeiros...</span>

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="min-h-32 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="flex w-full gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800 sm:w-80">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-2 h-3 w-36" />
          <div className="mt-6 flex h-52 items-end gap-3">
            {[36, 58, 43, 74, 52, 88, 64, 46].map((height, index) => (
              <Skeleton
                key={index}
                className="flex-1 rounded-t-md"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-52" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-4/5" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-3 w-64 max-w-full" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map(row => (
            <Skeleton key={row} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
