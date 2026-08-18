import { z } from "zod";
import { router } from "../_core/trpc";
import { flightProtectedProcedure } from "../flightAuthMiddleware";
import {
  deleteFlightMemoryMedia,
  getMemoriesForYear,
  upsertFlightMemory,
} from "../memoriesDb";
import { getMemoriesOverview } from "../memoriesOverview";

const planningYearSchema = z.number().int().min(2020).max(2100);

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
});
