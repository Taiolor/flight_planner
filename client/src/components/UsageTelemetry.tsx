import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  approximatePosition,
  createUsageTelemetrySessionId,
  getSafeUsageRoute,
  markUsageTelemetryActiveNoticeShown,
  shouldShowUsageTelemetryActiveNotice,
  USAGE_TELEMETRY_ACTIVE_NOTICE_KEY,
  USAGE_TELEMETRY_CONSENT_KEY,
  USAGE_TELEMETRY_SESSION_KEY,
  type ApproximatePosition,
} from "@/lib/usageTelemetry";
import { MapPin, ShieldCheck, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type UsageEvent = {
  eventType: "route" | "interaction" | "query" | "mutation";
  route: string;
  procedure?: string;
  latitudeE2?: number;
  longitudeE2?: number;
};

const MAX_BATCH_SIZE = 20;

function getSessionId() {
  const existing = sessionStorage.getItem(USAGE_TELEMETRY_SESSION_KEY);
  if (existing) return existing;
  const sessionId = createUsageTelemetrySessionId();
  sessionStorage.setItem(USAGE_TELEMETRY_SESSION_KEY, sessionId);
  return sessionId;
}

export default function UsageTelemetry() {
  const [location] = useLocation();
  const internalSessionQuery = trpc.flightAuth.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [isEnabled, setIsEnabled] = useState(
    () => sessionStorage.getItem(USAGE_TELEMETRY_CONSENT_KEY) === "granted"
  );
  const [isPromptDismissed, setIsPromptDismissed] = useState(
    () => sessionStorage.getItem(USAGE_TELEMETRY_CONSENT_KEY) === "dismissed"
  );
  const [showActiveNotice, setShowActiveNotice] = useState(
    () =>
      sessionStorage.getItem(USAGE_TELEMETRY_CONSENT_KEY) === "granted" &&
      shouldShowUsageTelemetryActiveNotice()
  );
  const [position, setPosition] = useState<ApproximatePosition>();
  const queueRef = useRef<UsageEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const recordMutation = trpc.usageTelemetry.record.useMutation();
  const deleteMutation = trpc.usageTelemetry.deleteCurrentSession.useMutation();
  const isInternalSessionAuthenticated =
    internalSessionQuery.data?.authenticated ?? false;

  const flush = useCallback(() => {
    if (!isEnabled || !isInternalSessionAuthenticated || recordMutation.isPending) {
      return;
    }
    const events = queueRef.current.splice(0, MAX_BATCH_SIZE);
    if (events.length === 0) return;
    const sessionId = sessionIdRef.current ?? getSessionId();
    sessionIdRef.current = sessionId;
    recordMutation.mutate(
      { sessionId, events },
      { onError: () => undefined }
    );
  }, [isEnabled, isInternalSessionAuthenticated, recordMutation]);

  const enqueue = useCallback(
    (event: Omit<UsageEvent, "route" | "latitudeE2" | "longitudeE2">) => {
      if (!isEnabled || !isInternalSessionAuthenticated) return;
      const route = getSafeUsageRoute(window.location.pathname);
      queueRef.current.push({ ...event, route, ...position });
      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        flush();
        return;
      }
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flush();
        }, 3000);
      }
    },
    [flush, isEnabled, isInternalSessionAuthenticated, position]
  );

  const enable = useCallback(() => {
    sessionStorage.setItem(USAGE_TELEMETRY_CONSENT_KEY, "granted");
    sessionIdRef.current = getSessionId();
    setIsPromptDismissed(false);
    setIsEnabled(true);
    setShowActiveNotice(true);
    markUsageTelemetryActiveNoticeShown();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      result => {
        setPosition(approximatePosition(result.coords.latitude, result.coords.longitude));
      },
      () => setPosition(undefined),
      { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 10_000 }
    );
  }, []);

  const disableAndDelete = useCallback(() => {
    const sessionId = sessionIdRef.current ?? sessionStorage.getItem(USAGE_TELEMETRY_SESSION_KEY);
    queueRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    sessionStorage.removeItem(USAGE_TELEMETRY_CONSENT_KEY);
    sessionStorage.removeItem(USAGE_TELEMETRY_SESSION_KEY);
    sessionStorage.removeItem(USAGE_TELEMETRY_ACTIVE_NOTICE_KEY);
    sessionIdRef.current = undefined;
    setPosition(undefined);
    setIsEnabled(false);
    setIsPromptDismissed(true);
    if (sessionId && isInternalSessionAuthenticated) {
      deleteMutation.mutate({ sessionId }, { onError: () => undefined });
    }
  }, [deleteMutation, isInternalSessionAuthenticated]);

  useEffect(() => {
    if (isEnabled && showActiveNotice) {
      markUsageTelemetryActiveNoticeShown();
    }
  }, [isEnabled, showActiveNotice]);

  useEffect(() => {
    if (!isEnabled || !isInternalSessionAuthenticated) return;
    enqueue({ eventType: "route" });
  }, [enqueue, isEnabled, isInternalSessionAuthenticated, location]);

  useEffect(() => {
    if (!isEnabled || !isInternalSessionAuthenticated) return;
    const onInteraction = () => enqueue({ eventType: "interaction" });
    const onUsage = (event: Event) => {
      const detail = (event as CustomEvent<{
        eventType?: "query" | "mutation";
        procedure?: string;
      }>).detail;
      if (!detail?.eventType || !detail.procedure) return;
      enqueue({ eventType: detail.eventType, procedure: detail.procedure });
    };
    window.addEventListener("click", onInteraction, { passive: true });
    window.addEventListener("flight:trpc-usage", onUsage);
    return () => {
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("flight:trpc-usage", onUsage);
    };
  }, [enqueue, isEnabled, isInternalSessionAuthenticated]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (
    !isInternalSessionAuthenticated ||
    (!isEnabled && isPromptDismissed) ||
    (isEnabled && !showActiveNotice)
  ) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {isEnabled ? (
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Telemetria de uso ativa nesta sessão. A localização é aproximada e opcional.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={disableAndDelete}
            aria-label="Desativar telemetria e excluir dados desta sessão"
            title="Desativar e excluir dados desta sessão"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ajudar a melhorar o Smart Fly?</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Opcional nesta sessão: eventos técnicos e localização aproximada, sem dados de formulário ou posição exata.
            </p>
            <div className="mt-2 flex gap-2">
              <Button type="button" size="sm" onClick={enable}>Permitir nesta sessão</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => {
                sessionStorage.setItem(USAGE_TELEMETRY_CONSENT_KEY, "dismissed");
                setIsPromptDismissed(true);
              }}>
                <X className="mr-1 h-3.5 w-3.5" /> Agora não
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
