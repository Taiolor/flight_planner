import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AttentionItem } from "@/lib/attentionCenter";

type AttentionCenterProps = {
  items: AttentionItem[];
  dismissedItems: AttentionItem[];
  hideValues: boolean;
  onOpenWeek: (weekNumber: number) => void;
  onDismiss: (itemId: string) => void;
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
  hideValues,
  onOpenWeek,
  onDismiss,
  onRestore,
}: AttentionCenterProps) {
  const visibleItems = items.slice(0, 5);
  const visibleDismissedItems = dismissedItems.slice(0, 5);

  return (
    <section aria-labelledby="attention-center-title" className="mb-4 sm:mb-8">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 id="attention-center-title" className="text-base font-bold sm:text-lg">
              Central de atenção
            </h2>
            <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
              Prioridades de prazo, cancelamento e preço para agir primeiro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dismissedItems.length > 0 && (
              <span className="w-fit rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-blue-100">
                {dismissedItems.length} adiado{dismissedItems.length === 1 ? "" : "s"} por 24h
              </span>
            )}
            <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
            {items.length === 0
              ? "Tudo sob controle"
              : `${items.length} ${items.length === 1 ? "atenção" : "atenções"}`}
            </span>
          </div>
        </div>

        {visibleItems.length === 0 ? (
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1.5 text-slate-500 hover:text-slate-800 sm:flex-none"
                      onClick={() => onDismiss(item.id)}
                      aria-label={`Adiar alerta ${item.title} por 24 horas`}
                    >
                      <EyeOff className="h-4 w-4" />
                      Adiar 24h
                    </Button>
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
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {item.title}
                  </p>
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
        )}
      </Card>
    </section>
  );
}
