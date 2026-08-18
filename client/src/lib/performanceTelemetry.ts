export type PerformanceMetricName = "CLS" | "FCP" | "INP" | "LCP" | "TRPC";

export interface PerformanceSample {
  metric: PerformanceMetricName;
  value: number;
  route?: string;
  procedure?: string;
}

export function canRecordPerformanceTelemetry(
  isInternalSessionAuthenticated: boolean
): boolean {
  return isInternalSessionAuthenticated;
}

export function getSafeRoute(pathname: string): string {
  return /^\/[a-zA-Z0-9_/-]*$/.test(pathname) ? pathname : "/";
}

export function getTrpcProcedure(input: RequestInfo | URL): string | undefined {
  const rawUrl = typeof input === "string" ? input : input.toString();
  try {
    const origin =
      typeof window === "undefined"
        ? "https://telemetry.local"
        : window.location.origin;
    const pathname = new URL(rawUrl, origin).pathname;
    const prefix = "/api/trpc/";
    if (!pathname.startsWith(prefix)) return undefined;
    const procedure = pathname.slice(prefix.length).split(",")[0];
    return /^[a-zA-Z0-9_.-]+$/.test(procedure) ? procedure : undefined;
  } catch {
    return undefined;
  }
}

export function observeWebVitals(
  record: (metric: PerformanceMetricName, value: number) => void
): () => void {
  if (typeof PerformanceObserver === "undefined") return () => {};

  let cls = 0;
  let inp = 0;
  let lcp = 0;
  const observers: PerformanceObserver[] = [];
  const observe = (type: string, callback: PerformanceObserverCallback) => {
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch {
      // Métrica não suportada pelo navegador atual.
    }
  };

  observe("paint", list => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        record("FCP", Math.round(entry.startTime));
      }
    }
  });
  observe("largest-contentful-paint", list => {
    const entry = list.getEntries().at(-1);
    if (entry) lcp = Math.round(entry.startTime);
  });
  observe("layout-shift", list => {
    for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
      if (!entry.hadRecentInput) cls += entry.value;
    }
  });
  observe("event", list => {
    for (const entry of list.getEntries()) {
      inp = Math.max(inp, Math.round(entry.duration));
    }
  });

  const flush = () => {
    if (lcp > 0) record("LCP", lcp);
    if (inp > 0) record("INP", inp);
    record("CLS", Math.round(cls * 1000));
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flush();
  };

  document.addEventListener("visibilitychange", onVisibilityChange, { once: true });
  return () => {
    observers.forEach(observer => observer.disconnect());
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
