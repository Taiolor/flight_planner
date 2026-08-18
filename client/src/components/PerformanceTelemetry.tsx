import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  getSafeRoute,
  observeWebVitals,
  type PerformanceSample,
} from "@/lib/performanceTelemetry";
import { useCallback, useEffect, useRef } from "react";

const MAX_BATCH_SIZE = 20;

export default function PerformanceTelemetry() {
  const { isAuthenticated } = useAuth();
  const recordMutation = trpc.performanceMetrics.record.useMutation();
  const samplesRef = useRef<PerformanceSample[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!isAuthenticated || recordMutation.isPending) return;
    const samples = samplesRef.current.splice(0, MAX_BATCH_SIZE);
    if (samples.length === 0) return;
    recordMutation.mutate(
      { samples },
      {
        onError: () => {
          // Telemetria nunca deve alterar a experiência do usuário.
        },
      }
    );
  }, [isAuthenticated, recordMutation]);

  const enqueue = useCallback(
    (sample: Omit<PerformanceSample, "route">) => {
      if (!isAuthenticated) return;
      samplesRef.current.push({
        ...sample,
        route: getSafeRoute(window.location.pathname),
      });
      if (samplesRef.current.length >= MAX_BATCH_SIZE) {
        flush();
        return;
      }
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          flush();
        }, 3000);
      }
    },
    [flush, isAuthenticated]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    return observeWebVitals((metric, value) => enqueue({ metric, value }));
  }, [enqueue, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onTrpcLatency = (event: Event) => {
      const detail = (event as CustomEvent<{ procedure?: string; duration: number }>).detail;
      if (!detail?.procedure || !Number.isFinite(detail.duration)) return;
      enqueue({
        metric: "TRPC",
        value: Math.round(detail.duration),
        procedure: detail.procedure,
      });
    };
    window.addEventListener("flight:trpc-latency", onTrpcLatency);
    return () => window.removeEventListener("flight:trpc-latency", onTrpcLatency);
  }, [enqueue, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  return null;
}
