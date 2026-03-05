import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAllFlightWeeks,
  getAllFlightPrices,
  upsertFlightWeek,
  updateFlightWeekStatus,
  initFlightWeeks,
  upsertFlightPrice,
  deleteFlightPrice,
  createAuthSession,
  validateAuthSession,
  deleteAuthSession,
} from "./db";

const SESSION_COOKIE = "flight_session";

// Helper para verificar se a sessão é válida
async function getSessionFromCookie(req: any): Promise<{ email: string } | null> {
  const cookieHeader = req.headers?.cookie ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  return validateAuthSession(match[1]);
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
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const allowedEmail = process.env.AUTH_EMAIL ?? "";
        const allowedPassword = process.env.AUTH_PASSWORD ?? "";

        if (
          input.email.toLowerCase().trim() !== allowedEmail.toLowerCase().trim() ||
          input.password !== allowedPassword
        ) {
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
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
      const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
      if (match) {
        await deleteAuthSession(match[1]);
      }
      ctx.res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
      return { success: true };
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

    // Buscar todos os preços (público)
    getPrices: publicProcedure.query(async () => {
      return getAllFlightPrices();
    }),

    // Inicializar semanas com dados padrão (só roda se não houver dados)
    initWeeks: publicProcedure
      .input(z.array(z.object({
        weekNumber: z.number(),
        departureDate: z.string(),
        returnDate: z.string(),
        departureDayOfWeek: z.string(),
        returnDayOfWeek: z.string(),
        holiday: z.string().nullable().optional(),
      })))
      .mutation(async ({ input }) => {
        await initFlightWeeks(input.map(w => ({
          weekNumber: w.weekNumber,
          departureDate: w.departureDate,
          returnDate: w.returnDate,
          departureDayOfWeek: w.departureDayOfWeek,
          returnDayOfWeek: w.returnDayOfWeek,
          holiday: w.holiday ?? null,
          isDeleted: 0,
          isTicketIssued: 0,
          isSelected: 0,
        })));
        return { success: true };
      }),

    // Atualizar status de uma semana (requer autenticação)
    updateWeekStatus: publicProcedure
      .input(z.object({
        weekNumber: z.number(),
        isDeleted: z.number().optional(),
        isTicketIssued: z.number().optional(),
        isSelected: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para editar." });
        }
        await updateFlightWeekStatus(input.weekNumber, {
          isDeleted: input.isDeleted,
          isTicketIssued: input.isTicketIssued,
          isSelected: input.isSelected,
        });
        return { success: true };
      }),

    // Editar datas de uma semana (requer autenticação)
    updateWeekDates: publicProcedure
      .input(z.object({
        weekNumber: z.number(),
        departureDate: z.string(),
        returnDate: z.string(),
        departureDayOfWeek: z.string(),
        returnDayOfWeek: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para editar." });
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
      .input(z.object({
        weekNumber: z.number(),
        airline: z.string(),
        price: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getSessionFromCookie(ctx.req);
        if (!session) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para editar." });
        }
        if (input.price === '') {
          await deleteFlightPrice(input.weekNumber, input.airline);
        } else {
          await upsertFlightPrice(input.weekNumber, input.airline, input.price);
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
