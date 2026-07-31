import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

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

  // Dispara evento customizado para abrir o modal de login proprietário
  // em vez de redirecionar para o Manus OAuth externo
  window.dispatchEvent(new CustomEvent("flight:require-login"));
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Suprimir log de erro para respostas HTML transitórias (servidor reiniciando)
    if (!isHtmlResponse(error)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (!isHtmlResponse(error)) {
      console.error("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
