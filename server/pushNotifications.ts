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
  claimNotificationDelivery,
  completeNotificationDelivery,
  deleteOldNotificationLogs,
  insertNotificationLogs,
} from "./db";
import { type InsertNotificationLog } from "../drizzle/schema";
import { type FlightWeek } from "../drizzle/schema";
import { isScheduledRequest } from "./_core/scheduledAuth";
import type { Request, Response } from "express";

export const SMART_FLY_PUSH_ICON = "/smartfly-assets/smartfly-sf-pwa-icon_783c04c6.webp";
export const SMART_FLY_PUSH_BADGE = "/smartfly-assets/smartfly-sf-apple-touch-icon_598faae4.png";

// Configurar VAPID uma única vez ao carregar o módulo
let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = ENV.vapidPublicKey || "";
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

interface AvisoWindow {
  aviso: { minutes: number; label: string };
  antecedenciaLabel: string;
  startMs: number;
  endMs: number;
}

type PushSubscriptions = Awaited<ReturnType<typeof getAllPushSubscriptions>>;

function createDeliveryKey(
  week: FlightWeek,
  direction: "ida" | "volta",
  avisoMinutes: number,
  flightDatetime: string
): string {
  return [week.year, week.weekNumber, direction, avisoMinutes, flightDatetime].join(":");
}

async function processDepartureFlight(
  week: FlightWeek,
  departureTime: Date,
  departureTimeMs: number,
  avisoWindow: AvisoWindow,
  pushSubscriptions: PushSubscriptions,
  airlineNames: Record<string, string>,
  logs: InsertNotificationLog[]
): Promise<void> {
  const { aviso, antecedenciaLabel, startMs, endMs } = avisoWindow;

  if (
    isNaN(departureTimeMs) ||
    departureTimeMs < startMs ||
    departureTimeMs > endMs
  ) {
    return;
  }

  const totalDepDevices = pushSubscriptions.length;
  const deliveryKey = createDeliveryKey(
    week,
    "ida",
    aviso.minutes,
    week.departureFlightDatetime ?? ""
  );
  const claimed = await claimNotificationDelivery({
    year: week.year,
    weekNumber: Number(week.weekNumber),
    direction: "ida",
    avisoLabel: aviso.label,
    avisoMinutes: aviso.minutes,
    airline: week.departureAirline ?? null,
    flightNumber: week.departureFlightNumber ?? null,
    flightDatetime: week.departureFlightDatetime ?? null,
    status: "processing",
    devicesReached: 0,
    totalDevices: totalDepDevices,
    isTest: 0,
    deliveryKey,
  });
  if (!claimed) return;

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
      body: `Horário planejado — ida GRU → NVT: ${dateStr} às ${timeStr}. Prepare-se! 🧳`,
      icon: SMART_FLY_PUSH_ICON,
      badge: SMART_FLY_PUSH_BADGE,
      tag: `departure-${week.year}-week-${week.weekNumber}-aviso${aviso.minutes}`,
      data: { year: week.year, weekNumber: week.weekNumber, direction: "departure" },
    },
    pushSubscriptions
  );

  const departureStatus =
    sentDepCount === totalDepDevices
      ? "success"
      : sentDepCount > 0
        ? "partial"
        : "failed";
  await completeNotificationDelivery(deliveryKey, {
    status: departureStatus,
    devicesReached: sentDepCount,
    totalDevices: totalDepDevices,
  });
  logs.push({
    weekNumber: Number(week.weekNumber),
    direction: "ida",
    avisoLabel: aviso.label,
    avisoMinutes: aviso.minutes,
    airline: week.departureAirline ?? null,
    flightNumber: week.departureFlightNumber ?? null,
    flightDatetime: week.departureFlightDatetime ?? null,
    status: departureStatus,
    devicesReached: sentDepCount,
    totalDevices: totalDepDevices,
    isTest: 0,
  });
}

async function processReturnFlight(
  week: FlightWeek,
  returnTime: Date,
  returnTimeMs: number,
  avisoWindow: AvisoWindow,
  pushSubscriptions: PushSubscriptions,
  airlineNames: Record<string, string>,
  logs: InsertNotificationLog[]
): Promise<void> {
  const { aviso, antecedenciaLabel, startMs, endMs } = avisoWindow;

  if (isNaN(returnTimeMs) || returnTimeMs < startMs || returnTimeMs > endMs) {
    return;
  }

  const totalRetDevices = pushSubscriptions.length;
  const deliveryKey = createDeliveryKey(
    week,
    "volta",
    aviso.minutes,
    week.returnFlightDatetime ?? ""
  );
  const claimed = await claimNotificationDelivery({
    year: week.year,
    weekNumber: Number(week.weekNumber),
    direction: "volta",
    avisoLabel: aviso.label,
    avisoMinutes: aviso.minutes,
    airline: week.returnAirline ?? null,
    flightNumber: week.returnFlightNumber ?? null,
    flightDatetime: week.returnFlightDatetime ?? null,
    status: "processing",
    devicesReached: 0,
    totalDevices: totalRetDevices,
    isTest: 0,
    deliveryKey,
  });
  if (!claimed) return;

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

  const sentRetCount = await sendPushToAll(
    {
      title: `🏠 ${antecedenciaLabel} — ${airline} ${flightNum}`,
      body: `Horário planejado — volta NVT → GRU: ${dateStr} às ${timeStr}. Boa viagem! ✈️`,
      icon: SMART_FLY_PUSH_ICON,
      badge: SMART_FLY_PUSH_BADGE,
      tag: `return-${week.year}-week-${week.weekNumber}-aviso${aviso.minutes}`,
      data: { year: week.year, weekNumber: week.weekNumber, direction: "return" },
    },
    pushSubscriptions
  );

  const returnStatus =
    sentRetCount === totalRetDevices
      ? "success"
      : sentRetCount > 0
        ? "partial"
        : "failed";
  await completeNotificationDelivery(deliveryKey, {
    status: returnStatus,
    devicesReached: sentRetCount,
    totalDevices: totalRetDevices,
  });
  logs.push({
    weekNumber: Number(week.weekNumber),
    direction: "volta",
    avisoLabel: aviso.label,
    avisoMinutes: aviso.minutes,
    airline: week.returnAirline ?? null,
    flightNumber: week.returnFlightNumber ?? null,
    flightDatetime: week.returnFlightDatetime ?? null,
    status: returnStatus,
    devicesReached: sentRetCount,
    totalDevices: totalRetDevices,
    isTest: 0,
  });
}

export async function checkAndNotifyUpcomingFlights(): Promise<void> {
  const logsToInsert: InsertNotificationLog[] = [];
  ensureVapidConfigured();
  if (!vapidConfigured) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const isCloseToNewYear = now.getMonth() === 11 && now.getDate() >= 29;
  const yearsToCheck = isCloseToNewYear
    ? [currentYear, currentYear + 1]
    : [currentYear];

  const settings = await getNotificationSettings();
  if (settings.flightPushEnabled === false) return;

  // Buscar somente exercícios que podem conter voos iminentes.
  const [weeksByYear, pushSubscriptions] = await Promise.all([
    Promise.all(yearsToCheck.map(year => getAllFlightWeeks(year))),
    // Buscar subscriptions uma única vez antes do loop para evitar N+1 queries ao banco
    getAllPushSubscriptions(),
  ]);
  const weeks = weeksByYear.flat();

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

  const nowTime = now.getTime();

  // ⚡ Bolt: Pre-calculate windows with primitive numbers instead of Date objects to reduce inner loop allocations
  const avisoWindows = avisos.map(aviso => {
    const targetMs = aviso.minutes * 60 * 1000;
    const startMs = nowTime + targetMs - 50 * 60 * 1000;
    const endMs = nowTime + targetMs + 50 * 60 * 1000;
    return {
      aviso,
      antecedenciaLabel: formatMinutes(aviso.minutes),
      startMs,
      endMs,
    };
  });

  // ⚡ Bolt: Use a single pass loop combining weeks and avisos checks to reduce memory allocations and avoid O(N*M) nested Date mapping
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    if (!week.isTicketIssued) continue;

    const departureTime = week.departureFlightDatetime
      ? parseBrasiliaDatetime(week.departureFlightDatetime)
      : null;
    const returnTime = week.returnFlightDatetime
      ? parseBrasiliaDatetime(week.returnFlightDatetime)
      : null;

    const departureTimeMs = departureTime ? departureTime.getTime() : NaN;
    const returnTimeMs = returnTime ? returnTime.getTime() : NaN;

    if (isNaN(departureTimeMs) && isNaN(returnTimeMs)) continue;

    for (let j = 0; j < avisoWindows.length; j++) {
      const avisoWindow = avisoWindows[j];

      if (departureTime) {
        await processDepartureFlight(
          week,
          departureTime,
          departureTimeMs,
          avisoWindow,
          pushSubscriptions,
          airlineNames,
          logsToInsert
        );
      }

      if (returnTime) {
        await processReturnFlight(
          week,
          returnTime,
          returnTimeMs,
          avisoWindow,
          pushSubscriptions,
          airlineNames,
          logsToInsert
        );
      }
    }
  }

  // ⚡ Bolt: Batch insert all notification logs to avoid N+1 database queries
  if (logsToInsert.length > 0) {
    await insertNotificationLogs(logsToInsert);
  }
}

/** Endpoint idempotente executado somente pela plataforma de agendamento. */
export async function runScheduledFlightNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isScheduledRequest(req)) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    await checkAndNotifyUpcomingFlights();
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Push] Falha no callback agendado:", message);
    res.status(500).json({
      error: message,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
