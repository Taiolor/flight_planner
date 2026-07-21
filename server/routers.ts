import { COOKIE_NAME } from "@shared/const";
import { quotesRouter } from "./routers/quotes";
import crypto from "crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllFlightWeeks,
  getFlightWeek,
  getAllFlightPrices,
  getPublicPrices,
  upsertFlightWeek,
  updateFlightWeekStatus,
  initFlightWeeks,
  upsertFlightPrice,
  deleteFlightPrice,
  createAuthSession,
  validateAuthSession,
  deleteAuthSession,
  savePushSubscription,
  deletePushSubscription,
  getPushSubscriptionByEndpoint,
  getAllPushSubscriptions,
  getNotificationSettings,
  updateNotificationSettings,
  insertNotificationLog,
  getNotificationLogs,
  getTicketNotificationEmails,
  addTicketNotificationEmail,
  removeTicketNotificationEmail,
  updateTicketNotificationEmail,
} from "./db";
import {
  sendTicketNotificationEmail,
  sendTestEmail,
  sendShareByEmailNotification,
  type TicketChangeNotification,
} from "./_core/emailNotification";
import {
  createFlightCalendarEvent,
  createRoundTripCalendarEvents,
  type FlightEvent,
} from "./_core/calendarIntegration";
import {
  getGoogleCalendarLink,
  getOutlookLink,
  airportAddresses,
  buildFlightTrackUrl,
  formatDateToBrazilian,
} from "./_core/calendarHelper";
import { ENV } from "./_core/env";
import { parse } from "cookie";
import {
  SESSION_COOKIE,
  getSessionFromCookie,
  flightProtectedProcedure,
} from "./flightAuthMiddleware";

interface NextAlert {
  weekNumber: number;
  direction: "ida" | "volta";
  avisoLabel: string;
  avisoMinutes: number;
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  flightDatetime: string;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // =====================
  // Autenticação por e-mail + senha
  // =====================
  flightAuth: router({
    // Login com e-mail e senha
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const allowedEmail = process.env.AUTH_EMAIL;
        const allowedPassword = process.env.AUTH_PASSWORD;

        if (!allowedEmail || !allowedPassword) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Authentication is not configured on the server.",
          });
        }

        // Comparação timing-safe com SHA-256 para prevenir timing side-channel attacks
        // Hash SHA-256 garante buffers de tamanho fixo (32 bytes), eliminando length leakage
        const givenEmailHash = crypto
          .createHash("sha256")
          .update(input.email.toLowerCase().trim())
          .digest();
        const expectedEmailHash = crypto
          .createHash("sha256")
          .update(allowedEmail.toLowerCase().trim())
          .digest();
        const emailMatch = crypto.timingSafeEqual(
          givenEmailHash,
          expectedEmailHash
        );

        const givenPasswordHash = crypto
          .createHash("sha256")
          .update(input.password)
          .digest();
        const expectedPasswordHash = crypto
          .createHash("sha256")
          .update(allowedPassword)
          .digest();
        const passwordMatch = crypto.timingSafeEqual(
          givenPasswordHash,
          expectedPasswordHash
        );

        if (!emailMatch || !passwordMatch) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "E-mail ou senha incorretos.",
          });
        }

        const token = await createAuthSession(input.email);

        // Definir cookie de sessão (8 horas)
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(SESSION_COOKIE, token, {
          ...cookieOptions,
          maxAge: 8 * 60 * 60 * 1000,
        });

        return { success: true, email: input.email };
      }),

    // Verificar sessão atual
    check: publicProcedure.query(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session) return { authenticated: false, email: null };
      return { authenticated: true, email: session.email };
    }),

    // Logout da sessão de passagens
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieHeader = ctx.req.headers?.cookie ?? "";
      const cookies = parse(cookieHeader);
      const sessionToken = cookies[SESSION_COOKIE];
      if (sessionToken) {
        await deleteAuthSession(sessionToken);
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // =====================
  // Push Notifications
  // =====================
  push: router({
    // Retorna a chave pública VAPID para o frontend criar a subscription
    getVapidPublicKey: publicProcedure.query(() => {
      return {
        publicKey:
          ENV.vapidPublicKey || process.env.VITE_VAPID_PUBLIC_KEY || "",
      };
    }),

    // Salvar subscription do dispositivo
    subscribe: flightProtectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await savePushSubscription({
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent ?? null,
        });
        return { success: true };
      }),

    // Remover subscription do dispositivo
    unsubscribe: publicProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        await deletePushSubscription(input.endpoint);
        return { success: true };
      }),

    // Verificar se este dispositivo já tem subscription ativa
    checkSubscription: publicProcedure
      .input(z.object({ endpoint: z.string() }))
      .query(async ({ input }) => {
        const sub = await getPushSubscriptionByEndpoint(input.endpoint);
        return { subscribed: !!sub };
      }),

    // Enviar notificação de teste
    sendTest: flightProtectedProcedure.mutation(async () => {
      const { sendPushToAll } = await import("./pushNotifications");
      const sent = await sendPushToAll({
        title: "✈️ Smart Fly — Teste",
        body: "Notificações push estão funcionando!",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "test",
      });
      const totalDevices = (await getAllPushSubscriptions()).length;
      await insertNotificationLog({
        weekNumber: 0,
        direction: "ida",
        avisoLabel: "Teste Manual",
        avisoMinutes: 0,
        airline: null,
        flightNumber: null,
        flightDatetime: null,
        status: sent > 0 ? "success" : "failed",
        devicesReached: sent,
        totalDevices,
        isTest: 1,
      });
      return { success: true, sent };
    }),
  }),

  // =====================
  // Voos (protegidos por sessão para mutações)
  // =====================
  flights: router({
    // Buscar todas as semanas (público)
    getWeeks: publicProcedure.query(async ({ ctx }) => {
      const weeks = await getAllFlightWeeks();
      const session = await getSessionFromCookie(ctx.req);
      if (session) {
        return weeks;
      }

      // Se não estiver autenticado, omitir dados sensíveis
      return weeks.map(w => ({
        ...w,
        departureLocator: null,
        returnLocator: null,
        departureFlightNumber: null,
        returnFlightNumber: null,
        departureTerminal: null,
        returnTerminal: null,
        smilesPoints: null,
        latamPassPoints: null,
      }));
    }),

    // Buscar todos os preços
    getPrices: flightProtectedProcedure.query(async () => {
      return getAllFlightPrices();
    }),

    getPublicPrices: publicProcedure.query(async () => {
      return getPublicPrices();
    }),

    // Inicializar semanas com dados padrão (só roda se não houver dados)
    initWeeks: flightProtectedProcedure
      .input(
        z.array(
          z.object({
            weekNumber: z.number(),
            departureDate: z.string(),
            returnDate: z.string(),
            departureDayOfWeek: z.string(),
            returnDayOfWeek: z.string(),
            holiday: z.string().nullable().optional(),
          })
        )
      )
      .mutation(async ({ input }) => {
        await initFlightWeeks(
          input.map(w => ({
            weekNumber: w.weekNumber,
            departureDate: w.departureDate,
            returnDate: w.returnDate,
            departureDayOfWeek: w.departureDayOfWeek,
            returnDayOfWeek: w.returnDayOfWeek,
            holiday: w.holiday ?? null,
            isDeleted: 0,
            isTicketIssued: 0,
            isSelected: 0,
          }))
        );
        return { success: true };
      }),

    // Atualizar status de uma semana (requer autenticação)
    updateWeekStatus: flightProtectedProcedure
      .input(
        z.object({
          year: z.number().default(2026).optional(),
          weekNumber: z.number(),
          isDeleted: z.number().optional(),
          isTicketIssued: z.number().optional(),
          isSelected: z.number().optional(),
          departureAirline: z.string().nullable().optional(),
          returnAirline: z.string().nullable().optional(),
          departureFlightDatetime: z.string().nullable().optional(),
          returnFlightDatetime: z.string().nullable().optional(),
          departureAirport: z.string().nullable().optional(),
          returnAirport: z.string().nullable().optional(),
          departureLocator: z.string().nullable().optional(),
          returnLocator: z.string().nullable().optional(),
          departureFlightNumber: z.string().nullable().optional(),
          returnFlightNumber: z.string().nullable().optional(),
          ticketType: z.string().nullable().optional(),
          smilesPoints: z.number().nullable().optional(),
          latamPassPoints: z.number().nullable().optional(),
          departureRescheduled: z.number().optional(),
          returnRescheduled: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Get the week before update to detect changes
        const weekBefore = await getFlightWeek(input.weekNumber);

        await updateFlightWeekStatus(input.weekNumber, {
          isDeleted: input.isDeleted,
          isTicketIssued: input.isTicketIssued,
          isSelected: input.isSelected,
          departureAirline: input.departureAirline,
          returnAirline: input.returnAirline,
          departureFlightDatetime: input.departureFlightDatetime,
          returnFlightDatetime: input.returnFlightDatetime,
          departureAirport: input.departureAirport,
          returnAirport: input.returnAirport,
          departureLocator: input.departureLocator,
          returnLocator: input.returnLocator,
          departureFlightNumber: input.departureFlightNumber,
          returnFlightNumber: input.returnFlightNumber,
          ticketType: input.ticketType,
          smilesPoints: input.smilesPoints,
          latamPassPoints: input.latamPassPoints,
          departureRescheduled: input.departureRescheduled,
          returnRescheduled: input.returnRescheduled,
        });

        // Send email notifications if ticket was issued or modified
        if (weekBefore) {
          const wasIssued = weekBefore.isTicketIssued === 1;
          const nowIssued =
            input.isTicketIssued !== undefined
              ? input.isTicketIssued === 1
              : wasIssued;

          const isMarkedAsIssued = !wasIssued && nowIssued;
          const isDeleted = wasIssued && !nowIssued;
          const isUpdated = wasIssued && nowIssued;

          // Optimization: Only query DB for recipients once if we actually need to send an email
          const needsEmail = isMarkedAsIssued || isDeleted || isUpdated;
          const recipients = needsEmail
            ? await getTicketNotificationEmails()
            : [];

          if (isMarkedAsIssued) {
            // Ticket was just marked as issued - send email with full details
            if (
              recipients.length > 0 &&
              input.departureFlightNumber &&
              input.returnFlightNumber
            ) {
              // Parse datetime strings to extract date and time
              const departureDatetime = input.departureFlightDatetime
                ? new Date(input.departureFlightDatetime)
                : null;
              const returnDatetime = input.returnFlightDatetime
                ? new Date(input.returnFlightDatetime)
                : null;

              if (departureDatetime && returnDatetime) {
                // Formatar datas no padrão brasileiro (DD/MM/YYYY)
                const pad = (n: number) => String(n).padStart(2, "0");
                const formatBrazilianDate = (date: Date) =>
                  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

                const departureDate = formatBrazilianDate(departureDatetime);
                const departureTime = departureDatetime.toLocaleTimeString(
                  "pt-BR",
                  { hour: "2-digit", minute: "2-digit" }
                );
                const returnDate = formatBrazilianDate(returnDatetime);
                const returnTime = returnDatetime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                // Preparar eventos de calendário para envio automático
                const depEvent = {
                  title: `✈️ Voo IDA ${input.departureAirline?.toUpperCase() || "N/A"} ${input.departureFlightNumber} — ${input.departureAirport} → ${input.returnAirport}`,
                  flightDatetime: `${departureDatetime.getFullYear()}-${pad(departureDatetime.getMonth() + 1)}-${pad(departureDatetime.getDate())}T${departureTime.replace(/\s/g, "")}`,
                  location:
                    airportAddresses[input.departureAirport || "GRU"] ||
                    input.departureAirport ||
                    "N/A",
                  description: `Localizador: ${input.departureLocator || "N/A"}\nCompanhia: ${input.departureAirline?.toUpperCase() || "N/A"}\nNúmero: ${input.departureFlightNumber}${(input as any).departureTerminal ? `\nTerminal: ${(input as any).departureTerminal}` : ""}`,
                  leadMinutes: 120,
                };

                const retEvent = {
                  title: `✈️ Voo VOLTA ${input.returnAirline?.toUpperCase() || "N/A"} ${input.returnFlightNumber} — ${input.returnAirport} → ${input.departureAirport}`,
                  flightDatetime: `${returnDate.split("/").reverse().join("-")}T${returnTime.replace(/\s/g, "")}`,
                  location:
                    airportAddresses[input.returnAirport || "NVT"] ||
                    input.returnAirport ||
                    "N/A",
                  description: `Localizador: ${input.returnLocator || "N/A"}\nCompanhia: ${input.returnAirline?.toUpperCase() || "N/A"}\nNúmero: ${input.returnFlightNumber}${(input as any).returnTerminal ? `\nTerminal: ${(input as any).returnTerminal}` : ""}`,
                  leadMinutes: 120,
                };

                // Gerar links de rastreamento de voo
                const depTrackUrl = buildFlightTrackUrl(
                  input.departureAirline || "",
                  input.departureFlightNumber || "",
                  input.departureAirport || "GRU",
                  input.returnAirport || "NVT",
                  `${departureDatetime.getFullYear()}-${pad(departureDatetime.getMonth() + 1)}-${pad(departureDatetime.getDate())}`
                );

                const retTrackUrl = buildFlightTrackUrl(
                  input.returnAirline || "",
                  input.returnFlightNumber || "",
                  input.returnAirport || "NVT",
                  input.departureAirport || "GRU",
                  `${returnDatetime.getFullYear()}-${pad(returnDatetime.getMonth() + 1)}-${pad(returnDatetime.getDate())}`
                );

                const googleDepLink = getGoogleCalendarLink(depEvent, 120, 75);
                const outlookDepLink = getOutlookLink(depEvent, 120, 75);
                const googleRetLink = getGoogleCalendarLink(retEvent, 120, 75);
                const outlookRetLink = getOutlookLink(retEvent, 120, 75);

                // Construir HTML do e-mail
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Compartilhamento de Bilhetes ✈️</h2>
                    <p style="color: #4b5563; margin-bottom: 20px;"><strong>Semana ${input.weekNumber}</strong></p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                      <h3 style="color: #1f2937; margin-top: 0;">Voo de Ida 🛫</h3>
                      <p style="margin: 8px 0;"><strong>Data:</strong> ${departureDate} às ${departureTime}</p>
                      <p style="margin: 8px 0;"><strong>Rota:</strong> ${input.departureAirport} → ${input.returnAirport}</p>
                      <p style="margin: 8px 0;"><strong>Companhia:</strong> ${input.departureAirline?.toUpperCase() || "N/A"} ${input.departureFlightNumber}</p>
                      ${(input as any).departureTerminal ? `<p style="margin: 8px 0;"><strong>Terminal:</strong> ${(input as any).departureTerminal}</p>` : ""}
                      <p style="margin: 8px 0;"><strong>Localizador:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${input.departureLocator || "N/A"}</code></p>
                      <p style="margin: 8px 0;">
                        <a href="${outlookDepLink}" style="color: #0078d4; margin-right: 10px; text-decoration: none;">📅 Outlook • Ida</a>
                        <a href="${googleDepLink}" style="color: #1f2937; margin-right: 10px; text-decoration: none;">📅 Google • Ida</a>
                        ${depTrackUrl ? `<a href="${depTrackUrl}" style="color: #059669; margin-right: 10px; text-decoration: none;">🔍 Rastrear Ida</a>` : ""}
                      </p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                      <h3 style="color: #1f2937; margin-top: 0;">Voo de Volta 🛬</h3>
                      <p style="margin: 8px 0;"><strong>Data:</strong> ${returnDate} às ${returnTime}</p>
                      <p style="margin: 8px 0;"><strong>Rota:</strong> ${input.returnAirport} → ${input.departureAirport}</p>
                      <p style="margin: 8px 0;"><strong>Companhia:</strong> ${input.returnAirline?.toUpperCase() || "N/A"} ${input.returnFlightNumber}</p>
                      ${(input as any).returnTerminal ? `<p style="margin: 8px 0;"><strong>Terminal:</strong> ${(input as any).returnTerminal}</p>` : ""}
                      <p style="margin: 8px 0;"><strong>Localizador:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${input.returnLocator || "N/A"}</code></p>
                      <p style="margin: 8px 0;">
                        <a href="${outlookRetLink}" style="color: #0078d4; margin-right: 10px; text-decoration: none;">📅 Outlook • Volta</a>
                        <a href="${googleRetLink}" style="color: #1f2937; margin-right: 10px; text-decoration: none;">📅 Google • Volta</a>
                        ${retTrackUrl ? `<a href="${retTrackUrl}" style="color: #059669; margin-right: 10px; text-decoration: none;">🔍 Rastrear Volta</a>` : ""}
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                      Compartilhado via Smart Fly - Planejador de Passagens Aéreas 2026
                    </p>
                  </div>
                `;

                const emailAddresses = recipients.map(r => r.email);
                await sendShareByEmailNotification(
                  emailAddresses,
                  `Compartilhamento de Bilhetes - Semana ${input.weekNumber}`,
                  emailHtml
                );
              }
            }
          } else if (isDeleted) {
            // Ticket was deleted
            if (recipients.length > 0) {
              const recipientEmails = recipients.map(r => r.email);

              // Send for departure ticket
              if (weekBefore.departureFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "deleted",
                  weekNumber: input.weekNumber,
                  ticketType: "departure",
                  timestamp: new Date(),
                  departureFlightNumber:
                    weekBefore.departureFlightNumber ?? undefined,
                  departureFlightDatetime:
                    weekBefore.departureFlightDatetime ?? undefined,
                  departureAirline: weekBefore.departureAirline ?? undefined,
                  departureLocator: weekBefore.departureLocator ?? undefined,
                  returnFlightNumber:
                    weekBefore.returnFlightNumber ?? undefined,
                  returnFlightDatetime:
                    weekBefore.returnFlightDatetime ?? undefined,
                  returnAirline: weekBefore.returnAirline ?? undefined,
                  returnLocator: weekBefore.returnLocator ?? undefined,
                  departureDate: weekBefore.departureDate ?? undefined,
                  returnDate: weekBefore.returnDate ?? undefined,
                });
              }

              // Send for return ticket
              if (weekBefore.returnFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "deleted",
                  weekNumber: input.weekNumber,
                  ticketType: "return",
                  timestamp: new Date(),
                  departureFlightNumber:
                    weekBefore.departureFlightNumber ?? undefined,
                  departureFlightDatetime:
                    weekBefore.departureFlightDatetime ?? undefined,
                  departureAirline: weekBefore.departureAirline ?? undefined,
                  departureLocator: weekBefore.departureLocator ?? undefined,
                  returnFlightNumber:
                    weekBefore.returnFlightNumber ?? undefined,
                  returnFlightDatetime:
                    weekBefore.returnFlightDatetime ?? undefined,
                  returnAirline: weekBefore.returnAirline ?? undefined,
                  returnLocator: weekBefore.returnLocator ?? undefined,
                  departureDate: weekBefore.departureDate ?? undefined,
                  returnDate: weekBefore.returnDate ?? undefined,
                });
              }
            }
          } else if (isUpdated) {
            // Ticket was updated - detect changes
            if (recipients.length > 0) {
              const recipientEmails = recipients.map(r => r.email);
              const changes: Record<string, any> = {};

              // Check departure changes
              if (
                weekBefore.departureFlightNumber !==
                  input.departureFlightNumber ||
                weekBefore.departureFlightDatetime !==
                  input.departureFlightDatetime ||
                weekBefore.departureAirline !== input.departureAirline ||
                weekBefore.departureLocator !== input.departureLocator
              ) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "updated",
                  weekNumber: input.weekNumber,
                  ticketType: "departure",
                  changes: {
                    before: {
                      flightNumber: weekBefore.departureFlightNumber,
                      datetime: weekBefore.departureFlightDatetime,
                      airline: weekBefore.departureAirline,
                      locator: weekBefore.departureLocator,
                    },
                    after: {
                      flightNumber: input.departureFlightNumber,
                      datetime: input.departureFlightDatetime,
                      airline: input.departureAirline,
                      locator: input.departureLocator,
                    },
                  },
                  timestamp: new Date(),
                  departureFlightNumber:
                    input.departureFlightNumber ?? undefined,
                  departureFlightDatetime:
                    input.departureFlightDatetime ?? undefined,
                  departureAirline: input.departureAirline ?? undefined,
                  departureLocator: input.departureLocator ?? undefined,
                  returnFlightNumber: input.returnFlightNumber ?? undefined,
                  returnFlightDatetime: input.returnFlightDatetime ?? undefined,
                  returnAirline: input.returnAirline ?? undefined,
                  returnLocator: input.returnLocator ?? undefined,
                  departureDate: weekBefore.departureDate ?? undefined,
                  returnDate: weekBefore.returnDate ?? undefined,
                });
              }

              // Check return changes
              if (
                weekBefore.returnFlightNumber !== input.returnFlightNumber ||
                weekBefore.returnFlightDatetime !==
                  input.returnFlightDatetime ||
                weekBefore.returnAirline !== input.returnAirline ||
                weekBefore.returnLocator !== input.returnLocator
              ) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "updated",
                  weekNumber: input.weekNumber,
                  ticketType: "return",
                  changes: {
                    before: {
                      flightNumber: weekBefore.returnFlightNumber,
                      datetime: weekBefore.returnFlightDatetime,
                      airline: weekBefore.returnAirline,
                      locator: weekBefore.returnLocator,
                    },
                    after: {
                      flightNumber: input.returnFlightNumber,
                      datetime: input.returnFlightDatetime,
                      airline: input.returnAirline,
                      locator: input.returnLocator,
                    },
                  },
                  timestamp: new Date(),
                  departureFlightNumber:
                    input.departureFlightNumber ?? undefined,
                  departureFlightDatetime:
                    input.departureFlightDatetime ?? undefined,
                  departureAirline: input.departureAirline ?? undefined,
                  departureLocator: input.departureLocator ?? undefined,
                  returnFlightNumber: input.returnFlightNumber ?? undefined,
                  returnFlightDatetime: input.returnFlightDatetime ?? undefined,
                  returnAirline: input.returnAirline ?? undefined,
                  returnLocator: input.returnLocator ?? undefined,
                  departureDate: weekBefore.departureDate ?? undefined,
                  returnDate: weekBefore.returnDate ?? undefined,
                });
              }
            }
          }
        }

        return { success: true };
      }),

    // Editar datas de uma semana (requer autenticação)
    updateWeekDates: flightProtectedProcedure
      .input(
        z.object({
          weekNumber: z.number(),
          departureDate: z.string(),
          returnDate: z.string(),
          departureDayOfWeek: z.string(),
          returnDayOfWeek: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateFlightWeekStatus(input.weekNumber, {
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          departureDayOfWeek: input.departureDayOfWeek,
          returnDayOfWeek: input.returnDayOfWeek,
        });
        return { success: true };
      }),

    // Salvar preço de uma companhia para uma semana (requer autenticação)
    savePrice: flightProtectedProcedure
      .input(
        z.object({
          weekNumber: z.number(),
          airline: z.string(),
          price: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.price === "") {
          await deleteFlightPrice(input.weekNumber, input.airline);
        } else {
          await upsertFlightPrice(input.weekNumber, input.airline, input.price);
        }
        return { success: true };
      }),
  }),

  // =====================
  // Admin: Painel de Notificações
  // =====================
  adminNotifications: router({
    // Retorna status completo do sistema de notificações para o painel admin
    getStatus: flightProtectedProcedure.query(async () => {
      const [weeks, settings, subscriptions] = await Promise.all([
        getAllFlightWeeks(),
        getNotificationSettings(),
        getAllPushSubscriptions(),
      ]);

      const now = new Date();

      // Função para parsear datetime no fuso de Brasília
      function parseBrasiliaDatetime(dt: string): Date {
        if (!dt) return new Date(NaN);
        if (dt.includes("+") || dt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dt))
          return new Date(dt);
        return new Date(dt + "-03:00");
      }

      function formatMinutes(minutes: number): string {
        if (minutes >= 60 && minutes % 60 === 0)
          return `${minutes / 60}h antes`;
        return `${minutes}min antes`;
      }

      // Calcular próximas notificações agendadas
      const avisos = [
        { minutes: settings.aviso1Minutes, label: "Aviso 1" },
        { minutes: settings.aviso2Minutes, label: "Aviso 2" },
      ].filter(a => a.minutes > 0);

      const scheduledAlerts: Array<{
        weekNumber: number;
        direction: "ida" | "volta";
        avisoLabel: string;
        avisoMinutes: number;
        flightDatetime: string;
        alertDatetime: string;
        airline: string;
        flightNumber: string;
        status: "pending" | "sent" | "past";
        minutesUntilAlert: number;
        _alertTimeMs?: number; // ⚡ Bolt: Fast sorting property
      }> = [];

      // ⚡ Bolt: Use a single pass loop to filter and map the issued weeks, reducing memory allocations
      const parsedIssuedWeeks = [];
      for (let i = 0; i < weeks.length; i++) {
        const w = weeks[i];
        if (w.isTicketIssued) {
          parsedIssuedWeeks.push({
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

      const nowMs = now.getTime();

      // ⚡ Bolt: Pre-calculate targetMs and window boundaries
      const precalculatedAvisos = avisos.map(aviso => {
        const targetMs = aviso.minutes * 60 * 1000;
        return {
          ...aviso,
          targetMs,
          windowStartMs: nowMs + targetMs - 50 * 60 * 1000,
          windowEndMs: nowMs + targetMs + 50 * 60 * 1000,
        };
      });

      for (const { week, departureTime, returnTime } of parsedIssuedWeeks) {
        // Voo de ida
        if (departureTime) {
          const depTimeMs = departureTime.getTime();
          if (!isNaN(depTimeMs)) {
            const depPast = depTimeMs < nowMs;
            const depDiffMs = depTimeMs - nowMs;
            for (const aviso of precalculatedAvisos) {
              const alertTimeMs = depTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (depDiffMs - aviso.targetMs) / 60000
              );

              let status: "pending" | "sent" | "past" = "pending";
              if (depPast) status = "past";
              else if (
                depTimeMs >= aviso.windowStartMs &&
                depTimeMs <= aviso.windowEndMs
              )
                status = "sent";

              scheduledAlerts.push({
                weekNumber: Number(week.weekNumber),
                direction: "ida",
                avisoLabel: aviso.label,
                avisoMinutes: aviso.minutes,
                flightDatetime: week.departureFlightDatetime!,
                alertDatetime: new Date(alertTimeMs).toISOString(),
                airline: week.departureAirline ?? "",
                flightNumber: week.departureFlightNumber ?? "",
                status,
                minutesUntilAlert,
                _alertTimeMs: alertTimeMs,
              });
            }
          }
        }

        // Voo de volta
        if (returnTime) {
          const retTimeMs = returnTime.getTime();
          if (!isNaN(retTimeMs)) {
            const retPast = retTimeMs < nowMs;
            const retDiffMs = retTimeMs - nowMs;
            for (const aviso of precalculatedAvisos) {
              const alertTimeMs = retTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (retDiffMs - aviso.targetMs) / 60000
              );

              let status: "pending" | "sent" | "past" = "pending";
              if (retPast) status = "past";
              else if (
                retTimeMs >= aviso.windowStartMs &&
                retTimeMs <= aviso.windowEndMs
              )
                status = "sent";

              scheduledAlerts.push({
                weekNumber: Number(week.weekNumber),
                direction: "volta",
                avisoLabel: aviso.label,
                avisoMinutes: aviso.minutes,
                flightDatetime: week.returnFlightDatetime!,
                alertDatetime: new Date(alertTimeMs).toISOString(),
                airline: week.returnAirline ?? "",
                flightNumber: week.returnFlightNumber ?? "",
                status,
                minutesUntilAlert,
                _alertTimeMs: alertTimeMs,
              });
            }
          }
        }
      }

      // Ordenar por data do alerta de forma otimizada
      scheduledAlerts.sort(
        (a, b) => (a._alertTimeMs ?? 0) - (b._alertTimeMs ?? 0)
      );

      // Remover a propriedade temporária usando a abordagem apropriada no TS
      scheduledAlerts.forEach(alert => {
        delete alert._alertTimeMs;
      });

      return {
        settings,
        subscriptions: subscriptions.map(s => ({
          endpoint: s.endpoint.slice(0, 60) + "...",
          userAgent: s.userAgent ?? "Desconhecido",
          createdAt: s.createdAt,
        })),
        totalSubscriptions: subscriptions.length,
        totalIssuedFlights: parsedIssuedWeeks.length,
        scheduledAlerts,
        serverTime: now.toISOString(),
        avisos: avisos.map(a => ({ ...a, label: formatMinutes(a.minutes) })),
      };
    }),

    // Enviar notificação de teste do próximo alerta agendado
    sendNextAlert: flightProtectedProcedure.mutation(async () => {
      const [weeks, settings] = await Promise.all([
        getAllFlightWeeks(),
        getNotificationSettings(),
      ]);
      const now = new Date();

      // Função para parsear datetime no fuso de Brasília
      function parseBrasiliaDatetime(dt: string): Date {
        if (!dt) return new Date(NaN);
        if (dt.includes("+") || dt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dt))
          return new Date(dt);
        return new Date(dt + "-03:00");
      }

      const avisos = [
        { minutes: settings.aviso1Minutes, label: "Aviso 1" },
        { minutes: settings.aviso2Minutes, label: "Aviso 2" },
      ].filter(a => a.minutes > 0);

      // Encontrar o próximo alerta
      let nextAlert: NextAlert | null = null;
      let minTimeUntilAlert = Infinity;

      // ⚡ Bolt: Eliminate intermediate parsedAlertWeeks array to reduce allocations
      const nowMsNext = now.getTime();

      const precalculatedAvisosNext = avisos.map(aviso => {
        return {
          ...aviso,
          targetMs: aviso.minutes * 60 * 1000,
        };
      });

      for (const week of weeks) {
        if (!week.isTicketIssued) continue;

        // Voo de ida
        if (week.departureFlightDatetime) {
          const departureTime = parseBrasiliaDatetime(
            week.departureFlightDatetime
          );
          const depTimeMs = departureTime.getTime();
          if (!isNaN(depTimeMs) && depTimeMs > nowMsNext) {
            for (const aviso of precalculatedAvisosNext) {
              const alertTimeMs = depTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (alertTimeMs - nowMsNext) / 60000
              );
              if (
                minutesUntilAlert > 0 &&
                minutesUntilAlert < minTimeUntilAlert
              ) {
                minTimeUntilAlert = minutesUntilAlert;
                nextAlert = {
                  weekNumber: week.weekNumber,
                  direction: "ida",
                  avisoLabel: aviso.label,
                  avisoMinutes: aviso.minutes,
                  airline: week.departureAirline,
                  flightNumber: week.departureFlightNumber,
                  departureAirport: week.departureAirport,
                  arrivalAirport: week.returnAirport,
                  flightDatetime: week.departureFlightDatetime!,
                };
              }
            }
          }
        }

        // Voo de volta
        if (week.returnFlightDatetime) {
          const returnTime = parseBrasiliaDatetime(week.returnFlightDatetime);
          const retTimeMs = returnTime.getTime();
          if (!isNaN(retTimeMs) && retTimeMs > nowMsNext) {
            for (const aviso of precalculatedAvisosNext) {
              const alertTimeMs = retTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (alertTimeMs - nowMsNext) / 60000
              );
              if (
                minutesUntilAlert > 0 &&
                minutesUntilAlert < minTimeUntilAlert
              ) {
                minTimeUntilAlert = minutesUntilAlert;
                nextAlert = {
                  weekNumber: week.weekNumber,
                  direction: "volta",
                  avisoLabel: aviso.label,
                  avisoMinutes: aviso.minutes,
                  airline: week.returnAirline,
                  flightNumber: week.returnFlightNumber,
                  departureAirport: week.returnAirport,
                  arrivalAirport: week.departureAirport,
                  flightDatetime: week.returnFlightDatetime!,
                };
              }
            }
          }
        }
      }

      if (!nextAlert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhum próximo alerta encontrado.",
        });
      }

      // Formatar a mensagem oficial do voo
      const flightTime = parseBrasiliaDatetime(nextAlert.flightDatetime);
      const timeStr = flightTime.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const dateStr = flightTime.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
      });

      // Enviar notificação com dados oficiais
      const { sendPushToAll } = await import("./pushNotifications");
      const sent = await sendPushToAll({
        title: `✈️ ${nextAlert.airline} ${nextAlert.flightNumber} - ${nextAlert.avisoLabel}`,
        body: `${nextAlert.direction === "ida" ? "Partida" : "Retorno"} em ${dateStr} às ${timeStr}\n${nextAlert.departureAirport} → ${nextAlert.arrivalAirport}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: `test-${nextAlert.weekNumber}`,
      });

      await insertNotificationLog({
        weekNumber: nextAlert.weekNumber,
        direction: nextAlert.direction,
        avisoLabel: nextAlert.avisoLabel,
        avisoMinutes: nextAlert.avisoMinutes,
        airline: nextAlert.airline,
        flightNumber: nextAlert.flightNumber,
        flightDatetime: nextAlert.flightDatetime,
        status: sent > 0 ? "success" : "failed",
        devicesReached: sent,
        totalDevices: (await getAllPushSubscriptions()).length,
        isTest: 1,
      });

      return { success: true, sent, nextAlert };
    }),

    // Retorna histórico persistente de envios
    getLogs: flightProtectedProcedure
      .input(z.object({ limit: z.number().min(1).max(500).optional() }))
      .query(async ({ input }) => {
        const logs = await getNotificationLogs(input?.limit ?? 100);
        return logs;
      }),
  }),

  // =====================
  // Notification Settings
  // =====================
  notificationSettings: router({
    // Buscar configurações atuais de agendamento
    get: flightProtectedProcedure.query(async () => {
      return getNotificationSettings();
    }),
    // Salvar configurações de agendamento
    update: flightProtectedProcedure
      .input(
        z.object({
          aviso1Minutes: z.number().min(0).max(2880),
          aviso2Minutes: z.number().min(0).max(2880),
        })
      )
      .mutation(async ({ input }) => {
        await updateNotificationSettings(
          input.aviso1Minutes,
          input.aviso2Minutes
        );
        return { success: true };
      }),
  }),

  // =====================
  // Cotações de Passagens (Sky Scrapper API + Kayak manual)
  // =====================
  quotes: quotesRouter,

  // =====================
  // Ticket Notification Emails
  // =====================
  ticketNotifications: router({
    /**
     * Get all ticket notification email recipients
     */
    getRecipients: flightProtectedProcedure.query(async () => {
      return await getTicketNotificationEmails();
    }),

    /**
     * Add a new ticket notification email recipient
     */
    addRecipient: flightProtectedProcedure
      .input(
        z.object({
          email: z.string().email("E-mail inválido"),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await addTicketNotificationEmail(
          input.email,
          input.name
        );
        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao adicionar e-mail de notificação",
          });
        }
        return result;
      }),

    /**
     * Remove a ticket notification email recipient
     */
    removeRecipient: flightProtectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ input }) => {
        const success = await removeTicketNotificationEmail(input.emailId);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao remover e-mail de notificação",
          });
        }
        return { success: true };
      }),

    /**
     * Update a ticket notification email recipient
     */
    updateRecipient: flightProtectedProcedure
      .input(
        z.object({
          emailId: z.number(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await updateTicketNotificationEmail(input.emailId, {
          name: input.name,
        });
        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao atualizar e-mail de notificação",
          });
        }
        return result;
      }),

    /**
     * Send test email to verify SMTP configuration
     */
    sendTestEmail: flightProtectedProcedure
      .input(z.object({ testEmail: z.string().email() }))
      .mutation(async ({ input }) => {
        const success = await sendTestEmail(input.testEmail);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao enviar e-mail de teste",
          });
        }
        return { success: true };
      }),

    shareByEmail: flightProtectedProcedure
      .input(
        z.object({
          weekNumber: z.number(),
          weekLabel: z.string(),
          departureDate: z.string(),
          departureTime: z.string(),
          departureAirport: z.string(),
          departureAirline: z.string(),
          departureFlightNumber: z.string(),
          departureLocator: z.string(),
          departureTerminal: z.string().optional(),
          returnDate: z.string(),
          returnTime: z.string(),
          returnAirport: z.string(),
          returnAirline: z.string(),
          returnFlightNumber: z.string(),
          returnLocator: z.string(),
          returnTerminal: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const emails = await getTicketNotificationEmails();
        if (emails.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum e-mail cadastrado",
          });
        }

        // Preparar eventos de calendário
        const depEvent = {
          title: `✈️ Voo IDA ${input.departureAirline.toUpperCase()} ${input.departureFlightNumber} — ${input.departureAirport} → ${input.returnAirport}`,
          flightDatetime: `${input.departureDate}T${input.departureTime}`,
          location:
            airportAddresses[input.departureAirport] || input.departureAirport,
          description: `Localizador: ${input.departureLocator}\nCompanhia: ${input.departureAirline.toUpperCase()}\nNúmero: ${input.departureFlightNumber}${input.departureTerminal ? `\nTerminal: ${input.departureTerminal}` : ""}`,
          leadMinutes: 120,
        };

        const retEvent = {
          title: `✈️ Voo VOLTA ${input.returnAirline.toUpperCase()} ${input.returnFlightNumber} — ${input.returnAirport} → ${input.departureAirport}`,
          flightDatetime: `${input.returnDate}T${input.returnTime}`,
          location:
            airportAddresses[input.returnAirport] || input.returnAirport,
          description: `Localizador: ${input.returnLocator}\nCompanhia: ${input.returnAirline.toUpperCase()}\nNúmero: ${input.returnFlightNumber}${input.returnTerminal ? `\nTerminal: ${input.returnTerminal}` : ""}`,
          leadMinutes: 120,
        };

        // Formatar datas para padrão brasileiro
        const departureDateBrazilian = formatDateToBrazilian(
          input.departureDate
        );
        const returnDateBrazilian = formatDateToBrazilian(input.returnDate);

        // Gerar links de rastreamento de voo
        const depTrackUrl = buildFlightTrackUrl(
          input.departureAirline,
          input.departureFlightNumber,
          input.departureAirport,
          input.returnAirport,
          input.departureDate
        );

        const retTrackUrl = buildFlightTrackUrl(
          input.returnAirline,
          input.returnFlightNumber,
          input.returnAirport,
          input.departureAirport,
          input.returnDate
        );

        const googleDepLink = getGoogleCalendarLink(depEvent, 120, 75);
        const outlookDepLink = getOutlookLink(depEvent, 120, 75);
        const googleRetLink = getGoogleCalendarLink(retEvent, 120, 75);
        const outlookRetLink = getOutlookLink(retEvent, 120, 75);

        // Construir HTML do e-mail similar ao WhatsApp
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Compartilhamento de Bilhetes ✈️</h2>
            <p style="color: #4b5563; margin-bottom: 20px;"><strong>${input.weekLabel}</strong></p>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Voo de Ida 🛫</h3>
              <p style="margin: 8px 0;"><strong>Data:</strong> ${departureDateBrazilian} às ${input.departureTime}</p>
              <p style="margin: 8px 0;"><strong>Rota:</strong> ${input.departureAirport} → ${input.returnAirport}</p>
              <p style="margin: 8px 0;"><strong>Companhia:</strong> ${input.departureAirline.toUpperCase()}</p>
              <p style="margin: 8px 0;"><strong>Voo:</strong> ${input.departureFlightNumber}</p>
              <p style="margin: 8px 0;"><strong>Localizador:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${input.departureLocator}</code></p>
              <p style="margin: 8px 0;">
                <a href="${outlookDepLink}" style="color: #0078d4; margin-right: 10px; text-decoration: none;">📅 Outlook • Ida</a>
                <a href="${googleDepLink}" style="color: #1f2937; margin-right: 10px; text-decoration: none;">📅 Google • Ida</a>
                ${depTrackUrl ? `<a href="${depTrackUrl}" style="color: #059669; margin-right: 10px; text-decoration: none;">🔍 Rastrear Ida</a>` : ""}
              </p>
            </div>
            
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Voo de Volta 🛬</h3>
              <p style="margin: 8px 0;"><strong>Data:</strong> ${returnDateBrazilian} às ${input.returnTime}</p>
              <p style="margin: 8px 0;"><strong>Rota:</strong> ${input.returnAirport} → ${input.departureAirport}</p>
              <p style="margin: 8px 0;"><strong>Companhia:</strong> ${input.returnAirline.toUpperCase()}</p>
              <p style="margin: 8px 0;"><strong>Voo:</strong> ${input.returnFlightNumber}</p>
              <p style="margin: 8px 0;"><strong>Localizador:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${input.returnLocator}</code></p>
              <p style="margin: 8px 0;">
                <a href="${outlookRetLink}" style="color: #0078d4; margin-right: 10px; text-decoration: none;">📅 Outlook • Volta</a>
                <a href="${googleRetLink}" style="color: #1f2937; margin-right: 10px; text-decoration: none;">📅 Google • Volta</a>
                ${retTrackUrl ? `<a href="${retTrackUrl}" style="color: #059669; margin-right: 10px; text-decoration: none;">🔍 Rastrear Volta</a>` : ""}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Compartilhado via Smart Fly - Planejador de Passagens Aéreas 2026
            </p>
          </div>
        `;

        // Extrair apenas os endereços de e-mail do array de objetos
        // ⚡ Bolt: Use a single pass loop to filter active emails and map them to their address
        const emailAddresses = [];
        for (let i = 0; i < emails.length; i++) {
          const e = emails[i];
          if (e.active === 1) {
            emailAddresses.push(e.email);
          }
        }

        if (emailAddresses.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum e-mail ativo cadastrado",
          });
        }

        return await sendShareByEmailNotification(
          emailAddresses,
          `Compartilhamento de Bilhetes - ${input.weekLabel}`,
          emailHtml
        );
      }),

    // Calendar integration
    calendar: router({
      createFlightEvent: flightProtectedProcedure
        .input(
          z.object({
            weekNumber: z.number(),
            airline: z.string(),
            flightNumber: z.string(),
            departureAirport: z.string(),
            arrivalAirport: z.string(),
            departureTime: z.date(),
            arrivalTime: z.date(),
            locator: z.string(),
            isReturn: z.boolean(),
          })
        )
        .mutation(async ({ input }) => {
          const success = await createFlightCalendarEvent({
            weekNumber: input.weekNumber,
            airline: input.airline,
            flightNumber: input.flightNumber,
            departureAirport: input.departureAirport,
            arrivalAirport: input.arrivalAirport,
            departureTime: input.departureTime,
            arrivalTime: input.arrivalTime,
            locator: input.locator,
            isReturn: input.isReturn,
          });
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Falha ao criar evento no calendário",
            });
          }
          return { success: true };
        }),

      createRoundTrip: flightProtectedProcedure
        .input(
          z.object({
            weekNumber: z.number(),
            departureAirline: z.string(),
            departureFlightNumber: z.string(),
            departureAirport: z.string(),
            arrivalAirport: z.string(),
            departureTime: z.date(),
            departureArrivalTime: z.date(),
            departureLocator: z.string(),
            returnAirline: z.string(),
            returnFlightNumber: z.string(),
            returnTime: z.date(),
            returnArrivalTime: z.date(),
            returnLocator: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          const result = await createRoundTripCalendarEvents(
            input.weekNumber,
            input.departureAirline,
            input.departureFlightNumber,
            input.departureAirport,
            input.arrivalAirport,
            input.departureTime,
            input.departureArrivalTime,
            input.departureLocator,
            input.returnAirline,
            input.returnFlightNumber,
            input.returnTime,
            input.returnArrivalTime,
            input.returnLocator
          );
          if (!result.departure || !result.return) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Falha ao criar eventos no calendário",
            });
          }
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
