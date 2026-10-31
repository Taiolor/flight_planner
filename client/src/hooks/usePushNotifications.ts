/**
 * usePushNotifications.ts
 * Hook para gerenciar o ciclo de vida das notificações push no frontend:
 * - Verificar suporte do navegador
 * - Solicitar permissão
 * - Criar/remover subscription via Web Push API
 * - Sincronizar com o servidor via tRPC
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { queryCachePolicies } from "@/lib/queryCache";
import { shouldRegisterServiceWorker } from "@/lib/serviceWorkerPolicy";

export type NotificationStatus =
  | "unsupported" // Navegador não suporta push
  | "denied" // Usuário negou permissão
  | "subscribed" // Notificações ativas
  | "unsubscribed" // Notificações inativas (permissão concedida mas não inscrito)
  | "loading" // Operação em andamento
  | "error"; // Erro inesperado

const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000;
const SERVICE_WORKER_NOT_READY_MESSAGE =
  "Não foi possível preparar as notificações. Recarregue a página e tente novamente.";
const DEVELOPMENT_NOT_SUPPORTED_MESSAGE =
  "Notificações push estão disponíveis somente em produção.";
const UNSUPPORTED_BROWSER_MESSAGE =
  "Notificações push não são suportadas neste navegador.";

class ServiceWorkerReadyTimeoutError extends Error {
  constructor() {
    super(SERVICE_WORKER_NOT_READY_MESSAGE);
    this.name = "ServiceWorkerReadyTimeoutError";
  }
}

function createAbortError(): Error {
  const error = new Error("A verificação de notificações foi cancelada.");
  error.name = "AbortError";
  return error;
}

function hasPushNotificationSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    typeof Notification.requestPermission === "function"
  );
}

function canUsePushNotifications(): boolean {
  return shouldRegisterServiceWorker(
    import.meta.env.PROD,
    hasPushNotificationSupport()
  );
}

function waitForServiceWorkerReady(
  serviceWorker: ServiceWorkerContainer,
  signal?: AbortSignal
): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;
    let onAbort: (() => void) | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      if (onAbort) {
        signal?.removeEventListener("abort", onAbort);
      }
    };

    const resolveOnce = (registration: ServiceWorkerRegistration) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(registration);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    onAbort = () => rejectOnce(createAbortError());

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
    timeoutId = window.setTimeout(
      () => rejectOnce(new ServiceWorkerReadyTimeoutError()),
      SERVICE_WORKER_READY_TIMEOUT_MS
    );
    serviceWorker.ready.then(resolveOnce, rejectOnce);
  });
}

function getPushErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ServiceWorkerReadyTimeoutError) {
    return SERVICE_WORKER_NOT_READY_MESSAGE;
  }

  return error instanceof Error ? error.message : fallback;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(year: number) {
  const [status, setStatus] = useState<NotificationStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(
    undefined,
    queryCachePolicies.staticPublicKey
  );
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const sendTestMutation = trpc.push.sendTest.useMutation();

  // Verificar estado inicial ao montar
  useEffect(() => {
    const controller = new AbortController();

    async function checkInitialState() {
      if (!canUsePushNotifications()) {
        if (!controller.signal.aborted) {
          setStatus("unsupported");
        }
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        if (!controller.signal.aborted) {
          setStatus("denied");
        }
        return;
      }

      try {
        const registration = await waitForServiceWorkerReady(
          navigator.serviceWorker,
          controller.signal
        );
        const existingSub = await registration.pushManager.getSubscription();
        if (controller.signal.aborted) return;

        if (existingSub) {
          setSubscription(existingSub);
          setStatus("subscribed");
        } else {
          setStatus("unsubscribed");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        console.error("[Push] Erro ao verificar subscription:", err);
        if (!controller.signal.aborted) {
          setErrorMessage(
            getPushErrorMessage(err, "Erro ao verificar notificações push.")
          );
          setStatus("error");
        }
      }
    }

    void checkInitialState();

    return () => controller.abort();
  }, []);

  const subscribe = useCallback(async () => {
    if (!canUsePushNotifications()) {
      setErrorMessage(
        import.meta.env.PROD
          ? UNSUPPORTED_BROWSER_MESSAGE
          : DEVELOPMENT_NOT_SUPPORTED_MESSAGE
      );
      setStatus("unsupported");
      return;
    }

    if (!vapidData?.publicKey) {
      setErrorMessage("Chave VAPID não disponível. Tente novamente.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      // Solicitar permissão se ainda não foi concedida
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await waitForServiceWorkerReady(
        navigator.serviceWorker
      );
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const subJson = sub.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string };

      await subscribeMutation.mutateAsync({
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: navigator.userAgent.slice(0, 255),
      });

      setSubscription(sub);
      setStatus("subscribed");
    } catch (err: unknown) {
      console.error("[Push] Erro ao ativar notificações:", err);
      if (err instanceof Error && !(err instanceof ServiceWorkerReadyTimeoutError)) {
        console.error("[Push] Stack:", err.stack);
      }
      setErrorMessage(getPushErrorMessage(err, "Erro ao ativar notificações."));
      setStatus("error");
    }
  }, [vapidData, subscribeMutation.mutateAsync]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      await subscription.unsubscribe();
      await unsubscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
      });
      setSubscription(null);
      setStatus("unsubscribed");
    } catch (err: unknown) {
      console.error("[Push] Erro ao desativar notificações:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao desativar notificações."
      );
      setStatus("error");
    }
  }, [subscription, unsubscribeMutation.mutateAsync]);

  const sendTest = useCallback(async () => {
    try {
      await sendTestMutation.mutateAsync({ year });
      return true;
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao enviar notificação de teste."
      );
      return false;
    }
  }, [sendTestMutation.mutateAsync, year]);

  return {
    status,
    subscription,
    errorMessage,
    isSupported: status !== "unsupported",
    isSubscribed: status === "subscribed",
    isLoading: status === "loading",
    subscribe,
    unsubscribe,
    sendTest,
    isSendingTest: sendTestMutation.isPending,
  };
}
