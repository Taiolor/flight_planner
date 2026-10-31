import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { queryCachePolicies } from "./lib/queryCache";
import { getTrpcProcedure } from "./lib/performanceTelemetry";
import { isRetryableDatabaseQueryError } from "./lib/queryErrorRecovery";
import { PwaStartupSplashController } from "./components/PwaStartupSplash";
import {
  getDevelopmentCacheNames,
  shouldRegisterServiceWorker,
} from "./lib/serviceWorkerPolicy";

// Detecta se o erro é HTML em vez de JSON (ocorre quando o servidor está reiniciando após hibernação)
const isHtmlResponse = (error: unknown): boolean => {
  if (!(error instanceof TRPCClientError)) return false;
  return (
    error.message.includes("<!doctype") ||
    error.message.includes("not valid JSON") ||
    error.message.includes("Unexpected token '<'")
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...queryCachePolicies.default,
      // Retry automático para erros transitórios (servidor reiniciando após hibernação)
      retry: (failureCount, error) => {
        // Não fazer retry para erros de autenticação
        if (
          error instanceof TRPCClientError &&
          error.message === UNAUTHED_ERR_MSG
        )
          return false;
        // Fazer até 3 retries para erros de HTML (servidor reiniciando)
        if (isHtmlResponse(error)) return failureCount < 3;
        // Repetir falhas de banco transitórias antes de expor um erro na Home.
        if (isRetryableDatabaseQueryError(error)) return failureCount < 2;
        // Não fazer retry para outros erros tRPC
        if (error instanceof TRPCClientError) return false;
        return failureCount < 1;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized =
    error.message === UNAUTHED_ERR_MSG ||
    error.message === "Faça login para acessar.";

  if (!isUnauthorized) return;

  // Dispara evento customizado para abrir o modal de login interno.
  window.dispatchEvent(new CustomEvent("flight:require-login"));
};

const isExpectedUnauthorizedError = (error: unknown): boolean =>
  error instanceof TRPCClientError &&
  (error.message === UNAUTHED_ERR_MSG ||
    error.message === "Faça login para acessar.");

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suprimir log de erro para respostas HTML transitórias (servidor reiniciando)
    if (!isHtmlResponse(error) && !isExpectedUnauthorizedError(error)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (!isHtmlResponse(error) && !isExpectedUnauthorizedError(error)) {
      console.error("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async fetch(input, init) {
        const procedure = getTrpcProcedure(input);
        const startedAt = performance.now();
        try {
          return await globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
          });
        } finally {
          if (
            procedure &&
            procedure !== "performanceMetrics.record" &&
            procedure !== "usageTelemetry.record" &&
            procedure !== "usageTelemetry.deleteCurrentSession" &&
            typeof window !== "undefined"
          ) {
            window.dispatchEvent(
              new CustomEvent("flight:trpc-latency", {
                detail: { procedure, duration: performance.now() - startedAt },
              })
            );
            window.dispatchEvent(
              new CustomEvent("flight:trpc-usage", {
                detail: {
                  procedure,
                  eventType: init?.method === "POST" ? "mutation" : "query",
                },
              })
            );
          }
        }
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <PwaStartupSplashController />
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (shouldRegisterServiceWorker(import.meta.env.PROD, true)) {
      navigator.serviceWorker.register("/sw.js?v=20260905-map-osm").catch(() => {});
      return;
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then(registrations =>
        Promise.all(registrations.map(registration => registration.unregister()))
      )
      .then(() => caches.keys())
      .then(cacheNames =>
        Promise.all(
          getDevelopmentCacheNames(cacheNames).map(cacheName =>
            caches.delete(cacheName)
          )
        )
      )
      .catch(() => {});
  });
}
