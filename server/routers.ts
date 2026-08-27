import { COOKIE_NAME } from "@shared/const";
import { quotesRouter } from "./routers/quotes";
import { financialRouter } from "./routers/financial";
import { memoriesRouter } from "./routers/memories";
import { additionalFlightsRouter } from "./routers/additionalFlights";
import { operationalRouter } from "./routers/operational";
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
  getNotificationLogDailySummary,
  getNotificationLogsForExport,
  getTicketNotificationEmails,
  addTicketNotificationEmail,
  removeTicketNotificationEmail,
  updateTicketNotificationEmail,
  getFlightWeeksReliabilitySummary,
  deletePwaInstallation,
  getRecentPwaInstallations,
  recordPwaInstallation,
} from "./db";
import { ensurePlanningYearWeeks } from "./planningYears";
import { summarizeYearPlanningProgress } from "./planningProgress";
import {
  sendTicketNotificationEmail,
  sendTestEmail,
  sendShareByEmailNotification,
  formatTicketShareEmail,
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
import {
  getPerformanceMetricSummary,
  recordPerformanceMetrics,
} from "./performanceMetrics";
import { parse } from "cookie";
import {
  SESSION_COOKIE,
  getSessionFromCookie,
  flightAdminProcedure,
  flightProtectedProcedure,
} from "./flightAuthMiddleware";
import {
  deleteUsageTelemetryForSession,
  getUsageTelemetryMapData,
  getUsageTelemetrySummary,
  recordUsageTelemetryEvents,
} from "./usageTelemetry";
import {
  askFlyIa,
  buildFlyIaContext,
  FLY_IA_MODEL,
  FlyIaProviderError,
  FlyIaRateLimitError,
  flyIaRateLimiter,
  getFlyIaPromptStats,
  getDeterministicFlyIaAnswer,
} from "./flyIa";
import {
  createFlyIaSessionKey,
  getFlyIaMemoryDashboard,
  getFlyIaSessionMemory,
  recordFlyIaContextMetric,
  saveFlyIaSessionMemory,
} from "./flyIaMemory";
import {
  GeminiBudgetExceededError,
  getGeminiBudgetDashboard,
  getGeminiBudgetSnapshot,
  recordGeminiUsage,
  updateGeminiBudgetSettings,
} from "./geminiBudget";
import { getFlyIaTelemetryTimeline, getFlyIaVoiceDashboard } from "./flyIaVoiceTelemetry";
import { getFlyIaTravelGuidanceAnswer } from "./flyIaTravelGuidance";
import { getDestinationWeather } from "./destinationWeather";
import { PROTECTED_ACCESS_RESOURCES } from "../shared/protectedAccess";
import {
  getProtectedAccessAttemptSummary,
  recordProtectedAccessAttempt,
} from "./protectedAccessMetrics";

interface NextAlert {
  year: number;
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

const planningYearSchema = z.number().int().min(2020).max(2100);

export const appRouter = router({
  system: systemRouter,
  operational: operationalRouter,
  destinationWeather: router({
    forecast: publicProcedure
      .input(
        z.object({
          airportCode: z.string().trim().regex(/^[A-Za-z]{3}$/),
          flightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          flightTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        })
      )
      .query(({ input }) => input.flightTime
        ? getDestinationWeather(input.airportCode, input.flightDate, input.flightTime)
        : getDestinationWeather(input.airportCode, input.flightDate)),
  }),
  protectedAccess: router({
    record: publicProcedure
      .input(z.object({ resource: z.enum(PROTECTED_ACCESS_RESOURCES) }))
      .mutation(async ({ input }) => ({
        recorded: await recordProtectedAccessAttempt(input.resource),
      })),
    summary: flightAdminProcedure.query(() => getProtectedAccessAttemptSummary()),
  }),
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
        const allowedEmail = ENV.authEmail;
        const allowedPassword = ENV.authPassword;

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
      if (!session) {
        return { authenticated: false, email: null, isAdmin: false };
      }
      return {
        authenticated: true,
        email: session.email,
        isAdmin: session.role === "admin",
      };
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
  // Fly.IA — assistente de planejamento
  // =====================
  flyIa: router({
    chat: flightProtectedProcedure
      .input(
        z.object({
          year: planningYearSchema,
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(1200),
              })
            )
            .min(1)
            .max(8),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const startedAt = Date.now();
        const cookieHeader = ctx.req.headers?.cookie ?? "";
        const sessionToken = parse(cookieHeader)[SESSION_COOKIE];
        const sessionKey = createFlyIaSessionKey(ctx.flightSession.email, sessionToken);
        let metric = {
          contextChars: 0,
          historyChars: input.messages.reduce((total, message) => total + message.content.length, 0),
          payloadHistoryChars: input.messages.reduce((total, message) => total + message.content.length, 0),
          memoryChars: 0,
        };
        const recordMetric = (
          outcome: "generated" | "deterministic" | "provider_error" | "budget_blocked",
          usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
        ) => recordFlyIaContextMetric({
          sessionKey,
          year: input.year,
          model: FLY_IA_MODEL,
          outcome,
          ...metric,
          ...usage,
          latencyMs: Date.now() - startedAt,
        }).catch(error => console.error("[Fly.IA Memory] Falha ao registrar métrica:", error));
        try {
          flyIaRateLimiter.consume(ctx.flightSession.email.toLowerCase());
          const travelGuidance = await getFlyIaTravelGuidanceAnswer(input.year, input.messages);
          if (travelGuidance) {
            await recordMetric("deterministic");
            return travelGuidance;
          }
          const deterministicAnswer = await getDeterministicFlyIaAnswer(input.year, input.messages);
          if (deterministicAnswer) {
            await recordMetric("deterministic");
            return {
              response: deterministicAnswer.text,
              trackingUrl: deterministicAnswer.trackingUrl,
              weather: deterministicAnswer.weather,
            };
          }
          const budget = await getGeminiBudgetSnapshot();
          if (budget.isAtLimit) {
            await recordMetric("budget_blocked");
            throw new GeminiBudgetExceededError();
          }
          const [context, sessionMemory] = await Promise.all([
            buildFlyIaContext(input.year),
            getFlyIaSessionMemory(sessionKey, input.year),
          ]);
          metric = getFlyIaPromptStats(context, input.messages, sessionMemory?.summary);
          const answer = await askFlyIa(context, input.messages, sessionMemory?.summary);
          await recordGeminiUsage(FLY_IA_MODEL, answer.usage).catch(error => {
            console.error("[Gemini Budget] Falha ao registrar consumo:", error);
          });
          await Promise.all([
            saveFlyIaSessionMemory({
              sessionKey,
              year: input.year,
              existingSummary: sessionMemory?.summary ?? null,
              sourceResponsesCount: sessionMemory?.sourceResponsesCount ?? 0,
              answer: answer.text,
            }).catch(error => console.error("[Fly.IA Memory] Falha ao salvar memória:", error)),
            recordMetric("generated", answer.usage),
          ]);
          return { response: answer.text };
        } catch (error) {
          if (error instanceof FlyIaRateLimitError) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: error.message,
            });
          }
          if (error instanceof FlyIaProviderError) {
            await recordMetric("provider_error");
            throw new TRPCError({
              code: "SERVICE_UNAVAILABLE",
              message: error.message,
            });
          }
          if (error instanceof GeminiBudgetExceededError) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: error.message,
            });
          }
          const diagnosticId = crypto.randomUUID();
          await recordMetric("provider_error");
          console.error(`[Fly.IA:${diagnosticId}] Falha inesperada no chat:`, error);
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: `O Fly.IA não conseguiu concluir esta resposta. Tente novamente em instantes. Código: ${diagnosticId}`,
          });
        }
      }),
  }),

  // =====================
  flyIaMemory: router({
    dashboard: flightAdminProcedure.query(() => getFlyIaMemoryDashboard()),
  }),

  flyIaVoice: router({
    dashboard: flightAdminProcedure.query(() => getFlyIaVoiceDashboard()),
  }),

  flyIaTelemetry: router({
    timeline: flightAdminProcedure.query(() => getFlyIaTelemetryTimeline()),
  }),

  // =====================
  geminiBudget: router({
    dashboard: flightAdminProcedure.query(() => getGeminiBudgetDashboard()),
    updateSettings: flightAdminProcedure
      .input(
        z
          .object({
            monthlyBudgetCents: z.number().int().min(1).max(10_000_000),
            inputCostCentsPerMillion: z.number().int().min(0).max(1_000_000),
            outputCostCentsPerMillion: z.number().int().min(0).max(1_000_000),
            warningThresholdPercent: z.number().int().min(1).max(100),
            criticalThresholdPercent: z.number().int().min(1).max(100),
            limitThresholdPercent: z.number().int().min(1).max(200),
            emailAlertsEnabled: z.boolean(),
            pushAlertsEnabled: z.boolean(),
          })
          .superRefine((value, context) => {
            if (value.warningThresholdPercent >= value.criticalThresholdPercent) {
              context.addIssue({
                code: "custom",
                path: ["criticalThresholdPercent"],
                message: "O limite crítico deve ser maior que o aviso.",
              });
            }
            if (value.criticalThresholdPercent >= value.limitThresholdPercent) {
              context.addIssue({
                code: "custom",
                path: ["limitThresholdPercent"],
                message: "O teto deve ser maior que o limite crítico.",
              });
            }
          })
      )
      .mutation(({ input }) =>
        updateGeminiBudgetSettings({
          ...input,
          emailAlertsEnabled: input.emailAlertsEnabled ? 1 : 0,
          pushAlertsEnabled: input.pushAlertsEnabled ? 1 : 0,
        })
      ),
  }),

  // Push Notifications
  // =====================
  push: router({
    // Retorna a chave pública VAPID para o frontend criar a subscription
    getVapidPublicKey: publicProcedure.query(() => {
      return {
        publicKey: ENV.vapidPublicKey || "",
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
    sendTest: flightAdminProcedure
      .input(z.object({ year: planningYearSchema }))
      .mutation(async ({ input }) => {
      const { sendPushToAll, SMART_FLY_PUSH_BADGE, SMART_FLY_PUSH_ICON } = await import("./pushNotifications");
      const sent = await sendPushToAll({
        title: "✈️ Smart Fly — Teste",
        body: "Notificações push estão funcionando!",
        icon: SMART_FLY_PUSH_ICON,
        badge: SMART_FLY_PUSH_BADGE,
        tag: "test",
      });
      const totalDevices = (await getAllPushSubscriptions()).length;
      await insertNotificationLog({
        year: input.year,
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
    // Buscar todas as semanas de um exercício (público).
    getWeeks: publicProcedure
      .input(z.object({ year: z.number().int().min(2020).max(2100) }))
      .query(async ({ ctx, input }) => {
        const weeks = await getAllFlightWeeks(input.year);
        const session = await getSessionFromCookie(ctx.req);
        if (session) return weeks;

        // Se não estiver autenticado, omitir dados sensíveis.
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

    getProgressComparison: publicProcedure
      .input(
        z.object({
          years: z
            .array(z.number().int().min(2020).max(2100))
            .min(1)
            .max(5),
        })
      )
      .query(async ({ input }) => {
        const years = [...new Set(input.years)].sort((a, b) => a - b);
        const results = await Promise.all(
          years.map(async year =>
            summarizeYearPlanningProgress(year, await getAllFlightWeeks(year))
          )
        );
        return results;
      }),

    getPrices: flightProtectedProcedure
      .input(z.object({ year: z.number().int().min(2020).max(2100) }))
      .query(async ({ input }) => getAllFlightPrices(input.year)),

    getPublicPrices: publicProcedure
      .input(z.object({ year: z.number().int().min(2020).max(2100) }))
      .query(async ({ input }) => getPublicPrices(input.year)),

    // Cria somente as semanas ainda ausentes e preserva qualquer edição existente.
    ensureYearWeeks: flightProtectedProcedure
      .input(z.object({ year: z.number().int().min(2020).max(2100) }))
      .mutation(async ({ input }) => ensurePlanningYearWeeks(input.year)),

    // Mantido como compatibilidade temporária para clientes antigos.
    initWeeks: flightProtectedProcedure
      .input(
        z.object({
          year: z.number().int().min(2020).max(2100),
          weeks: z.array(
            z.object({
              weekNumber: z.number(),
              departureDate: z.string(),
              returnDate: z.string(),
              departureDayOfWeek: z.string(),
              returnDayOfWeek: z.string(),
              holiday: z.string().nullable().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await initFlightWeeks(
          input.weeks.map(w => ({
            weekNumber: w.weekNumber,
            departureDate: w.departureDate,
            returnDate: w.returnDate,
            departureDayOfWeek: w.departureDayOfWeek,
            returnDayOfWeek: w.returnDayOfWeek,
            holiday: w.holiday ?? null,
            isDeleted: 0,
            isTicketIssued: 0,
            isSelected: 0,
          })),
          input.year
        );
        return { success: true };
      }),

    // Atualizar status de uma semana (requer autenticação)
    updateWeekStatus: flightProtectedProcedure
      .input(
        z.object({
          year: z.number().int().min(2020).max(2100),
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
          departureTerminal: z.string().trim().max(20).nullable().optional(),
          returnTerminal: z.string().trim().max(20).nullable().optional(),
          ticketType: z.string().nullable().optional(),
          smilesPoints: z.number().nullable().optional(),
          latamPassPoints: z.number().nullable().optional(),
          departureRescheduled: z.number().optional(),
          returnRescheduled: z.number().optional(),
          departureCancelled: z.number().optional(),
          returnCancelled: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Get the week before update to detect changes
        const weekBefore = await getFlightWeek(input.weekNumber, input.year);

        await updateFlightWeekStatus(input.weekNumber, {
          year: input.year,
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
          departureTerminal: input.departureTerminal,
          returnTerminal: input.returnTerminal,
          ticketType: input.ticketType,
          smilesPoints: input.smilesPoints,
          latamPassPoints: input.latamPassPoints,
          departureRescheduled: input.departureRescheduled,
          returnRescheduled: input.returnRescheduled,
          departureCancelled: input.departureCancelled,
          returnCancelled: input.returnCancelled,
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
          const channelSettings = needsEmail
            ? await getNotificationSettings()
            : null;
          const recipients = needsEmail && channelSettings?.ticketEmailEnabled
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

                const emailHtml = formatTicketShareEmail({
                  weekLabel: `Semana ${input.weekNumber}`,
                  departure: {
                    date: departureDate,
                    time: departureTime,
                    departureAirport: input.departureAirport || "N/A",
                    arrivalAirport: input.returnAirport || "N/A",
                    airline: input.departureAirline?.toUpperCase() || "N/A",
                    flightNumber: input.departureFlightNumber || "N/A",
                    locator: input.departureLocator || "N/A",
                    terminal: (input as any).departureTerminal,
                    outlookUrl: outlookDepLink,
                    googleUrl: googleDepLink,
                    trackingUrl: depTrackUrl,
                  },
                  return: {
                    date: returnDate,
                    time: returnTime,
                    departureAirport: input.returnAirport || "N/A",
                    arrivalAirport: input.departureAirport || "N/A",
                    airline: input.returnAirline?.toUpperCase() || "N/A",
                    flightNumber: input.returnFlightNumber || "N/A",
                    locator: input.returnLocator || "N/A",
                    terminal: (input as any).returnTerminal,
                    outlookUrl: outlookRetLink,
                    googleUrl: googleRetLink,
                    trackingUrl: retTrackUrl,
                  },
                });

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
              // Check departure changes
              if (
                (input.departureFlightNumber !== undefined && weekBefore.departureFlightNumber !== input.departureFlightNumber) ||
                (input.departureFlightDatetime !== undefined && weekBefore.departureFlightDatetime !== input.departureFlightDatetime) ||
                (input.departureAirline !== undefined && weekBefore.departureAirline !== input.departureAirline) ||
                (input.departureLocator !== undefined && weekBefore.departureLocator !== input.departureLocator)
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
                (input.returnFlightNumber !== undefined && weekBefore.returnFlightNumber !== input.returnFlightNumber) ||
                (input.returnFlightDatetime !== undefined && weekBefore.returnFlightDatetime !== input.returnFlightDatetime) ||
                (input.returnAirline !== undefined && weekBefore.returnAirline !== input.returnAirline) ||
                (input.returnLocator !== undefined && weekBefore.returnLocator !== input.returnLocator)
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

              if (
                input.departureCancelled === 1 &&
                weekBefore.departureCancelled !== 1
              ) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "updated",
                  eventLabel: "⚠️ Voo de Ida Cancelado",
                  weekNumber: input.weekNumber,
                  ticketType: "departure",
                  changes: {
                    before: { Status: "Ativo" },
                    after: { Status: "Cancelado" },
                  },
                  timestamp: new Date(),
                  departureFlightNumber: weekBefore.departureFlightNumber ?? undefined,
                  departureFlightDatetime: weekBefore.departureFlightDatetime ?? undefined,
                  departureAirline: weekBefore.departureAirline ?? undefined,
                  departureLocator: weekBefore.departureLocator ?? undefined,
                  returnFlightNumber: weekBefore.returnFlightNumber ?? undefined,
                  returnFlightDatetime: weekBefore.returnFlightDatetime ?? undefined,
                  returnAirline: weekBefore.returnAirline ?? undefined,
                  returnLocator: weekBefore.returnLocator ?? undefined,
                  departureDate: weekBefore.departureDate ?? undefined,
                  returnDate: weekBefore.returnDate ?? undefined,
                });
              }

              if (
                input.returnCancelled === 1 &&
                weekBefore.returnCancelled !== 1
              ) {
                await sendTicketNotificationEmail(recipientEmails, {
                  type: "updated",
                  eventLabel: "⚠️ Voo de Volta Cancelado",
                  weekNumber: input.weekNumber,
                  ticketType: "return",
                  changes: {
                    before: { Status: "Ativo" },
                    after: { Status: "Cancelado" },
                  },
                  timestamp: new Date(),
                  departureFlightNumber: weekBefore.departureFlightNumber ?? undefined,
                  departureFlightDatetime: weekBefore.departureFlightDatetime ?? undefined,
                  departureAirline: weekBefore.departureAirline ?? undefined,
                  departureLocator: weekBefore.departureLocator ?? undefined,
                  returnFlightNumber: weekBefore.returnFlightNumber ?? undefined,
                  returnFlightDatetime: weekBefore.returnFlightDatetime ?? undefined,
                  returnAirline: weekBefore.returnAirline ?? undefined,
                  returnLocator: weekBefore.returnLocator ?? undefined,
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
          year: z.number().int().min(2020).max(2100),
          weekNumber: z.number(),
          departureDate: z.string(),
          returnDate: z.string(),
          departureDayOfWeek: z.string(),
          returnDayOfWeek: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateFlightWeekStatus(input.weekNumber, {
          year: input.year,
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
          year: z.number().int().min(2020).max(2100),
          weekNumber: z.number(),
          airline: z.string(),
          price: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.price === "") {
          await deleteFlightPrice(input.weekNumber, input.airline, input.year);
        } else {
          await upsertFlightPrice(
            input.weekNumber,
            input.airline,
            input.price,
            input.year
          );
        }
        return { success: true };
      }),
  }),

  // =====================
  // Admin: Painel de Notificações
  // =====================
  adminNotifications: router({
    // Retorna status completo do sistema de notificações para o painel admin
    getStatus: flightAdminProcedure
      .input(z.object({ year: planningYearSchema }))
      .query(async ({ input }) => {
      const [weeks, settings, subscriptions] = await Promise.all([
        getAllFlightWeeks(input.year),
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
        year: number;
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
                year: input.year,
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
                year: input.year,
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
    sendNextAlert: flightAdminProcedure
      .input(z.object({ year: planningYearSchema }))
      .mutation(async ({ input }) => {
      const [weeks, settings] = await Promise.all([
        getAllFlightWeeks(input.year),
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
                  year: input.year,
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
                  year: input.year,
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
      const { sendPushToAll, SMART_FLY_PUSH_BADGE, SMART_FLY_PUSH_ICON } = await import("./pushNotifications");
      const sent = await sendPushToAll({
        title: `✈️ ${nextAlert.airline} ${nextAlert.flightNumber} - ${nextAlert.avisoLabel}`,
        body: `${nextAlert.direction === "ida" ? "Partida" : "Retorno"} em ${dateStr} às ${timeStr}\n${nextAlert.departureAirport} → ${nextAlert.arrivalAirport}`,
        icon: SMART_FLY_PUSH_ICON,
        badge: SMART_FLY_PUSH_BADGE,
        tag: `test-${nextAlert.year}-${nextAlert.weekNumber}`,
      });

      await insertNotificationLog({
        year: nextAlert.year,
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
    getLogs: flightAdminProcedure
      .input(
        z.object({
          year: planningYearSchema,
          limit: z.number().min(1).max(100).default(25),
          status: z.enum(["success", "partial", "failed"]).optional(),
          search: z.string().trim().min(1).max(100).optional(),
          cursor: z
            .object({
              id: z.number().int().positive(),
              sentAt: z.date(),
            })
            .nullish(),
        })
      )
      .query(async ({ input }) => {
        return getNotificationLogs(
          input.year,
          input.limit,
          input.cursor ?? undefined,
          input.status,
          input.search
        );
      }),

    getDailySummary: flightAdminProcedure
      .input(
        z.object({
          year: planningYearSchema,
          status: z.enum(["success", "partial", "failed"]).optional(),
          search: z.string().trim().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return getNotificationLogDailySummary(input.year, input.status, input.search);
      }),

    exportLogs: flightAdminProcedure
      .input(
        z.object({
          year: planningYearSchema,
          status: z.enum(["success", "partial", "failed"]).optional(),
          search: z.string().trim().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return getNotificationLogsForExport(input.year, input.status, input.search);
      }),
  }),

  // =====================
  // Notification Settings
  // =====================
  notificationSettings: router({
    // Buscar configurações atuais de agendamento
    get: flightAdminProcedure.query(async () => {
      return getNotificationSettings();
    }),
    // Salvar configurações de agendamento
    update: flightAdminProcedure
      .input(
        z.object({
          aviso1Minutes: z.number().min(0).max(2880),
          aviso2Minutes: z.number().min(0).max(2880),
          flightPushEnabled: z.boolean(),
          ticketEmailEnabled: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await updateNotificationSettings(input);
        return { success: true };
      }),
  }),

  pwaInstallations: router({
    record: flightProtectedProcedure
      .input(z.object({
        installationId: z.string().uuid(),
        platform: z.enum(["ios", "android", "desktop", "unknown"]),
        method: z.enum(["native", "manual"]),
        consent: z.literal(true),
      }))
      .mutation(async ({ input }) => {
        const { consent: _consent, ...installation } = input;
        await recordPwaInstallation(installation);
        return { success: true };
      }),
    deleteCurrent: flightProtectedProcedure
      .input(z.object({ installationId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deletePwaInstallation(input.installationId);
        return { success: true };
      }),
    listRecent: flightAdminProcedure.query(async () => getRecentPwaInstallations()),
  }),

  // =====================
  // Cotações de Passagens (Sky Scrapper API + Kayak manual)
  // =====================
  quotes: quotesRouter,

  // =====================
  // Financial Dashboard
  // =====================
  financial: financialRouter,

  // =====================
  // Ticket Notification Emails
  // =====================
  ticketNotifications: router({
    /**
     * Get all ticket notification email recipients
     */
    getRecipients: flightAdminProcedure.query(async () => {
      return await getTicketNotificationEmails();
    }),

    preview: flightAdminProcedure.query(() => ({
      subject: "Compartilhamento de Bilhetes — Semana 24",
      html: formatTicketShareEmail({
        weekLabel: "Semana 24 · Exemplo de comunicação",
        departure: {
          date: "10/06/2026",
          time: "08:30",
          departureAirport: "GRU",
          arrivalAirport: "NVT",
          airline: "LATAM",
          flightNumber: "LA 3124",
          locator: "SF24IDA",
          outlookUrl: "https://outlook.live.com/calendar/0/deeplink/compose",
          googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
          trackingUrl: "https://www.flightradar24.com/",
        },
        return: {
          date: "14/06/2026",
          time: "18:10",
          departureAirport: "NVT",
          arrivalAirport: "GRU",
          airline: "LATAM",
          flightNumber: "LA 3125",
          locator: "SF24VOL",
          outlookUrl: "https://outlook.live.com/calendar/0/deeplink/compose",
          googleUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
          trackingUrl: "https://www.flightradar24.com/",
        },
      }),
    })),

    /**
     * Add a new ticket notification email recipient
     */
    addRecipient: flightAdminProcedure
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
    removeRecipient: flightAdminProcedure
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
    updateRecipient: flightAdminProcedure
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
    sendTestEmail: flightAdminProcedure
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

    shareByEmail: flightAdminProcedure
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

        const emailHtml = formatTicketShareEmail({
          weekLabel: input.weekLabel,
          departure: {
            date: departureDateBrazilian,
            time: input.departureTime,
            departureAirport: input.departureAirport,
            arrivalAirport: input.returnAirport,
            airline: input.departureAirline.toUpperCase(),
            flightNumber: input.departureFlightNumber,
            locator: input.departureLocator,
            terminal: input.departureTerminal,
            outlookUrl: outlookDepLink,
            googleUrl: googleDepLink,
            trackingUrl: depTrackUrl,
          },
          return: {
            date: returnDateBrazilian,
            time: input.returnTime,
            departureAirport: input.returnAirport,
            arrivalAirport: input.departureAirport,
            airline: input.returnAirline.toUpperCase(),
            flightNumber: input.returnFlightNumber,
            locator: input.returnLocator,
            terminal: input.returnTerminal,
            outlookUrl: outlookRetLink,
            googleUrl: googleRetLink,
            trackingUrl: retTrackUrl,
          },
        });

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

  performanceMetrics: router({
    record: flightProtectedProcedure
      .input(
        z.object({
          samples: z
            .array(
              z.object({
                metric: z.enum(["CLS", "FCP", "INP", "LCP", "TRPC"]),
                value: z.number().int().min(0).max(120_000),
                route: z
                  .string()
                  .max(120)
                  .regex(/^\/[a-zA-Z0-9_/-]*$/)
                  .optional(),
                procedure: z
                  .string()
                  .max(160)
                  .regex(/^[a-zA-Z0-9_.,-]+$/)
                  .optional(),
              })
            )
            .min(1)
            .max(20),
        })
      )
      .mutation(async ({ input }) => {
        await recordPerformanceMetrics(input.samples);
        return { accepted: input.samples.length };
      }),

    getSummary: flightProtectedProcedure
      .input(z.object({ hours: z.number().int().min(1).max(168).default(24) }))
      .query(({ input }) => getPerformanceMetricSummary(input.hours)),
  }),

  reliability: router({
    getFlightWeeksSummary: flightAdminProcedure
      .input(z.object({ hours: z.number().int().min(1).max(168).default(24) }))
      .query(({ input }) => getFlightWeeksReliabilitySummary(input.hours)),
  }),

  usageTelemetry: router({
    record: flightProtectedProcedure
      .input(
        z.object({
          sessionId: z.string().min(24).max(128).regex(/^[a-zA-Z0-9_-]+$/),
          events: z
            .array(
              z.object({
                eventType: z.enum(["route", "interaction", "query", "mutation"]),
                route: z.string().max(120).regex(/^\/[a-zA-Z0-9_/-]*$/),
                procedure: z.string().max(160).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
                latitudeE2: z.number().int().min(-9000).max(9000).optional(),
                longitudeE2: z.number().int().min(-18000).max(18000).optional(),
              })
            )
            .min(1)
            .max(20),
        })
      )
      .mutation(async ({ input }) => {
        await recordUsageTelemetryEvents(input.sessionId, input.events);
        return { accepted: input.events.length };
      }),

    getMapData: flightAdminProcedure
      .input(
        z.object({
          hours: z.number().int().min(1).max(24 * 30).default(24),
          limit: z.number().int().min(10).max(500).default(200),
          eventTypes: z
            .array(z.enum(["route", "interaction", "query", "mutation"]))
            .min(1)
            .max(4)
            .optional(),
        })
      )
      .query(({ input }) =>
        getUsageTelemetryMapData(input.hours, input.limit, input.eventTypes)
      ),

    getSummary: flightAdminProcedure
      .input(
        z.object({
          hours: z.number().int().min(1).max(24 * 30).default(24),
          eventTypes: z
            .array(z.enum(["route", "interaction", "query", "mutation"]))
            .min(1)
            .max(4)
            .optional(),
        })
      )
      .query(({ input }) => getUsageTelemetrySummary(input.hours, input.eventTypes)),

    deleteCurrentSession: flightProtectedProcedure
      .input(
        z.object({
          sessionId: z.string().min(24).max(128).regex(/^[a-zA-Z0-9_-]+$/),
        })
      )
      .mutation(async ({ input }) => {
        await deleteUsageTelemetryForSession(input.sessionId);
        return { success: true };
      }),
  }),

  memories: memoriesRouter,

  additionalFlights: additionalFlightsRouter,
});

export type AppRouter = typeof appRouter;
