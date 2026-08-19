import { CheckCircle2, Clock3, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AnnualProgress } from "@/lib/annualProgress";

type AnnualPlanningProgressProps = {
  progress: AnnualProgress;
  year: number;
  onShowPending: () => void;
};

export function AnnualPlanningProgress({
  progress,
  year,
  onShowPending,
}: AnnualPlanningProgressProps) {
  return (
    <section aria-labelledby="annual-progress-title" className="mb-4 sm:mb-8">
      <Card className="overflow-hidden border-slate-200 bg-white p-4 shadow-md sm:p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Planejamento {year}
            </p>
            <h2 id="annual-progress-title" className="mt-1 text-lg font-bold text-slate-800 sm:text-xl dark:text-slate-100">
              Progresso anual de emissões
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {progress.issuedWeeks} de {progress.totalWeeks} semanas já possuem passagem emitida.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {progress.completionPercent}%
            </span>
            <span className="mb-1 text-xs text-slate-500 dark:text-slate-400">concluído</span>
          </div>
        </div>

        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
          role="progressbar"
          aria-label="Progresso anual de passagens emitidas"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.completionPercent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-[width] duration-500"
            style={{ width: `${progress.completionPercent}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{progress.issuedWeeks}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Emitidas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-950/30">
            <Clock3 className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-lg font-bold text-amber-800 dark:text-amber-200">{progress.pendingWeeks}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Pendentes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-rose-50 px-3 py-3 dark:bg-rose-950/30">
            <TriangleAlert className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-lg font-bold text-rose-800 dark:text-rose-200">{progress.urgentWeeks}</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">Urgentes em 15 dias</p>
            </div>
          </div>
        </div>

        {progress.pendingWeeks > 0 && (
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onShowPending}>
              Ver semanas pendentes
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
