/**
 * pushNotifications.ts
 * Módulo responsável por enviar notificações push via Web Push API (VAPID).
 * Inclui função de envio individual, envio em massa e job agendado
 * que verifica voos com partida em ~24h e notifica todos os dispositivos.
 */

import webpush from "web-push";
import { ENV } from "./_core/env";
import {
  getAllPushSubscriptions,
  getAllFlightWeeks,
  deletePushSubscription,
  getNotificationSettings,
  insertNotificationLog,
  deleteOldNotificationLogs,
} from "./db";

// Configurar VAPID uma única vez ao carregar o módulo
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey =
    ENV.vapidPublicKey || process.env.VITE_VAPID_PUBLIC_KEY || "";
  const privateKey = ENV.vapidPrivateKey || "";

  if (!publicKey || !privateKey) {
    console.warn(
      "[Push] Chaves VAPID não configuradas. Notificações push desativadas."
    );
    return;
  }

  webpush.setVapidDetails("mailto:smartfly@example.com", publicKey, privateKey);
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
  } catch (err: unknown) {
    if (err instanceof webpush.WebPushError) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expirada ou inválida — remover do banco
        console.log(
          `[Push] Subscription inválida (${err.statusCode}), removendo: ${endpoint.slice(0, 60)}...`
        );
        await deletePushSubscription(endpoint);
      } else {
        console.error("[Push] Erro ao enviar notificação:", err.message);
      }
    } else if (err instanceof Error) {
      console.error("[Push] Erro ao enviar notificação:", err.message);
    } else {
      console.error("[Push] Erro ao enviar notificação:", err);
    }
    return false;
  }
}

/**
 * Envia uma notificação push para todos os dispositivos registrados.
 * Aceita opcionalmente um array pré-carregado de subscriptions para evitar N+1 queries.
 * Retorna o número de envios bem-sucedidos.
 */
export async function sendPushToAll(
  payload: PushPayload,
  subscriptions?: Awaited<ReturnType<typeof getAllPushSubscriptions>>
): Promise<number> {
  const subs = subscriptions ?? (await getAllPushSubscriptions());
  if (subs.length === 0) {
    return 0;
  }

  const results = await Promise.all(
    subs.map(sub => sendPushToOne(sub.endpoint, sub.p256dh, sub.auth, payload))
  );

  const sent = results.filter(Boolean).length;
  console.log(`[Push] Enviado para ${sent}/${subs.length} dispositivos.`);
  return sent;
}

/**
 * Formata minutos em texto legível (ex: 1440 → "24h antes", 30 → "30min antes")
 */
function formatMinutes(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h}h antes`;
  }
  return `${minutes}min antes`;
}

/**
 * Converte datetime salvo no banco ("YYYY-MM-DDTHH:mm" sem timezone) para Date local de Brasília.
 * Evita que o JS interprete como UTC e gere diferença de 3h.
 */
function parseBrasiliaDatetime(dt: string): Date {
  // Formato esperado: "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DDTHH:mm:ss"
  // Adicionar offset de Brasília (-03:00) para forçar interpretação correta
  if (!dt) return new Date(NaN);
  // Se já tem timezone, usar direto
  if (dt.includes("+") || dt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dt)) {
    return new Date(dt);
  }
  // Adicionar -03:00 (Brasília)
  return new Date(dt + "-03:00");
}

/**
 * Verifica os voos dentro das janelas configuradas (aviso1 e aviso2) e envia notificações push.
 * Deve ser chamado periodicamente (ex: a cada hora).
 */
export async function checkAndNotifyUpcomingFlights(): Promise<void> {
  ensureVapidConfigured();
  if (!vapidConfigured) return;

  // ⚡ Bolt: Execute DB queries in parallel to reduce overall network/IO latency
  const [weeks, settings, pushSubscriptions] = await Promise.all([
    getAllFlightWeeks(),
    getNotificationSettings(),
    // Buscar subscriptions uma única vez antes do loop para evitar N+1 queries ao banco
    getAllPushSubscriptions(),
  ]);
  const now = new Date();

  const airlineNames: Record<string, string> = {
    LATAM: "LATAM",
    latam: "LATAM",
    GOL: "Gol",
    gol: "Gol",
    AZUL: "Azul",
    azul: "Azul",
  };

  // Processar cada aviso configurado (ignora avisos com 0 minutos = desativado)
  const avisos = [
    { minutes: settings.aviso1Minutes, label: "Aviso 1" },
    { minutes: settings.aviso2Minutes, label: "Aviso 2" },
  ].filter(a => a.minutes > 0);

  // ⚡ Bolt: Use a single pass loop to filter and map the issued weeks, reducing memory allocations
  const parsedWeeks = [];
  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    if (w.isTicketIssued) {
      parsedWeeks.push({
        week: w,
        departureTime: w.departureFlightDatetime
          ? parseBrasiliaDatetime(w.departureFlightDatetime)
          : null,
        returnTime: w.returnFlightDatetime
          ? parseBrasiliaDatetime(w.returnFlightDatetime)
          : null,
      });
    }
  }

  console.log(
    `[Push] Verificando ${parsedWeeks.length} voos emitidos. Avisos ativos: ${avisos.map(a => formatMinutes(a.minutes)).join(", ") || "nenhum"}. Hora atual (UTC): ${now.toISOString()}`
  );

  for (const aviso of avisos) {
    // Janela de ±50 min ao redor do horário configurado
    // (job roda a cada hora; ±50min garante que reinicializacoes do servidor nao percam a janela)
    const targetMs = aviso.minutes * 60 * 1000;
    const windowStart = new Date(now.getTime() + targetMs - 50 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + targetMs + 50 * 60 * 1000);
    const antecedenciaLabel = formatMinutes(aviso.minutes);
    console.log(
      `[Push] ${aviso.label} (${antecedenciaLabel}): janela ${windowStart.toISOString()} → ${windowEnd.toISOString()}`
    );

    for (const { week, departureTime, returnTime } of parsedWeeks) {
      // Verificar voo de ida
      if (departureTime && !isNaN(departureTime.getTime())) {
        if (departureTime >= windowStart && departureTime <= windowEnd) {
          const airline = week.departureAirline
            ? (airlineNames[week.departureAirline.toUpperCase()] ??
              week.departureAirline)
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
          const sentDepCount = await sendPushToAll(
            {
              title: `✈️ ${antecedenciaLabel} — ${airline} ${flightNum}`,
              body: `Voo de ida GRU → NVT: ${dateStr} às ${timeStr}. Prepare-se! 🧳`,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: `departure-week-${week.weekNumber}-aviso${aviso.minutes}`,
              data: { weekNumber: week.weekNumber, direction: "departure" },
            },
            pushSubscriptions
          );
          const totalDepDevices = pushSubscriptions.length;
          await insertNotificationLog({
            weekNumber: Number(week.weekNumber),
            direction: "ida",
            avisoLabel: aviso.label,
            avisoMinutes: aviso.minutes,
            airline: week.departureAirline ?? null,
            flightNumber: week.departureFlightNumber ?? null,
            flightDatetime: week.departureFlightDatetime ?? null,
            status:
              sentDepCount === totalDepDevices
                ? "success"
                : sentDepCount > 0
                  ? "partial"
                  : "failed",
            devicesReached: sentDepCount,
            totalDevices: totalDepDevices,
            isTest: 0,
          });
          console.log(
            `[Push] ${aviso.label} (${antecedenciaLabel}) de ida enviado para semana ${week.weekNumber}`
          );
        }
      }

      // Verificar voo de volta
      if (returnTime && !isNaN(returnTime.getTime())) {
        if (returnTime >= windowStart && returnTime <= windowEnd) {
          const airline = week.returnAirline
            ? (airlineNames[week.returnAirline.toUpperCase()] ??
              week.returnAirline)
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
          const sentRetCount = await sendPushToAll(
            {
              title: `🏠 ${antecedenciaLabel} — ${airline} ${flightNum}`,
              body: `Voo de volta NVT → GRU: ${dateStr} às ${timeStr}. Boa viagem! ✈️`,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: `return-week-${week.weekNumber}-aviso${aviso.minutes}`,
              data: { weekNumber: week.weekNumber, direction: "return" },
            },
            pushSubscriptions
          );
          const totalRetDevices = pushSubscriptions.length;
          await insertNotificationLog({
            weekNumber: Number(week.weekNumber),
            direction: "volta",
            avisoLabel: aviso.label,
            avisoMinutes: aviso.minutes,
            airline: week.returnAirline ?? null,
            flightNumber: week.returnFlightNumber ?? null,
            flightDatetime: week.returnFlightDatetime ?? null,
            status:
              sentRetCount === totalRetDevices
                ? "success"
                : sentRetCount > 0
                  ? "partial"
                  : "failed",
            devicesReached: sentRetCount,
            totalDevices: totalRetDevices,
            isTest: 0,
          });
          console.log(
            `[Push] ${aviso.label} (${antecedenciaLabel}) de volta enviado para semana ${week.weekNumber}`
          );
        }
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
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 dia

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

  // Executar limpeza de logs uma vez por dia (às 03:00 UTC)
  const now = new Date();
  const nextCleanup = new Date();
  nextCleanup.setUTCHours(3, 0, 0, 0);
  if (nextCleanup <= now) {
    nextCleanup.setUTCDate(nextCleanup.getUTCDate() + 1);
  }
  const delayToFirstCleanup = nextCleanup.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOldLogs().catch(err =>
      console.error("[Push] Erro na limpeza de logs:", err)
    );
    // Executar a cada dia após o primeiro agendamento
    setInterval(() => {
      cleanupOldLogs().catch(err =>
        console.error("[Push] Erro na limpeza de logs:", err)
      );
    }, CLEANUP_INTERVAL_MS);
  }, delayToFirstCleanup);
}

/**
 * Limpa logs de notificações com mais de 90 dias.
 */
async function cleanupOldLogs(): Promise<void> {
  console.log("[Cleanup] Iniciando limpeza de logs com mais de 90 dias...");
  const deleted = await deleteOldNotificationLogs(90);
  if (deleted > 0) {
    console.log("[Cleanup] Limpeza concluída com sucesso.");
  } else {
    console.log("[Cleanup] Nenhum log antigo encontrado para deletar.");
  }
}
