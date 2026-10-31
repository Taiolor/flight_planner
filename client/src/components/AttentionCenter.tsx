import React from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  EyeOff,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ATTENTION_DISMISSAL_OPTIONS,
  type AttentionItem,
} from "@/lib/attentionCenter";

type AttentionCenterProps = {
  items: AttentionItem[];
  dismissedItems: AttentionItem[];
  dismissals: Record<string, string>;
  hideValues: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onOpenWeek: (weekNumber: number) => void;
  onDismiss: (itemId: string, durationMs: number, label: string) => void;
  onRestore: (itemId: string) => void;
};

const visualByKind = {
  cancellation: {
    icon: AlertCircle,
    classes: "border-rose-200/50 bg-rose-300/10 text-rose-100",
  },
  deadline: {
    icon: CalendarClock,
    classes: "border-amber-200/50 bg-amber-300/10 text-amber-100",
  },
  price: {
    icon: TrendingUp,
    classes: "border-violet-200/50 bg-violet-300/10 text-violet-100",
  },
} as const;

/** Painel de prioridades de compra, com o mesmo padrão visual da Central de Decisão. */
export function AttentionCenter({
  items,
  dismissedItems,
  dismissals,
  hideValues,
  isOpen,
  onToggle,
  onOpenWeek,
  onDismiss,
  onRestore,
}: AttentionCenterProps) {
  const visibleItems = items.slice(0, 5);
  const visibleDismissedItems = dismissedItems.slice(0, 5);
  const attentionLabel = items.length === 0
    ? "Tudo sob controle"
    : `${items.length} ${items.length === 1 ? "atenção" : "atenções"}`;
  const formatExpiry = (value?: string) =>
    value
      ? new Date(value).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <section
      aria-labelledby="attention-center-title"
      className="mb-4 animate-in fade-in overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a36] via-[#102f61] to-[#17427e] text-white shadow-2xl duration-500 motion-reduce:animate-none sm:mb-8"
    >
      <div className="bg-gradient-to-r from-slate-900 via-[#071a36] to-slate-900 px-4 py-4 transition-colors duration-300 hover:from-slate-800 hover:via-[#0b2349] hover:to-slate-800 motion-reduce:transition-none sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-200">Camada de planejamento</p>
            <h2 id="attention-center-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Central de atenção
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">
              Prioridades de prazo, cancelamento e preço para agir primeiro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            {dismissedItems.length > 0 && (
              <span className="w-fit rounded-full border border-sky-200/40 bg-sky-300/10 px-2.5 py-1 text-xs font-medium text-sky-100">
                {dismissedItems.length} adiado{dismissedItems.length === 1 ? "" : "s"}
              </span>
            )}
            <span className="w-fit rounded-full border border-sky-200/40 bg-sky-300/10 px-2.5 py-1 text-xs font-semibold text-sky-100">
              {attentionLabel}
            </span>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-controls="attention-center-content"
              aria-label={isOpen ? "Recolher Central de atenção" : "Expandir Central de atenção"}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-transparent text-white transition-colors duration-200 hover:bg-white/15 hover:text-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              {isOpen ? <ChevronUp className="size-5" aria-hidden="true" /> : <ChevronDown className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {!isOpen && (
          <div className="mt-3 border-t border-white/15 pt-3 text-sm text-sky-100">
            <p>
              Central recolhida. {items.length === 0
                ? "Nenhuma prioridade requer atenção imediata."
                : `${items.length} ${items.length === 1 ? "atenção aguarda" : "atenções aguardam"} sua revisão.`}
            </p>
            {items[0] && <p className="mt-1 text-slate-200">Em foco: {items[0].title}</p>}
          </div>
        )}
      </div>

      {isOpen && (
        <div id="attention-center-content">
          {visibleItems.length === 0 ? (
            <div className="mx-4 my-4 flex items-start gap-3 border border-white/15 bg-white/5 p-4 text-sm text-slate-200 sm:mx-6 sm:my-6">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <p>Não há compras urgentes, cancelamentos ou preços acima da referência anual para as próximas viagens.</p>
            </div>
          ) : (
            <div className="space-y-2 px-4 py-4 sm:px-6 sm:py-6">
              {visibleItems.map(item => {
                const visual = visualByKind[item.kind];
                const Icon = visual.icon;
                return (
                  <div key={item.id} className="flex flex-col gap-3 border border-white/15 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${visual.classes}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-200">
                          {item.description}
                          {item.price !== undefined && !hideValues && ` Menor valor: R$ ${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                          Urgência {Math.round(item.urgencyScore)}/100
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 border-sky-200/50 bg-sky-300/10 text-sky-50 hover:bg-sky-300/20 hover:text-sky-50 focus-visible:ring-white sm:flex-none"
                        onClick={() => onOpenWeek(item.weekNumber)}
                      >
                        {item.actionLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-1.5 border border-white/25 bg-white/5 text-sky-100 hover:bg-white/10 hover:text-sky-50 focus-visible:ring-white sm:flex-none"
                            aria-label={`Escolher prazo para adiar alerta ${item.title}`}
                          >
                            <EyeOff className="h-4 w-4" />
                            Adiar
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          {ATTENTION_DISMISSAL_OPTIONS.map(option => (
                            <DropdownMenuItem
                              key={option.durationMs}
                              onSelect={() => onDismiss(item.id, option.durationMs, option.label)}
                            >
                              Adiar por {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > visibleItems.length && (
            <p className="border-t border-white/15 px-4 py-3 text-xs text-sky-100 sm:px-6">
              Mostrando as 5 prioridades mais urgentes de {items.length} identificadas.
            </p>
          )}

          {visibleDismissedItems.length > 0 && (
            <div className="border-t border-white/15 bg-white/5 px-4 py-4 sm:px-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-100">Alertas adiados</p>
              <div className="space-y-2">
                {visibleDismissedItems.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 border border-white/15 bg-white/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-200">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-sky-100">Reaparece em {formatExpiry(dismissals[item.id])}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5 border border-white/25 bg-white/5 text-xs text-sky-100 hover:bg-white/10 hover:text-sky-50 focus-visible:ring-white sm:w-auto"
                      onClick={() => onRestore(item.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reativar
                    </Button>
                  </div>
                ))}
              </div>
              {dismissedItems.length > visibleDismissedItems.length && (
                <p className="mt-2 text-xs text-sky-100">Mais {dismissedItems.length - visibleDismissedItems.length} alertas adiados.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
