import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock3,
  CloudRain,
  RefreshCw,
  Ticket,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusPill, type StatusPillTone } from "@/components/StatusPill";
import type { DecisionItem, DecisionTrip } from "@/lib/decisionCenter";

type DecisionCenterProps = {
  items: DecisionItem[];
  secondaryItems: DecisionItem[];
  isExpanded: boolean;
  isPinned: boolean;
  secondaryQueueOpen: boolean;
  nextTrip: DecisionTrip | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onToggleExpanded: () => void;
  onTogglePinned: () => void;
  onToggleSecondaryQueue: () => void;
  onAdjustRelevance: (weekNumber: number, direction: "raise" | "lower") => void;
  onOpenManagementWeek: (weekNumber: number) => void;
  onOpenCalendarWeek: (weekNumber: number) => void;
  metrics: { issuedCount: number; pendingCount: number; annualTotal: string; averageTrip: string };
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

function formatPrice(price: number | null) {
  return price === null
    ? "Preço não registrado"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}

type ItemRowProps = {
  item: DecisionItem;
  onOpen: (item: DecisionItem) => void;
  onAdjustRelevance: (weekNumber: number, direction: "raise" | "lower") => void;
};

function DecisionItemRow({ item, onOpen, onAdjustRelevance }: ItemRowProps) {
  const presentation = severityPresentation[item.severity];
  const StatusIcon = item.kind === "weather"
    ? CloudRain
    : item.severity === "critical"
      ? AlertTriangle
      : Ticket;
  const variationLabel = item.priceVariationPercent === null
    ? "sem referência anual suficiente"
    : `${item.priceVariationPercent >= 0 ? "+" : ""}${item.priceVariationPercent}% vs. referência anual`;
  const TrendIcon = item.priceVariationPercent !== null && item.priceVariationPercent < 0 ? TrendingDown : TrendingUp;
  const adjustmentLabel = item.manualAdjustment === 0
    ? "Prioridade automática"
    : `Ajuste manual ${item.manualAdjustment > 0 ? "+" : ""}${item.manualAdjustment}`;

  return (
    <li className="border border-white/15 bg-white/5 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={presentation.tone} icon={StatusIcon}>
              {presentation.label}
            </StatusPill>
            <p className="font-semibold text-white">{item.title}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{item.reason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-sky-100">
            <span className="inline-flex items-center gap-1"><WalletCards className="size-3.5" aria-hidden="true" />{formatPrice(item.price)}</span>
            <span className="inline-flex items-center gap-1"><TrendIcon className="size-3.5" aria-hidden="true" />{variationLabel}</span>
            <span className="text-white/65">{adjustmentLabel}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <button type="button" onClick={() => onOpen(item)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-sky-200/50 bg-sky-300/10 px-3 text-sm font-semibold text-sky-50 hover:bg-sky-300/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span>{item.actionLabel}</span><ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <div className="inline-flex min-h-11 border border-white/20" role="group" aria-label={`Ajustar relevância da semana ${item.weekNumber}`}>
            <button type="button" onClick={() => onAdjustRelevance(item.weekNumber, "raise")} className="inline-flex min-w-11 items-center justify-center border-r border-white/20 text-sky-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`Elevar relevância da semana ${item.weekNumber}`}><ArrowUp className="size-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => onAdjustRelevance(item.weekNumber, "lower")} className="inline-flex min-w-11 items-center justify-center text-sky-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`Reduzir relevância da semana ${item.weekNumber}`}><ArrowDown className="size-4" aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </li>
  );
}

/** Síntese operacional da Home, com sanfona persistente para concentrar ou liberar espaço de leitura. */
export function DecisionCenter({
  items,
  secondaryItems,
  isExpanded,
  secondaryQueueOpen,
  nextTrip,
  isLoading,
  hasError,
  onRetry,
  onToggleExpanded,
  isPinned,
  onTogglePinned,
  onToggleSecondaryQueue,
  onAdjustRelevance,
  onOpenManagementWeek,
  onOpenCalendarWeek,
  metrics,
}: DecisionCenterProps) {
  const openItem = (item: DecisionItem) => {
    if (item.destination === "management") onOpenManagementWeek(item.weekNumber);
    else onOpenCalendarWeek(item.weekNumber);
  };
  const priorityLabel = `${items.length} ${items.length === 1 ? "prioridade" : "prioridades"}`;

  return (
    <section aria-labelledby="decision-center-title" className="mb-6 overflow-hidden rounded-3xl border border-[#315c99] bg-[#071a36] text-white shadow-xl sm:mb-8">
      <div className="border-b border-white/15 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-200">Camada operacional</p>
            <h2 id="decision-center-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Central de decisão</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">As ações mais relevantes, a próxima viagem e o impacto do planejamento em um único ponto de leitura.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <StatusPill tone="navy" icon={Clock3} className="border-sky-200/40 bg-sky-300/10 text-sky-100">{priorityLabel}</StatusPill>
            <button
              type="button"
              onClick={onTogglePinned}
              aria-pressed={isPinned}
              title={isPinned ? "Remover Central do topo da Home" : "Fixar Central no topo da Home"}
              className="inline-flex min-h-11 items-center gap-2 border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isPinned ? "Desafixar do topo" : "Fixar no topo"}
            </button>
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={isExpanded}
              aria-controls="decision-center-content"
              className="inline-flex min-h-11 items-center gap-2 border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isExpanded ? "Recolher central" : "Expandir central"}
              {isExpanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {!isExpanded && (
          <div className="mt-3 border-t border-white/15 pt-3 text-sm text-sky-100">
            <p>Central recolhida. {priorityLabel} aguardam sua revisão.</p>
            {items.length > 0 && (
              <p className="mt-1 text-slate-200">
                Em foco: {items.slice(0, 2).map(item => item.title).join(" · ")}
                {items.length > 2 ? " · …" : ""}
              </p>
            )}
            {nextTrip && <p className="mt-1 text-slate-200">Próxima viagem: Semana {nextTrip.weekNumber} · {nextTrip.departureDate} → {nextTrip.returnDate}</p>}
          </div>
        )}
      </div>

      {isExpanded && (
        <div id="decision-center-content">
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
            <>
              <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1.45fr_.95fr] lg:px-6 lg:py-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-200">Ações de hoje</h3>
                  {items.length ? <ol className="mt-3 space-y-2" aria-label="Prioridades operacionais">{items.map(item => <DecisionItemRow key={item.id} item={item} onOpen={openItem} onAdjustRelevance={onAdjustRelevance} />)}</ol> : <div className="mt-3 border border-white/15 bg-white/5 p-4 text-sm text-slate-200"><CircleCheck className="mr-2 inline size-4 text-emerald-300" aria-hidden="true" />Nenhuma pendência operacional requer atenção imediata.</div>}
                </div>
                <div className="border border-white/15 bg-white/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold uppercase tracking-wider text-sky-200">Próxima viagem</h3>{nextTrip && <StatusPill tone={tripPresentation[nextTrip.status].tone}>{tripPresentation[nextTrip.status].label}</StatusPill>}</div>
                  {nextTrip ? <><p className="mt-4 text-2xl font-bold text-white">Semana {nextTrip.weekNumber}</p><p className="mt-1 text-sm font-semibold text-sky-100">{nextTrip.route}</p><p className="mt-3 text-sm leading-relaxed text-slate-200">{nextTrip.departureDate} → {nextTrip.returnDate}{nextTrip.airline ? ` · ${nextTrip.airline}` : ""}</p><button type="button" onClick={() => onOpenCalendarWeek(nextTrip.weekNumber)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><CalendarDays className="size-4" aria-hidden="true" />Abrir no Calendário</button></> : <p className="mt-4 text-sm leading-relaxed text-slate-200">Não há uma viagem futura registrada para o exercício selecionado.</p>}
                </div>
              </div>
              {secondaryItems.length > 0 && <div className="border-t border-white/15 px-4 py-4 sm:px-6"><button type="button" onClick={onToggleSecondaryQueue} aria-expanded={secondaryQueueOpen} aria-controls="decision-secondary-queue" className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><span><span className="block text-sm font-semibold uppercase tracking-wider text-sky-200">Fila secundária</span><span className="mt-1 block text-sm text-slate-200">{secondaryItems.length} {secondaryItems.length === 1 ? "prioridade disponível" : "prioridades disponíveis"} para revisão posterior.</span></span>{secondaryQueueOpen ? <ChevronUp className="size-5" aria-hidden="true" /> : <ChevronDown className="size-5" aria-hidden="true" />}</button>{secondaryQueueOpen && <ol id="decision-secondary-queue" className="mt-3 space-y-2" aria-label="Fila secundária de prioridades">{secondaryItems.map(item => <DecisionItemRow key={item.id} item={item} onOpen={openItem} onAdjustRelevance={onAdjustRelevance} />)}</ol>}</div>}
              <div className="grid gap-3 border-t border-white/15 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6"><MetricCard variant="transparent" title="Emitidos" value={String(metrics.issuedCount)} subtitle="bilhetes no exercício" icon={CircleCheck} accent="green" className="border border-white/10 bg-white/5 p-3 text-left" /><MetricCard variant="transparent" title="Pendentes" value={String(metrics.pendingCount)} subtitle="semanas sem emissão" icon={Ticket} accent="amber" className="border border-white/10 bg-white/5 p-3 text-left" /><MetricCard variant="transparent" title="Investido" value={metrics.annualTotal} subtitle="total emitido" icon={WalletCards} accent="navy" className="border border-white/10 bg-white/5 p-3 text-left" /><MetricCard variant="transparent" title="Média" value={metrics.averageTrip} subtitle="por viagem emitida" icon={Clock3} accent="violet" className="border border-white/10 bg-white/5 p-3 text-left" /></div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
