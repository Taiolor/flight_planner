import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  RefreshCw,
  Ticket,
  WalletCards,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusPill, type StatusPillTone } from "@/components/StatusPill";
import type { DecisionItem, DecisionTrip } from "@/lib/decisionCenter";

type DecisionCenterProps = {
  items: DecisionItem[];
  nextTrip: DecisionTrip | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onOpenManagementWeek: (weekNumber: number) => void;
  onOpenCalendarWeek: (weekNumber: number) => void;
  metrics: {
    issuedCount: number;
    pendingCount: number;
    annualTotal: string;
    averageTrip: string;
  };
};

const severityPresentation: Record<DecisionItem["severity"], { label: string; tone: StatusPillTone }> = {
  critical: { label: "Crítico", tone: "cancelled" },
  warning: { label: "Atenção", tone: "warning" },
  info: { label: "Planejamento", tone: "navy" },
};

const tripPresentation: Record<DecisionTrip["status"], { label: string; tone: StatusPillTone }> = {
  issued: { label: "Emitido", tone: "success" },
  pending: { label: "Pendente", tone: "warning" },
  rescheduled: { label: "Remarcado", tone: "rescheduled" },
  cancelled: { label: "Cancelado", tone: "cancelled" },
};

/** Síntese operacional da Home: mostra o que requer ação, por que e em qual módulo resolver. */
export function DecisionCenter({
  items,
  nextTrip,
  isLoading,
  hasError,
  onRetry,
  onOpenManagementWeek,
  onOpenCalendarWeek,
  metrics,
}: DecisionCenterProps) {
  const openItem = (item: DecisionItem) => {
    if (item.destination === "management") onOpenManagementWeek(item.weekNumber);
    else onOpenCalendarWeek(item.weekNumber);
  };

  return (
    <section
      aria-labelledby="decision-center-title"
      className="mb-6 overflow-hidden rounded-3xl border border-[#315c99] bg-[#071a36] text-white shadow-xl sm:mb-8"
    >
      <div className="border-b border-white/15 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-200">Camada operacional</p>
            <h2 id="decision-center-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Central de decisão</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">As ações mais relevantes, a próxima viagem e o impacto do planejamento em um único ponto de leitura.</p>
          </div>
          <StatusPill tone="navy" icon={Clock3} className="self-start border-sky-200/40 bg-sky-300/10 text-sky-100">
            {items.length} {items.length === 1 ? "prioridade" : "prioridades"}
          </StatusPill>
        </div>
      </div>

      {hasError ? (
        <div role="alert" className="mx-4 my-4 border border-amber-300/50 bg-amber-50 p-4 text-amber-950 sm:mx-6 sm:my-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><div><p className="font-semibold">A Central não conseguiu atualizar as prioridades.</p><p className="mt-1 text-sm text-amber-900/85">Você pode tentar novamente sem perder o restante da Home.</p></div></div>
            <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center justify-center gap-2 border border-amber-700 bg-white px-3 text-sm font-semibold text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><RefreshCw className="size-4" aria-hidden="true" />Tentar novamente</button>
          </div>
        </div>
      ) : isLoading ? (
        <div aria-busy="true" aria-label="Carregando Central de decisão" className="grid gap-3 px-4 py-4 sm:grid-cols-[1.4fr_1fr] sm:px-6 sm:py-6"><div className="h-40 animate-pulse bg-white/10 motion-reduce:animate-none" /><div className="h-40 animate-pulse bg-white/10 motion-reduce:animate-none" /></div>
      ) : (
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.45fr_.95fr] lg:px-6 lg:py-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-200">Ações de hoje</h3>
            {items.length ? (
              <ol className="mt-3 space-y-2" aria-label="Prioridades operacionais">
                {items.map(item => {
                  const presentation = severityPresentation[item.severity];
                  return <li key={item.id} className="border border-white/15 bg-white/5 p-3 sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusPill tone={presentation.tone} icon={item.severity === "critical" ? AlertTriangle : Ticket}>{presentation.label}</StatusPill><p className="font-semibold text-white">{item.title}</p></div><p className="mt-2 text-sm leading-relaxed text-slate-200">{item.reason}</p></div><button type="button" onClick={() => openItem(item)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-sky-200/50 bg-sky-300/10 px-3 text-sm font-semibold text-sky-50 hover:bg-sky-300/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><span>{item.actionLabel}</span><ArrowRight className="size-4" aria-hidden="true" /></button></div></li>;
                })}
              </ol>
            ) : <div className="mt-3 border border-white/15 bg-white/5 p-4 text-sm text-slate-200"><CircleCheck className="mr-2 inline size-4 text-emerald-300" aria-hidden="true" />Nenhuma pendência operacional requer atenção imediata.</div>}
          </div>
          <div className="border border-white/15 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold uppercase tracking-wider text-sky-200">Próxima viagem</h3>{nextTrip && <StatusPill tone={tripPresentation[nextTrip.status].tone}>{tripPresentation[nextTrip.status].label}</StatusPill>}</div>
            {nextTrip ? <><p className="mt-4 text-2xl font-bold text-white">Semana {nextTrip.weekNumber}</p><p className="mt-1 text-sm font-semibold text-sky-100">{nextTrip.route}</p><p className="mt-3 text-sm leading-relaxed text-slate-200">{nextTrip.departureDate} → {nextTrip.returnDate}{nextTrip.airline ? ` · ${nextTrip.airline}` : ""}</p><button type="button" onClick={() => onOpenCalendarWeek(nextTrip.weekNumber)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><CalendarDays className="size-4" aria-hidden="true" />Abrir no Calendário</button></> : <p className="mt-4 text-sm leading-relaxed text-slate-200">Não há uma viagem futura registrada para o exercício selecionado.</p>}
          </div>
        </div>
      )}

      <div className="grid gap-3 border-t border-white/15 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <MetricCard variant="transparent" title="Emitidos" value={String(metrics.issuedCount)} subtitle="bilhetes no exercício" icon={CircleCheck} accent="green" className="border border-white/10 bg-white/5 p-3 text-left" />
        <MetricCard variant="transparent" title="Pendentes" value={String(metrics.pendingCount)} subtitle="semanas sem emissão" icon={Ticket} accent="amber" className="border border-white/10 bg-white/5 p-3 text-left" />
        <MetricCard variant="transparent" title="Investido" value={metrics.annualTotal} subtitle="total emitido" icon={WalletCards} accent="navy" className="border border-white/10 bg-white/5 p-3 text-left" />
        <MetricCard variant="transparent" title="Média" value={metrics.averageTrip} subtitle="por viagem emitida" icon={Clock3} accent="violet" className="border border-white/10 bg-white/5 p-3 text-left" />
      </div>
    </section>
  );
}
