/**
 * pushNotifications.ts
 * Módulo responsável por enviar notificações push via Web Push API (VAPID).
 * Inclui função de envio individual, envio em massa e job agendado
 * que verifica voos com partida em ~24h e notifica todos os dispositivos.
 */

import webpush from "web-push";
import { ENV } from "./_core/env";
import { getAllPushSubscriptions, getAllFlightWeeks, deletePushSubscription } from "./db";

// Configurar VAPID uma única vez ao carregar o módulo
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = ENV.vapidPublicKey || process.env.VITE_VAPID_PUBLIC_KEY || "";
  const privateKey = ENV.vapidPrivateKey || "";

  if (!publicKey || !privateKey) {
    console.warn("[Push] Chaves VAPID não configuradas. Notificações push desativadas.");
    return;
  }

  webpush.setVapidDetails(
    "mailto:smartfly@example.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Envia uma notificação push para um único dispositivo.
 * Retorna true se enviado com sucesso, false caso contrário.
 * Remove a subscription do banco se o dispositivo não for mais válido (410 Gone).
 */
export async function sendPushToOne(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<boolean> {
  ensureVapidConfigured();
  if (!vapidConfigured) return false;

  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
      { TTL: 86400 } // 24h de TTL
    );
    return true;
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      // Subscription expirada ou inválida — remover do banco
      console.log(`[Push] Subscription inválida (${err.statusCode}), removendo: ${endpoint.slice(0, 60)}...`);
      await deletePushSubscription(endpoint);
    } else {
      console.error("[Push] Erro ao enviar notificação:", err?.message ?? err);
    }
    return false;
  }
}

/**
 * Envia uma notificação push para todos os dispositivos registrados.
 * Retorna o número de envios bem-sucedidos.
 */
export async function sendPushToAll(payload: PushPayload): Promise<number> {
  const subscriptions = await getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    console.log("[Push] Nenhuma subscription registrada.");
    return 0;
  }

  let sent = 0;
  for (const sub of subscriptions) {
    const ok = await sendPushToOne(sub.endpoint, sub.p256dh, sub.auth, payload);
    if (ok) sent++;
  }
  console.log(`[Push] Enviado para ${sent}/${subscriptions.length} dispositivos.`);
  return sent;
}

/**
 * Verifica os voos das próximas 24–25 horas e envia notificações push.
 * Deve ser chamado periodicamente (ex: a cada hora).
 */
export async function checkAndNotifyUpcomingFlights(): Promise<void> {
  ensureVapidConfigured();
  if (!vapidConfigured) return;

  const weeks = await getAllFlightWeeks();
  const now = new Date();

  // Janela: entre 23h e 25h a partir de agora
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const airlineNames: Record<string, string> = {
    LATAM: "LATAM",
    GOL: "Gol",
    AZUL: "Azul",
  };

  for (const week of weeks) {
    if (!week.isTicketIssued) continue;

    // Verificar voo de ida
    if (week.departureFlightDatetime) {
      const departureTime = new Date(week.departureFlightDatetime);
      if (departureTime >= windowStart && departureTime <= windowEnd) {
        const airline = week.departureAirline
          ? (airlineNames[week.departureAirline.toUpperCase()] ?? week.departureAirline)
          : "Companhia";
        const flightNum = week.departureFlightNumber ?? "";
        const timeStr = departureTime.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const dateStr = departureTime.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        });

        await sendPushToAll({
          title: `✈️ Voo amanhã — ${airline} ${flightNum}`,
          body: `Seu voo de ida GRU → NVT parte ${dateStr} às ${timeStr}. Prepare-se! 🧳`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: `departure-week-${week.weekNumber}`,
          data: { weekNumber: week.weekNumber, direction: "departure" },
        });

        console.log(`[Push] Notificação de ida enviada para semana ${week.weekNumber}`);
      }
    }

    // Verificar voo de volta
    if (week.returnFlightDatetime) {
      const returnTime = new Date(week.returnFlightDatetime);
      if (returnTime >= windowStart && returnTime <= windowEnd) {
        const airline = week.returnAirline
          ? (airlineNames[week.returnAirline.toUpperCase()] ?? week.returnAirline)
          : "Companhia";
        const flightNum = week.returnFlightNumber ?? "";
        const timeStr = returnTime.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const dateStr = returnTime.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          timeZone: "America/Sao_Paulo",
        });

        await sendPushToAll({
          title: `🏠 Voo de volta amanhã — ${airline} ${flightNum}`,
          body: `Seu voo de volta NVT → GRU parte ${dateStr} às ${timeStr}. Boa viagem! ✈️`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: `return-week-${week.weekNumber}`,
          data: { weekNumber: week.weekNumber, direction: "return" },
        });

        console.log(`[Push] Notificação de volta enviada para semana ${week.weekNumber}`);
      }
    }
  }
}

/**
 * Inicia o job agendado que verifica voos a cada hora.
 * Deve ser chamado uma única vez na inicialização do servidor.
 */
export function startFlightNotificationJob(): void {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hora

  console.log("[Push] Job de notificações iniciado (verificação a cada hora).");

  // Executar imediatamente na inicialização (com delay de 10s para o servidor estabilizar)
  setTimeout(() => {
    checkAndNotifyUpcomingFlights().catch(err =>
      console.error("[Push] Erro no job de notificações:", err)
    );
  }, 10_000);

  // Executar a cada hora
  setInterval(() => {
    checkAndNotifyUpcomingFlights().catch(err =>
      console.error("[Push] Erro no job de notificações:", err)
    );
  }, INTERVAL_MS);
}
