/**
 * pushNotifications.ts
 * Módulo responsável por enviar notificações push via Web Push API (VAPID).
 * Inclui função de envio individual, envio em massa e job agendado
 * que verifica voos com partida em ~24h e notifica todos os dispositivos.
 */

import webpush from "web-push";
import { ENV } from "./_core/env";
import { getAllPushSubscriptions, getAllFlightWeeks, deletePushSubscription, getNotificationSettings, insertNotificationLog } from "./db";

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
  if (dt.includes('+') || dt.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dt)) {
    return new Date(dt);
  }
  // Adicionar -03:00 (Brasília)
  return new Date(dt + '-03:00');
}

/**
 * Verifica os voos dentro das janelas configuradas (aviso1 e aviso2) e envia notificações push.
 * Deve ser chamado periodicamente (ex: a cada hora).
 */
export async function checkAndNotifyUpcomingFlights(): Promise<void> {
  ensureVapidConfigured();
  if (!vapidConfigured) return;

  const weeks = await getAllFlightWeeks();
  const settings = await getNotificationSettings();
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

  console.log(`[Push] Verificando ${weeks.filter(w => w.isTicketIssued).length} voos emitidos. Avisos ativos: ${avisos.map(a => formatMinutes(a.minutes)).join(', ') || 'nenhum'}. Hora atual (UTC): ${now.toISOString()}`);

  for (const aviso of avisos) {
    // Janela de ±50 min ao redor do horário configurado
    // (job roda a cada hora; ±50min garante que reinicializacoes do servidor nao percam a janela)
    const targetMs = aviso.minutes * 60 * 1000;
    const windowStart = new Date(now.getTime() + targetMs - 50 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + targetMs + 50 * 60 * 1000);
    const antecedenciaLabel = formatMinutes(aviso.minutes);
    console.log(`[Push] ${aviso.label} (${antecedenciaLabel}): janela ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);

    for (const week of weeks) {
      if (!week.isTicketIssued) continue;

      // Verificar voo de ida
      if (week.departureFlightDatetime) {
        const departureTime = parseBrasiliaDatetime(week.departureFlightDatetime);
        if (isNaN(departureTime.getTime())) continue;
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
          const sentDepCount = await sendPushToAll({
            title: `✈️ ${antecedenciaLabel} — ${airline} ${flightNum}`,
            body: `Voo de ida GRU → NVT: ${dateStr} às ${timeStr}. Prepare-se! 🧳`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: `departure-week-${week.weekNumber}-aviso${aviso.minutes}`,
            data: { weekNumber: week.weekNumber, direction: "departure" },
          });
          const totalDepDevices = (await getAllPushSubscriptions()).length;
          await insertNotificationLog({
            weekNumber: Number(week.weekNumber),
            direction: "ida",
            avisoLabel: aviso.label,
            avisoMinutes: aviso.minutes,
            airline: week.departureAirline ?? null,
            flightNumber: week.departureFlightNumber ?? null,
            flightDatetime: week.departureFlightDatetime ?? null,
            status: sentDepCount === totalDepDevices ? "success" : sentDepCount > 0 ? "partial" : "failed",
            devicesReached: sentDepCount,
            totalDevices: totalDepDevices,
            isTest: 0,
          });
          console.log(`[Push] ${aviso.label} (${antecedenciaLabel}) de ida enviado para semana ${week.weekNumber}`);
        }
      }

      // Verificar voo de volta
      if (week.returnFlightDatetime) {
        const returnTime = parseBrasiliaDatetime(week.returnFlightDatetime);
        if (isNaN(returnTime.getTime())) continue;
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
          const sentRetCount = await sendPushToAll({
            title: `🏠 ${antecedenciaLabel} — ${airline} ${flightNum}`,
            body: `Voo de volta NVT → GRU: ${dateStr} às ${timeStr}. Boa viagem! ✈️`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: `return-week-${week.weekNumber}-aviso${aviso.minutes}`,
            data: { weekNumber: week.weekNumber, direction: "return" },
          });
          const totalRetDevices = (await getAllPushSubscriptions()).length;
          await insertNotificationLog({
            weekNumber: Number(week.weekNumber),
            direction: "volta",
            avisoLabel: aviso.label,
            avisoMinutes: aviso.minutes,
            airline: week.returnAirline ?? null,
            flightNumber: week.returnFlightNumber ?? null,
            flightDatetime: week.returnFlightDatetime ?? null,
            status: sentRetCount === totalRetDevices ? "success" : sentRetCount > 0 ? "partial" : "failed",
            devicesReached: sentRetCount,
            totalDevices: totalRetDevices,
            isTest: 0,
          });
          console.log(`[Push] ${aviso.label} (${antecedenciaLabel}) de volta enviado para semana ${week.weekNumber}`);
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
