import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import React, { type ReactNode } from "react";

type PassageManagementFrameProps = {
  allMonthsExpanded: boolean;
  onToggleAll: () => void;
  children: ReactNode;
};

/** Agrupa a operação anual de passagens e centraliza o comando global dos meses. */
export function PassageManagementFrame({
  allMonthsExpanded,
  onToggleAll,
  children,
}: PassageManagementFrameProps) {
  return (
    <section
      aria-labelledby="passage-management-title"
      className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-4 text-white dark:border-slate-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200 ring-1 ring-white/15">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Planejamento anual</p>
              <h2 id="passage-management-title" className="mt-0.5 text-xl font-bold tracking-tight">Gestão de Passagens</h2>
              <p className="mt-1 text-sm text-slate-300">Semanas organizadas de Janeiro a Dezembro para emissão e acompanhamento.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleAll}
            aria-expanded={allMonthsExpanded}
            aria-controls="passage-management-content"
            className="min-h-10 shrink-0 border-white/25 bg-white/10 px-3 text-white hover:bg-white hover:text-slate-900 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {allMonthsExpanded ? <ChevronUp className="mr-2 size-4" /> : <ChevronDown className="mr-2 size-4" />}
            {allMonthsExpanded ? "Recolher todos os meses" : "Expandir todos os meses"}
          </Button>
        </div>
      </div>
      <div id="passage-management-content" className="p-3 sm:p-5">
        <div
          className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-950 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-100"
          aria-label="Legenda: voo cancelado em roxo-escuro"
        >
          <StatusPill tone="cancelled">Cancelado</StatusPill>
          <span className="text-violet-700 dark:text-violet-300">Dias e voos cancelados usam roxo-escuro.</span>
        </div>
        {children}
      </div>
    </section>
  );
}
