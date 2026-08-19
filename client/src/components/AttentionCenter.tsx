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
import { Card } from "@/components/ui/card";
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
    classes: "border-rose-200 bg-rose-50 text-rose-800",
  },
  deadline: {
    icon: CalendarClock,
    classes: "border-amber-200 bg-amber-50 text-amber-800",
  },
  price: {
    icon: TrendingUp,
    classes: "border-violet-200 bg-violet-50 text-violet-800",
  },
} as const;

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
    <section aria-labelledby="attention-center-title" className="mb-4 sm:mb-8">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="attention-center-content"
          className="flex w-full flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-4 py-4 text-left text-white transition-colors hover:from-slate-800 hover:via-blue-900 hover:to-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="min-w-0">
            <h2 id="attention-center-title" className="text-base font-bold sm:text-lg">
              Central de atenção
            </h2>
            <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
              Prioridades de prazo, cancelamento e preço para agir primeiro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {dismissedItems.length > 0 && (
              <span className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-blue-100">
                {dismissedItems.length} adiado{dismissedItems.length === 1 ? "" : "s"}
              </span>
            )}
            <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
            {items.length === 0
              ? "Tudo sob controle"
              : `${items.length} ${items.length === 1 ? "atenção" : "atenções"}`}
            </span>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
          </div>
        </button>

        {isOpen && <div id="attention-center-content">{visibleItems.length === 0 ? (
          <div className="flex items-start gap-3 p-4 text-sm text-slate-600 sm:p-6 dark:text-slate-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <p>
              Não há compras urgentes, cancelamentos ou preços acima da referência anual para as próximas viagens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {visibleItems.map(item => {
              const visual = visualByKind[item.kind];
              const Icon = visual.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${visual.classes}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                        {item.price !== undefined &&
                          !hideValues &&
                          ` Menor valor: R$ ${item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 sm:flex-none"
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
                          className="flex-1 gap-1.5 text-slate-500 hover:text-slate-800 sm:flex-none"
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
                            onSelect={() =>
                              onDismiss(item.id, option.durationMs, option.label)
                            }
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
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-6 dark:border-slate-700 dark:text-slate-400">
            Mostrando as 5 prioridades mais urgentes de {items.length} identificadas.
          </p>
        )}
        {visibleDismissedItems.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6 dark:border-slate-700 dark:bg-slate-900/30">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Alertas adiados
            </p>
            <div className="space-y-2">
              {visibleDismissedItems.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      Reaparece em {formatExpiry(dismissals[item.id])}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-xs sm:w-auto"
                    onClick={() => onRestore(item.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
            {dismissedItems.length > visibleDismissedItems.length && (
              <p className="mt-2 text-xs text-slate-400">
                Mais {dismissedItems.length - visibleDismissedItems.length} alertas adiados.
              </p>
            )}
          </div>
        )}</div>}
      </Card>
    </section>
  );
}
