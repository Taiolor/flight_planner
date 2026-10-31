import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type HomeInitialLoadingSkeletonProps = {
  year: number;
};

const skeletonClassName = "bg-slate-200/85 dark:bg-slate-700/70 motion-reduce:animate-none";

/** Mantém a hierarquia visual da Home enquanto as consultas iniciais são resolvidas. */
export function HomeInitialLoadingSkeleton({ year }: HomeInitialLoadingSkeletonProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Carregando planejamento de viagens de ${year}`}
      data-testid="home-initial-loading-skeleton"
      className="space-y-5 sm:space-y-7"
    >
      <span className="sr-only">Preparando seu planejamento de viagens.</span>

      <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e] p-4 shadow-xl sm:p-6" aria-hidden="true">
        <Skeleton className="h-6 w-44 bg-white/20 motion-reduce:animate-none" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <Skeleton className="h-3 w-20 bg-white/15 motion-reduce:animate-none" />
              <Skeleton className="h-8 w-16 bg-white/20 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-24 w-full rounded-2xl bg-white/10 motion-reduce:animate-none" />
      </article>

      <article className="overflow-hidden rounded-3xl border border-slate-800 bg-[#071a36] shadow-lg dark:border-slate-700" aria-hidden="true">
        <div className="border-b border-white/10 p-5 sm:p-6">
          <Skeleton className="h-3 w-28 bg-white/15 motion-reduce:animate-none" />
          <Skeleton className="mt-3 h-8 w-56 bg-white/20 motion-reduce:animate-none" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl bg-white/10 motion-reduce:animate-none" />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Skeleton className="h-5 w-28 bg-white/20 motion-reduce:animate-none" />
              <Skeleton className="h-4 w-5/6 bg-white/10 motion-reduce:animate-none" />
              <Skeleton className="h-10 w-full bg-white/15 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className={`h-3 w-20 ${skeletonClassName}`} />
            <Skeleton className={`mt-3 h-6 w-32 ${skeletonClassName}`} />
            <Skeleton className={`mt-4 h-16 w-full ${skeletonClassName}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
