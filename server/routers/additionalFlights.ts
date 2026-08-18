import { z } from "zod";
import { router } from "../_core/trpc";
import { flightProtectedProcedure } from "../flightAuthMiddleware";
import {
  createAdditionalFlight,
  deleteAdditionalFlight,
  getAdditionalFlightsForYear,
  updateAdditionalFlight,
} from "../additionalFlightsDb";

const nullableText = z.string().trim().max(255).nullable().optional();
const yearSchema = z.number().int().min(2020).max(2100);
const fieldsSchema = z.object({
  isTicketIssued: z.number().int().min(0).max(1).optional(),
  departureAirline: nullableText,
  returnAirline: nullableText,
  departureFlightDatetime: nullableText,
  returnFlightDatetime: nullableText,
  departureAirport: nullableText,
  returnAirport: nullableText,
  departureLocator: nullableText,
  returnLocator: nullableText,
  departureFlightNumber: nullableText,
  returnFlightNumber: nullableText,
  departureTerminal: nullableText,
  returnTerminal: nullableText,
  ticketType: z.enum(["roundtrip", "oneway"]).nullable().optional(),
  smilesPoints: z.number().int().min(0).nullable().optional(),
  latamPassPoints: z.number().int().min(0).nullable().optional(),
  departureRescheduled: z.number().int().min(0).max(1).optional(),
  returnRescheduled: z.number().int().min(0).max(1).optional(),
  departureCancelled: z.number().int().min(0).max(1).optional(),
  returnCancelled: z.number().int().min(0).max(1).optional(),
});

export const additionalFlightsRouter = router({
  getYear: flightProtectedProcedure
    .input(z.object({ year: yearSchema }))
    .query(({ input }) => getAdditionalFlightsForYear(input.year)),

  create: flightProtectedProcedure
    .input(z.object({ year: yearSchema, weekNumber: z.number().int().min(1).max(54), ...fieldsSchema.shape }))
    .mutation(({ input }) =>
      createAdditionalFlight({
        year: input.year,
        weekNumber: input.weekNumber,
        isTicketIssued: input.isTicketIssued ?? 0,
        departureAirline: input.departureAirline ?? null,
        returnAirline: input.returnAirline ?? null,
        departureFlightDatetime: input.departureFlightDatetime ?? null,
        returnFlightDatetime: input.returnFlightDatetime ?? null,
        departureAirport: input.departureAirport ?? null,
        returnAirport: input.returnAirport ?? null,
        departureLocator: input.departureLocator ?? null,
        returnLocator: input.returnLocator ?? null,
        departureFlightNumber: input.departureFlightNumber ?? null,
        returnFlightNumber: input.returnFlightNumber ?? null,
        departureTerminal: input.departureTerminal ?? null,
        returnTerminal: input.returnTerminal ?? null,
        ticketType: input.ticketType ?? "roundtrip",
        smilesPoints: input.smilesPoints ?? null,
        latamPassPoints: input.latamPassPoints ?? null,
        departureRescheduled: input.departureRescheduled ?? 0,
        returnRescheduled: input.returnRescheduled ?? 0,
        departureCancelled: input.departureCancelled ?? 0,
        returnCancelled: input.returnCancelled ?? 0,
      })
    ),

  update: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: yearSchema, ...fieldsSchema.shape }))
    .mutation(({ input }) => {
      const { id, year, ...patch } = input;
      return updateAdditionalFlight(id, year, patch);
    }),

  delete: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: yearSchema }))
    .mutation(({ input }) => deleteAdditionalFlight(input.id, input.year)),
});
