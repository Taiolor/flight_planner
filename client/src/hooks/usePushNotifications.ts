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

export type NotificationStatus =
  | "unsupported" // Navegador não suporta push
  | "denied" // Usuário negou permissão
  | "subscribed" // Notificações ativas
  | "unsubscribed" // Notificações inativas (permissão concedida mas não inscrito)
  | "loading" // Operação em andamento
  | "error"; // Erro inesperado

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

export function usePushNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const sendTestMutation = trpc.push.sendTest.useMutation();

  // Verificar estado inicial ao montar
  useEffect(() => {
    async function checkInitialState() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }

      const permission = Notification.permission;
      if (permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(existingSub);
          setStatus("subscribed");
        } else {
          if (permission === "granted") {
            setStatus("unsubscribed");
          } else {
            setStatus("denied");
          }
        }
      } catch (err) {
        console.error("[Push] Erro ao verificar subscription:", err);
        setStatus("error");
      }
    }

    checkInitialState();
  }, []);

  const subscribe = useCallback(async () => {
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

      const registration = await navigator.serviceWorker.ready;
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
      if (err instanceof Error) {
        console.error("[Push] Stack:", err.stack);
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro ao ativar notificações.");
      }
      setStatus("error");
    }
  }, [vapidData, subscribeMutation]);

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
  }, [subscription, unsubscribeMutation]);

  const sendTest = useCallback(async () => {
    try {
      await sendTestMutation.mutateAsync();
      return true;
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao enviar notificação de teste."
      );
      return false;
    }
  }, [sendTestMutation]);

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
