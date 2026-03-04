import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllFlightWeeks,
  getAllFlightPrices,
  upsertFlightWeek,
  updateFlightWeekStatus,
  initFlightWeeks,
  upsertFlightPrice,
  deleteFlightPrice,
} from "./db";

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

  flights: router({
    // Buscar todas as semanas
    getWeeks: publicProcedure.query(async () => {
      return getAllFlightWeeks();
    }),

    // Buscar todos os preços
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

    // Atualizar status de uma semana (excluída, bilhete emitido, selecionada)
    updateWeekStatus: publicProcedure
      .input(z.object({
        weekNumber: z.number(),
        isDeleted: z.number().optional(),
        isTicketIssued: z.number().optional(),
        isSelected: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateFlightWeekStatus(input.weekNumber, {
          isDeleted: input.isDeleted,
          isTicketIssued: input.isTicketIssued,
          isSelected: input.isSelected,
        });
        return { success: true };
      }),

    // Editar datas de uma semana
    updateWeekDates: publicProcedure
      .input(z.object({
        weekNumber: z.number(),
        departureDate: z.string(),
        returnDate: z.string(),
        departureDayOfWeek: z.string(),
        returnDayOfWeek: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateFlightWeekStatus(input.weekNumber, {
          departureDate: input.departureDate,
          returnDate: input.returnDate,
          departureDayOfWeek: input.departureDayOfWeek,
          returnDayOfWeek: input.returnDayOfWeek,
        });
        return { success: true };
      }),

    // Salvar preço de uma companhia para uma semana
    savePrice: publicProcedure
      .input(z.object({
        weekNumber: z.number(),
        airline: z.string(),
        price: z.string(),
      }))
      .mutation(async ({ input }) => {
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
