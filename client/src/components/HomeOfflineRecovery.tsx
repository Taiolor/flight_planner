import React from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPlanningSyncTimestamp } from "@/lib/offlinePlanningSync";
import type { OfflineNextTripsSnapshot } from "@/lib/offlineNextTrips";

type HomeOfflineRecoveryProps = {
  year: number;
  lastSyncedAt: number | null;
  cachedTrips?: OfflineNextTripsSnapshot | null;
  isRetrying?: boolean;
  onRetry: () => void;
};

/** Estado claro para abertura sem conexão quando o dispositivo não possui dados do planejamento solicitado. */
export function HomeOfflineRecovery({
  year,
  lastSyncedAt,
  cachedTrips = null,
  isRetrying = false,
  onRetry,
}: HomeOfflineRecoveryProps) {
  const lastSyncLabel = formatPlanningSyncTimestamp(lastSyncedAt);

  return (
    <Card
      role="alert"
      aria-live="assertive"
      data-testid="home-offline-recovery"
      className="mx-auto max-w-2xl border-[#315c99] bg-[#071a36] p-6 text-white shadow-xl sm:p-8"
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
          <WifiOff className="size-6 text-sky-100" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-200">Modo offline</p>
          <h2 className="mt-1 text-xl font-bold">Não há dados locais para {year}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Conecte-se à internet para baixar o planejamento deste exercício. Assim que os dados forem carregados, eles continuarão disponíveis durante instabilidades temporárias.
          </p>
          <p className="mt-3 text-sm text-sky-100">
            {lastSyncLabel
              ? `Última sincronização conhecida: ${lastSyncLabel}.`
              : "Este dispositivo ainda não possui uma sincronização local registrada."}
          </p>
          {cachedTrips && (
            <section className="mt-5" aria-label="Próximas viagens disponíveis offline">
              <p className="text-sm font-semibold text-white">Próximas viagens disponíveis neste dispositivo</p>
              <ol className="mt-3 space-y-2" aria-label="Lista de próximas viagens armazenadas">
                {cachedTrips.trips.map(trip => (
                  <li key={`${trip.weekNumber}-${trip.departureDate}`} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100">
                    <span className="font-semibold">Semana {trip.weekNumber}</span>
                    <span className="mx-1 text-sky-200">·</span>
                    <span>{trip.route}</span>
                    <span className="mx-1 text-sky-200">·</span>
                    <span>{trip.departureDate} → {trip.returnDate}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-sky-100">Agenda salva em {formatPlanningSyncTimestamp(cachedTrips.cachedAt)}. Localizadores e valores não são armazenados offline.</p>
            </section>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-6 border-white/35 bg-white/10 text-white hover:bg-white/20"
      >
        <RefreshCw className={`mr-2 size-4 ${isRetrying ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
        Verificar conexão novamente
      </Button>
    </Card>
  );
}
