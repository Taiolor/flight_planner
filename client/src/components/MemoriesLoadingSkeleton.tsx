import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function YearRouteLoadingSkeleton() {
  return (
    <div role="status" aria-label="Carregando rota do ano" aria-busy="true" className="space-y-5">
      <span className="sr-only">Carregando dados da rota do ano...</span>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 bg-white/20" />
        <Skeleton className="h-5 w-5 rounded-full bg-fuchsia-200/35" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl bg-white/30" />
        <Skeleton className="h-0.5 flex-1 bg-fuchsia-200/30" />
        <Skeleton className="h-10 w-10 rounded-2xl bg-fuchsia-200/35" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-3/5 bg-white/20" />
        <Skeleton className="h-8 w-16 bg-cyan-100/25" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl bg-white/15" />
    </div>
  );
}

export function MemoriesMetricsLoadingSkeleton() {
  return (
    <div role="status" aria-label="Carregando indicadores de Memórias" aria-busy="true" className="contents">
      <span className="sr-only">Carregando indicadores de Memórias...</span>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="min-h-28 rounded-2xl border border-white/15 bg-slate-950/40 p-4 shadow-sm backdrop-blur-sm"
        >
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="mt-4 h-8 w-32 bg-white/25" />
          <Skeleton className="mt-3 h-3 w-20 bg-white/15" />
        </div>
      ))}
    </div>
  );
}

export function MemoriesTimelineLoadingSkeleton() {
  return (
    <div role="status" aria-label="Carregando linha do tempo de Memórias" aria-busy="true" className="mt-6 grid gap-5 lg:grid-cols-2">
      <span className="sr-only">Carregando linha do tempo de Memórias...</span>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-sm backdrop-blur-sm"
        >
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="mt-4 h-7 w-3/5 bg-white/25" />
          <Skeleton className="mt-6 h-24 w-full rounded-2xl bg-white/15" />
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-8 flex-1 rounded-xl bg-white/15" />
            <Skeleton className="h-8 w-20 rounded-xl bg-white/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
