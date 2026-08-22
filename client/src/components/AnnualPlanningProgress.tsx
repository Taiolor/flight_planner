import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Pencil,
  Target,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAnnualGoalPace,
  type AnnualGoalProgress,
} from "@/lib/annualEmissionGoal";
import type { AnnualProgress } from "@/lib/annualProgress";

type AnnualPlanningProgressProps = {
  progress: AnnualProgress;
  goal: number;
  goalProgress: AnnualGoalProgress;
  year: number;
  isOpen: boolean;
  onToggle: () => void;
  onShowPending: () => void;
  onSaveGoal: (goal: number) => void;
  comparison: Array<{
    year: number;
    totalWeeks: number;
    issuedWeeks: number;
    pendingWeeks: number;
    completionPercent: number;
    goal: number;
    goalProgress: AnnualGoalProgress;
  }>;
  onSaveComparisonGoal: (year: number, goal: number, totalWeeks: number) => void;
  isComparisonLoading?: boolean;
  today?: Date;
};

export function AnnualPlanningProgress({
  progress,
  goal,
  goalProgress,
  year,
  isOpen,
  onToggle,
  onShowPending,
  onSaveGoal,
  comparison,
  onSaveComparisonGoal,
  isComparisonLoading = false,
  today,
}: AnnualPlanningProgressProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState(String(goal));
  const [editingComparisonYear, setEditingComparisonYear] = useState<number | null>(null);
  const [comparisonGoalDraft, setComparisonGoalDraft] = useState("");

  useEffect(() => setDraftGoal(String(goal)), [goal]);

  const saveGoal = () => {
    onSaveGoal(Number(draftGoal));
    setIsEditingGoal(false);
  };
  const selectedComparison = comparison.find(item => item.year === year);
  const annualPace = getAnnualGoalPace(
    year,
    selectedComparison?.goalProgress.percent ?? goalProgress.percent,
    today
  );

  return (
    <section aria-labelledby="annual-progress-title" className="mb-4 sm:mb-8">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="annual-progress-content"
          className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:hover:bg-slate-700/40"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Planejamento {year}
            </p>
            <h2 id="annual-progress-title" className="mt-1 text-lg font-bold text-slate-800 sm:text-xl dark:text-slate-100">
              Progresso anual de emissões
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {progress.issuedWeeks} de {goal} emissões da meta anual já foram registradas.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {goalProgress.percent}%
            </span>
            <span className="mb-1 text-xs text-slate-500 dark:text-slate-400">concluído</span>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-slate-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
            )}
          </div>
        </button>

        {isOpen && <div id="annual-progress-content" className="border-t border-slate-100 p-4 sm:p-6 dark:border-slate-700">
        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
          role="progressbar"
          aria-label="Progresso anual de passagens emitidas"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goalProgress.percent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-[width] duration-500"
            style={{ width: `${goalProgress.percent}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-900/50 dark:bg-cyan-950/20">
          <div className="flex min-w-0 items-start gap-2">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                Meta anual: {goal} emiss{goal === 1 ? "ão" : "ões"}
              </p>
              <p className="mt-0.5 text-xs text-cyan-800 dark:text-cyan-200">
                {goalProgress.achieved
                  ? "Meta atingida. Continue registrando as emissões adicionais."
                  : `${goalProgress.percent}% da meta concluída · faltam ${goalProgress.remaining} emiss${goalProgress.remaining === 1 ? "ão" : "ões"}.`}
              </p>
            </div>
          </div>
          {isEditingGoal ? (
            <form
              className="flex w-full gap-2 sm:w-auto"
              onSubmit={event => {
                event.preventDefault();
                saveGoal();
              }}
            >
              <Input
                type="number"
                min={1}
                max={Math.max(1, progress.totalWeeks)}
                value={draftGoal}
                onChange={event => setDraftGoal(event.target.value)}
                aria-label="Meta anual de emissões"
                className="h-9 w-full bg-white sm:w-20 dark:bg-slate-900"
              />
              <Button type="submit" size="sm">Salvar</Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftGoal(String(goal));
                  setIsEditingGoal(false);
                }}
              >
                Cancelar
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 sm:w-auto"
              onClick={() => setIsEditingGoal(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Ajustar meta
            </Button>
          )}
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

        <section
          aria-labelledby="annual-comparison-title"
          className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900/30"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3
                id="annual-comparison-title"
                className="text-sm font-bold text-slate-800 dark:text-slate-100"
              >
                Comparativo entre anos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emissões e pendências por exercício de planejamento.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {comparison.length} exercício{comparison.length === 1 ? "" : "s"}
            </span>
          </div>

          {isComparisonLoading ? (
            <div className="mt-4 space-y-3" aria-label="Carregando comparativo anual">
              {[1, 2, 3].map(item => (
                <div key={item} className="animate-pulse space-y-1.5">
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {comparison.map(item => {
                const isSelectedYear = item.year === year;
                const isEditingComparisonGoal = editingComparisonYear === item.year;
                return (
                  <div
                    key={item.year}
                    className={`rounded-md px-2.5 py-2 ${
                      isSelectedYear
                        ? "bg-white shadow-sm ring-1 ring-emerald-200 dark:bg-slate-800 dark:ring-emerald-900"
                        : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {item.year}
                        {isSelectedYear && (
                          <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Atual
                          </span>
                        )}
                      </p>
                      {isEditingComparisonGoal ? (
                        <form
                          className="flex items-center gap-1.5"
                          onSubmit={event => {
                            event.preventDefault();
                            onSaveComparisonGoal(
                              item.year,
                              Number(comparisonGoalDraft),
                              item.totalWeeks
                            );
                            setEditingComparisonYear(null);
                          }}
                        >
                          <Input
                            type="number"
                            min={1}
                            max={Math.max(1, item.totalWeeks)}
                            value={comparisonGoalDraft}
                            onChange={event => setComparisonGoalDraft(event.target.value)}
                            aria-label={`Meta de emissões para ${item.year}`}
                            className="h-7 w-16 bg-white text-xs dark:bg-slate-900"
                          />
                          <Button type="submit" size="sm" className="h-7 px-2 text-xs">Salvar</Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setEditingComparisonYear(null)}
                          >
                            Cancelar
                          </Button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <p>
                            {item.goal === 0
                              ? "Ainda não iniciado"
                              : `${item.issuedWeeks}/${item.goal} meta · ${item.goalProgress.percent}% · faltam ${item.goalProgress.remaining}`}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComparisonYear(item.year);
                              setComparisonGoalDraft(String(item.goal));
                            }}
                            aria-label={`Ajustar meta de ${item.year}`}
                            className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                      role="progressbar"
                      aria-label={`Progresso da meta de emissões em ${item.year}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.goalProgress.percent}
                    >
                      <div
                        className={`h-full rounded-full ${
                          isSelectedYear ? "bg-emerald-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${item.goalProgress.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isComparisonLoading && selectedComparison && (
            <div className="mt-4 rounded-md border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-100">
                    Tendência de emissões versus meta
                  </p>
                  <p className="mt-0.5 text-xs text-cyan-800 dark:text-cyan-200">
                    {annualPace.label}
                  </p>
                  <div
                    className="relative mt-2 h-2 overflow-hidden rounded-full bg-cyan-100 dark:bg-cyan-950"
                    role="progressbar"
                    aria-label={`Tendência da meta anual em ${year}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={selectedComparison.goalProgress.percent}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{ width: `${selectedComparison.goalProgress.percent}%` }}
                    />
                    {annualPace.expectedPercent !== null && (
                      <span
                        className="absolute inset-y-0 w-0.5 bg-slate-900/70 dark:bg-white/80"
                        style={{ left: `${annualPace.expectedPercent}%` }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {annualPace.expectedPercent !== null && (
                    <p className="mt-1 text-[11px] text-cyan-800 dark:text-cyan-200">
                      {selectedComparison.goalProgress.percent}% emitido · ritmo esperado até hoje: {annualPace.expectedPercent}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {progress.pendingWeeks > 0 && (
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onShowPending}>
              Ver semanas pendentes
            </Button>
          </div>
        )}
        </div>}
      </Card>
    </section>
  );
}
