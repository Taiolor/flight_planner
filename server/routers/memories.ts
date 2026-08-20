import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../_core/trpc";
import { flightProtectedProcedure } from "../flightAuthMiddleware";
import {
  deleteFlightMemoryMedia,
  getMemoriesForYear,
  upsertFlightMemorySummary,
  upsertFlightMemory,
} from "../memoriesDb";
import { getMemoriesOverview } from "../memoriesOverview";
import {
  FLY_IA_MODEL,
  FlyIaProviderError,
  createFlyIaRateLimiter,
} from "../flyIa";
import {
  generateFlightMemorySummary,
  getFlightMemorySummaryFingerprint,
  projectFlightMemorySummaryContext,
} from "../memorySummaries";
import {
  GeminiBudgetExceededError,
  getGeminiBudgetSnapshot,
  recordGeminiUsage,
} from "../geminiBudget";

const planningYearSchema = z.number().int().min(2020).max(2100);
const summaryRateLimiter = createFlyIaRateLimiter(4, 60_000);

export const memoriesRouter = router({
  getOverview: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .query(({ input }) => getMemoriesOverview(input.year)),

  getYear: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .query(({ input }) => getMemoriesForYear(input.year)),

  save: flightProtectedProcedure
    .input(
      z.object({
        year: planningYearSchema,
        weekNumber: z.number().int().min(1).max(54),
        title: z.string().trim().max(160).nullable().optional(),
        note: z.string().trim().max(2_000).nullable().optional(),
      })
    )
    .mutation(({ input }) => upsertFlightMemory(input)),

  deleteMedia: flightProtectedProcedure
    .input(
      z.object({
        year: planningYearSchema,
        mediaId: z.number().int().positive(),
      })
    )
    .mutation(({ input }) => deleteFlightMemoryMedia(input)),

  generateSummary: flightProtectedProcedure
    .input(
      z.object({
        year: planningYearSchema,
        weekNumber: z.number().int().min(1).max(54),
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const overview = await getMemoriesOverview(input.year);
      const trip = overview.trips.find(item => item.weekNumber === input.weekNumber);
      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A passagem selecionada não está disponível no Diário de Bordo.",
        });
      }

      if (trip.summary && !input.force) {
        return { summary: trip.summary, generated: false };
      }

      const budget = await getGeminiBudgetSnapshot();
      if (budget.isAtLimit) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: new GeminiBudgetExceededError().message,
        });
      }

      try {
        summaryRateLimiter.consume(`${ctx.flightSession.email}:memory-summary`);
        const context = projectFlightMemorySummaryContext(trip);
        const generated = await generateFlightMemorySummary(context);
        const summary = await upsertFlightMemorySummary({
          year: input.year,
          weekNumber: input.weekNumber,
          summary: generated.text,
          model: FLY_IA_MODEL,
          sourceFingerprint: getFlightMemorySummaryFingerprint(context),
        });
        if (!summary) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Não foi possível salvar o resumo da viagem.",
          });
        }

        void recordGeminiUsage(FLY_IA_MODEL, generated.usage).catch(error => {
          console.error("[Memories] Failed to record Gemini summary usage", error);
        });
        return { summary, generated: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof FlyIaProviderError) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível gerar o resumo da viagem.",
        });
      }
    }),
});
