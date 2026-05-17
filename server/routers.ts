import { COOKIE_NAME } from "@shared/const";
import { quotesRouter } from "./routers/quotes";
import type { Request } from "express";
import crypto from "crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllFlightWeeks,
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
  type TicketChangeNotification,
} from "./_core/emailNotification";
import { ENV } from "./_core/env";
import { parse as parseCookie } from "cookie";

const SESSION_COOKIE = "flight_session";

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

// Helper para verificar se a sessão é válida
async function getSessionFromCookie(
  req: any
): Promise<{ email: string } | null> {
  const cookieHeader = req.headers?.cookie ?? "";
  const cookies = parseCookie(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return null;
  return validateAuthSession(sessionToken);
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
        ctx.res.cookie(SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          // Security: Use lax to mitigate CSRF attacks
          sameSite: "lax",
          maxAge: 8 * 60 * 60 * 1000,
          path: "/",
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
      const cookies = parseCookie(cookieHeader);
      const sessionToken = cookies[SESSION_COOKIE];
      if (sessionToken) {
        await deleteAuthSession(sessionToken);
      }
      ctx.res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // Security: Use lax to mitigate CSRF attacks
        sameSite: "lax",
        path: "/",
      });
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
    subscribe: publicProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para ativar notificações.",
          });
        }
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
    sendTest: publicProcedure.mutation(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Faça login para testar notificações.",
        });
      }
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
    getWeeks: publicProcedure.query(async () => {
      return getAllFlightWeeks();
    }),

    // Buscar todos os preços
    getPrices: publicProcedure.query(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Faça login para acessar os preços.",
        });
      }
      return getAllFlightPrices();
    }),

    getPublicPrices: publicProcedure.query(async () => {
      return getPublicPrices();
    }),

    // Inicializar semanas com dados padrão (só roda se não houver dados)
    initWeeks: publicProcedure
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
      .mutation(async ({ input, ctx }) => {
        // Requer autenticação para evitar reinicialização não autorizada das semanas
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para inicializar semanas.",
          });
        }
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
    updateWeekStatus: publicProcedure
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
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para editar.",
          });
        }

        // Get the week before update to detect changes
        const weeks = await getAllFlightWeeks();
        const weekBefore = weeks.find(w => w.weekNumber === input.weekNumber);

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
        });

        // Send email notifications if ticket was issued or modified
        if (input.isTicketIssued !== undefined && weekBefore) {
          const wasIssued = weekBefore.isTicketIssued === 1;
          const nowIssued = input.isTicketIssued === 1;

          if (!wasIssued && nowIssued) {
            // Ticket was just created
            const recipients = await getTicketNotificationEmails();
            if (recipients.length > 0) {
              const recipientEmails = recipients.map(r => r.email);

              // Send for departure ticket
              if (input.departureFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "created",
                  weekNumber: input.weekNumber,
                  ticketType: "departure",
                  timestamp: new Date(),
                });
              }

              // Send for return ticket
              if (input.returnFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "created",
                  weekNumber: input.weekNumber,
                  ticketType: "return",
                  timestamp: new Date(),
                });
              }
            }
          } else if (wasIssued && !nowIssued) {
            // Ticket was deleted
            const recipients = await getTicketNotificationEmails();
            if (recipients.length > 0) {
              const recipientEmails = recipients.map(r => r.email);

              // Send for departure ticket
              if (weekBefore.departureFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "deleted",
                  weekNumber: input.weekNumber,
                  ticketType: "departure",
                  timestamp: new Date(),
                });
              }

              // Send for return ticket
              if (weekBefore.returnFlightNumber) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "deleted",
                  weekNumber: input.weekNumber,
                  ticketType: "return",
                  timestamp: new Date(),
                });
              }
            }
          } else if (wasIssued && nowIssued) {
            // Ticket was updated - detect changes
            const recipients = await getTicketNotificationEmails();
            if (recipients.length > 0) {
              const recipientEmails = recipients.map(r => r.email);
              const changes: Record<string, any> = {};

              // Check departure changes
              if (
                weekBefore.departureFlightNumber !== input.departureFlightNumber ||
                weekBefore.departureFlightDatetime !== input.departureFlightDatetime ||
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
                });
              }

              // Check return changes
              if (
                weekBefore.returnFlightNumber !== input.returnFlightNumber ||
                weekBefore.returnFlightDatetime !== input.returnFlightDatetime ||
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
                });
              }
            }
          }
        }

        return { success: true };
      }),

    // Editar datas de uma semana (requer autenticação)
    updateWeekDates: publicProcedure
      .input(
        z.object({
          weekNumber: z.number(),
          departureDate: z.string(),
          returnDate: z.string(),
          departureDayOfWeek: z.string(),
          returnDayOfWeek: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para editar.",
          });
        }
        await updateFlightWeekStatus(input.weekNumber, {
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          departureDayOfWeek: input.departureDayOfWeek,
          returnDayOfWeek: input.returnDayOfWeek,
        });
        return { success: true };
      }),

    // Salvar preço de uma companhia para uma semana (requer autenticação)
    savePrice: publicProcedure
      .input(
        z.object({
          weekNumber: z.number(),
          airline: z.string(),
          price: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para editar.",
          });
        }
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
    getStatus: publicProcedure.query(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Faça login para acessar.",
        });

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
      }> = [];

      const issuedWeeks = weeks.filter(w => w.isTicketIssued);

      // ⚡ Bolt: Hoist date parsing outside the nested loops to avoid O(N*M) time complexity
      const parsedIssuedWeeks = issuedWeeks.map(w => ({
        week: w,
        departureTime: w.departureFlightDatetime
          ? parseBrasiliaDatetime(w.departureFlightDatetime)
          : null,
        returnTime: w.returnFlightDatetime
          ? parseBrasiliaDatetime(w.returnFlightDatetime)
          : null,
      }));

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
            for (const aviso of precalculatedAvisos) {
              const alertTimeMs = depTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (alertTimeMs - nowMs) / 60000
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
              });
            }
          }
        }

        // Voo de volta
        if (returnTime) {
          const retTimeMs = returnTime.getTime();
          if (!isNaN(retTimeMs)) {
            const retPast = retTimeMs < nowMs;
            for (const aviso of precalculatedAvisos) {
              const alertTimeMs = retTimeMs - aviso.targetMs;
              const minutesUntilAlert = Math.round(
                (alertTimeMs - nowMs) / 60000
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
              });
            }
          }
        }
      }

      // Ordenar por data do alerta
      scheduledAlerts.sort(
        (a, b) =>
          new Date(a.alertDatetime).getTime() -
          new Date(b.alertDatetime).getTime()
      );

      return {
        settings,
        subscriptions: subscriptions.map(s => ({
          endpoint: s.endpoint.slice(0, 60) + "...",
          userAgent: s.userAgent ?? "Desconhecido",
          createdAt: s.createdAt,
        })),
        totalSubscriptions: subscriptions.length,
        totalIssuedFlights: issuedWeeks.length,
        scheduledAlerts,
        serverTime: now.toISOString(),
        avisos: avisos.map(a => ({ ...a, label: formatMinutes(a.minutes) })),
      };
    }),

    // Enviar notificação de teste do próximo alerta agendado
    sendNextAlert: publicProcedure.mutation(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Faça login para testar.",
        });

      const weeks = await getAllFlightWeeks();
      const settings = await getNotificationSettings();
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

      // ⚡ Bolt: Hoist date parsing outside the nested loops for nextAlert logic too
      const parsedAlertWeeks = weeks
        .filter(w => w.isTicketIssued)
        .map(w => ({
          week: w,
          departureTime: w.departureFlightDatetime
            ? parseBrasiliaDatetime(w.departureFlightDatetime)
            : null,
          returnTime: w.returnFlightDatetime
            ? parseBrasiliaDatetime(w.returnFlightDatetime)
            : null,
        }));

      const nowMsNext = now.getTime();

      const precalculatedAvisosNext = avisos.map(aviso => {
        return {
          ...aviso,
          targetMs: aviso.minutes * 60 * 1000,
        };
      });

      for (const { week, departureTime, returnTime } of parsedAlertWeeks) {
        // Voo de ida
        if (departureTime) {
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
        if (returnTime) {
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
    getLogs: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(500).optional() }))
      .query(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para acessar.",
          });
        const logs = await getNotificationLogs(input?.limit ?? 100);
        return logs;
      }),
  }),

  // =====================
  // Notification Settings
  // =====================
  notificationSettings: router({
    // Buscar configurações atuais de agendamento
    get: publicProcedure.query(async ({ ctx }) => {
      const session = await getSessionFromCookie(ctx.req);
      if (!session)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Faça login para acessar.",
        });
      return getNotificationSettings();
    }),
    // Salvar configurações de agendamento
    update: publicProcedure
      .input(
        z.object({
          aviso1Minutes: z.number().min(0).max(2880),
          aviso2Minutes: z.number().min(0).max(2880),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Faça login para editar.",
          });
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
    getRecipients: publicProcedure.query(async () => {
      return await getTicketNotificationEmails();
    }),

    /**
     * Add a new ticket notification email recipient
     */
    addRecipient: publicProcedure
      .input(
        z.object({
          email: z.string().email("E-mail inválido"),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await addTicketNotificationEmail(input.email, input.name);
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
    removeRecipient: publicProcedure
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
    updateRecipient: publicProcedure
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
    sendTestEmail: publicProcedure
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
  }),
});

export type AppRouter = typeof appRouter;
