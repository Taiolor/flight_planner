import { TRPCError } from "@trpc/server";
import { type AdditionalFlight, type FlightWeek } from "../../drizzle/schema";
import {
  createAdditionalFlight,
  deleteAdditionalFlight,
  getAdditionalFlight,
  getAdditionalFlightsForYear,
  getPublicAdditionalFlightsForCalendar,
  updateAdditionalFlight,
} from "../additionalFlightsDb";
import {
  getFlightWeek,
  getTicketNotificationEmails,
} from "../db";
import {
  sendTicketNotificationEmail,
  type TicketChangeNotification,
} from "../_core/emailNotification";
import {
  flightProtectedProcedure,
  getSessionFromCookie,
} from "../flightAuthMiddleware";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

const nullableText = z.string().trim().max(255).nullable().optional();
const nullableDatetime = z.string().trim().max(30).nullable().optional();
const yearSchema = z.number().int().min(2020).max(2100);
const fieldsSchema = z.object({
  isTicketIssued: z.number().int().min(0).max(1).optional(),
  departureAirline: nullableText,
  returnAirline: nullableText,
  departureFlightDatetime: nullableDatetime,
  returnFlightDatetime: nullableDatetime,
  departureAirport: nullableText,
  returnAirport: nullableText,
  departureLocator: nullableText,
  returnLocator: nullableText,
  departureFlightNumber: nullableText,
  returnFlightNumber: nullableText,
  departureTerminal: nullableText,
  returnTerminal: nullableText,
  ticketType: z.enum(["roundtrip", "oneway"]).nullable().optional(),
  paidPriceCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  smilesPoints: z.number().int().min(0).nullable().optional(),
  latamPassPoints: z.number().int().min(0).nullable().optional(),
  departureRescheduled: z.number().int().min(0).max(1).optional(),
  returnRescheduled: z.number().int().min(0).max(1).optional(),
  departureCancelled: z.number().int().min(0).max(1).optional(),
  returnCancelled: z.number().int().min(0).max(1).optional(),
});

type AdditionalFlightFields = {
  isTicketIssued: number;
  departureAirline: string | null;
  returnAirline: string | null;
  departureFlightDatetime: string | null;
  returnFlightDatetime: string | null;
  departureAirport: string | null;
  returnAirport: string | null;
  departureLocator: string | null;
  returnLocator: string | null;
  departureFlightNumber: string | null;
  returnFlightNumber: string | null;
  departureTerminal: string | null;
  returnTerminal: string | null;
  ticketType: "roundtrip" | "oneway";
  paidPriceCents: number | null;
  smilesPoints: number | null;
  latamPassPoints: number | null;
  departureRescheduled: number;
  returnRescheduled: number;
  departureCancelled: number;
  returnCancelled: number;
};

type NotificationDirection = "departure" | "return";

function nullableString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function binaryNumber(source: Record<string, unknown>, key: string) {
  return source[key] === 1 ? 1 : 0;
}

/**
 * Normaliza todos os campos de um bilhete adicional e remove qualquer vestígio
 * de volta quando o usuário escolhe "Somente ida".
 */
function normalizeFields(source: Record<string, unknown>): AdditionalFlightFields {
  const ticketType = source.ticketType === "oneway" ? "oneway" : "roundtrip";
  const normalized: AdditionalFlightFields = {
    isTicketIssued: binaryNumber(source, "isTicketIssued"),
    departureAirline: nullableString(source, "departureAirline"),
    returnAirline: nullableString(source, "returnAirline"),
    departureFlightDatetime: nullableString(source, "departureFlightDatetime"),
    returnFlightDatetime: nullableString(source, "returnFlightDatetime"),
    departureAirport: nullableString(source, "departureAirport"),
    returnAirport: nullableString(source, "returnAirport"),
    departureLocator: nullableString(source, "departureLocator"),
    returnLocator: nullableString(source, "returnLocator"),
    departureFlightNumber: nullableString(source, "departureFlightNumber"),
    returnFlightNumber: nullableString(source, "returnFlightNumber"),
    departureTerminal: nullableString(source, "departureTerminal"),
    returnTerminal: nullableString(source, "returnTerminal"),
    ticketType,
    paidPriceCents: nullableNumber(source, "paidPriceCents"),
    smilesPoints: nullableNumber(source, "smilesPoints"),
    latamPassPoints: nullableNumber(source, "latamPassPoints"),
    departureRescheduled: binaryNumber(source, "departureRescheduled"),
    returnRescheduled: binaryNumber(source, "returnRescheduled"),
    departureCancelled: binaryNumber(source, "departureCancelled"),
    returnCancelled: binaryNumber(source, "returnCancelled"),
  };

  if (ticketType === "oneway") {
    return {
      ...normalized,
      returnAirline: null,
      returnFlightDatetime: null,
      returnAirport: null,
      returnLocator: null,
      returnFlightNumber: null,
      returnTerminal: null,
      returnRescheduled: 0,
      returnCancelled: 0,
    };
  }

  return normalized;
}

function parseDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const raw = value.slice(0, 10);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brazilianMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const normalized = isoMatch
    ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    : brazilianMatch
      ? `${brazilianMatch[3]}-${brazilianMatch[2]}-${brazilianMatch[1]}`
      : null;
  if (!normalized) return null;

  const parsed = new Date(`${normalized}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function requireActiveWeek(week: FlightWeek | null) {
  if (!week || week.isDeleted === 1) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "A semana selecionada não está disponível para receber passagens.",
    });
  }
  return week;
}

function validateFlightPeriod(week: FlightWeek, fields: AdditionalFlightFields) {
  const start = parseDateOnly(week.departureDate);
  const end = parseDateOnly(week.returnDate);
  if (!start || !end || end < start) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A semana selecionada possui um período inválido para vincular passagens.",
    });
  }

  if (fields.isTicketIssued === 1 && !fields.departureFlightDatetime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Informe a data e hora do voo de ida antes de emitir a passagem adicional.",
    });
  }
  if (
    fields.isTicketIssued === 1 &&
    fields.ticketType === "roundtrip" &&
    !fields.returnFlightDatetime
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Informe a data e hora do voo de volta para uma passagem de ida e volta.",
    });
  }

  const legs: Array<{ label: string; datetime: string | null }> = [
    { label: "ida", datetime: fields.departureFlightDatetime },
    { label: "volta", datetime: fields.returnFlightDatetime },
  ];

  for (const leg of legs) {
    if (!leg.datetime) continue;
    const date = parseDateOnly(leg.datetime);
    if (!date) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `A data do voo de ${leg.label} é inválida.`,
      });
    }
    if (date < start || date > end) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `A data do voo de ${leg.label} deve estar dentro do período da semana selecionada.`,
      });
    }
  }

  const departure = parseDateOnly(fields.departureFlightDatetime);
  const returnDate = parseDateOnly(fields.returnFlightDatetime);
  if (
    fields.ticketType === "roundtrip" &&
    departure &&
    returnDate &&
    returnDate < departure
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A volta não pode ocorrer antes da ida.",
    });
  }
}

function notificationData(flight: AdditionalFlight | AdditionalFlightFields) {
  return {
    departureFlightNumber: flight.departureFlightNumber ?? undefined,
    departureFlightDatetime: flight.departureFlightDatetime ?? undefined,
    departureAirline: flight.departureAirline ?? undefined,
    departureLocator: flight.departureLocator ?? undefined,
    returnFlightNumber: flight.returnFlightNumber ?? undefined,
    returnFlightDatetime: flight.returnFlightDatetime ?? undefined,
    returnAirline: flight.returnAirline ?? undefined,
    returnLocator: flight.returnLocator ?? undefined,
    departureDate: flight.departureFlightDatetime?.slice(0, 10) ?? undefined,
    returnDate: flight.returnFlightDatetime?.slice(0, 10) ?? undefined,
  };
}

function directionSnapshot(
  flight: AdditionalFlight | AdditionalFlightFields,
  direction: NotificationDirection
) {
  const prefix = direction === "departure" ? "departure" : "return";
  const fields = {
    Companhia: flight[`${prefix}Airline` as keyof typeof flight] ?? null,
    "Data e hora": flight[`${prefix}FlightDatetime` as keyof typeof flight] ?? null,
    Aeroporto: flight[`${prefix}Airport` as keyof typeof flight] ?? null,
    "Número do voo": flight[`${prefix}FlightNumber` as keyof typeof flight] ?? null,
    Localizador: flight[`${prefix}Locator` as keyof typeof flight] ?? null,
    Terminal: flight[`${prefix}Terminal` as keyof typeof flight] ?? null,
    "Preço pago": typeof flight.paidPriceCents === "number"
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(flight.paidPriceCents / 100)
      : null,
    Status: flight[`${prefix}Cancelled` as keyof typeof flight]
      ? "Cancelado"
      : flight[`${prefix}Rescheduled` as keyof typeof flight]
        ? "Remarcado"
        : "Ativo",
  };
  return fields;
}

function changedDirection(
  before: AdditionalFlight | AdditionalFlightFields,
  after: AdditionalFlight | AdditionalFlightFields,
  direction: NotificationDirection
) {
  const beforeSnapshot = directionSnapshot(before, direction);
  const afterSnapshot = directionSnapshot(after, direction);
  return Object.keys(beforeSnapshot).some(
    key => beforeSnapshot[key as keyof typeof beforeSnapshot] !== afterSnapshot[key as keyof typeof afterSnapshot]
  );
}

async function notifyTicketChange(
  type: TicketChangeNotification["type"],
  after: AdditionalFlight | AdditionalFlightFields,
  weekNumber: number,
  before?: AdditionalFlight | AdditionalFlightFields
) {
  const recipients = await getTicketNotificationEmails();
  if (recipients.length === 0) return;

  const directions: NotificationDirection[] = ["departure"];
  if (
    after.ticketType !== "oneway" ||
    (before && before.ticketType !== "oneway")
  ) {
    directions.push("return");
  }

  const eventLabel =
    type === "created"
      ? "➕ Passagem adicional criada"
      : type === "deleted"
        ? "🗑️ Passagem adicional excluída"
        : "✏️ Passagem adicional alterada";

  await Promise.all(
    directions
      .filter(direction => !before || type !== "updated" || changedDirection(before, after, direction))
      .map(direction =>
        sendTicketNotificationEmail(recipients.map(recipient => recipient.email), {
          type,
          eventLabel,
          weekNumber,
          ticketType: direction,
          changes:
            type === "updated" && before
              ? {
                  before: directionSnapshot(before, direction),
                  after: directionSnapshot(after, direction),
                }
              : undefined,
          timestamp: new Date(),
          ...notificationData(after),
        })
      )
  );
}

async function notifyWhenIssuedStateChanges(
  after: AdditionalFlight,
  before?: AdditionalFlight
) {
  if (!before) {
    if (after.isTicketIssued === 1) {
      await notifyTicketChange("created", after, after.weekNumber);
    }
    return;
  }

  if (before.isTicketIssued !== 1 && after.isTicketIssued === 1) {
    await notifyTicketChange("created", after, after.weekNumber);
  } else if (before.isTicketIssued === 1 && after.isTicketIssued !== 1) {
    await notifyTicketChange("deleted", before, before.weekNumber);
  } else if (before.isTicketIssued === 1 && after.isTicketIssued === 1) {
    await notifyTicketChange("updated", after, after.weekNumber, before);
  }
}

export const additionalFlightsRouter = router({
  getCalendar: publicProcedure
    .input(z.object({ year: yearSchema }))
    .query(async ({ ctx, input }) => {
      const session = await getSessionFromCookie(ctx.req);
      return session
        ? getAdditionalFlightsForYear(input.year)
        : getPublicAdditionalFlightsForCalendar(input.year);
    }),

  getYear: flightProtectedProcedure
    .input(z.object({ year: yearSchema }))
    .query(({ input }) => getAdditionalFlightsForYear(input.year)),

  create: flightProtectedProcedure
    .input(
      z.object({
        year: yearSchema,
        weekNumber: z.number().int().min(1).max(54),
        ...fieldsSchema.shape,
      })
    )
    .mutation(async ({ input }) => {
      const week = requireActiveWeek(
        await getFlightWeek(input.weekNumber, input.year)
      );
      const fields = normalizeFields(input as Record<string, unknown>);
      validateFlightPeriod(week, fields);

      const created = await createAdditionalFlight({
        year: input.year,
        weekNumber: input.weekNumber,
        ...fields,
      });
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar a passagem adicional.",
        });
      }

      await notifyWhenIssuedStateChanges(created);
      return created;
    }),

  update: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: yearSchema, ...fieldsSchema.shape }))
    .mutation(async ({ input }) => {
      const before = await getAdditionalFlight(input.id, input.year);
      if (!before) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A passagem adicional não foi encontrada.",
        });
      }
      const week = requireActiveWeek(
        await getFlightWeek(before.weekNumber, input.year)
      );
      const { id: _id, year: _year, ...patch } = input;
      const fields = normalizeFields({ ...before, ...patch });
      validateFlightPeriod(week, fields);

      const updated = await updateAdditionalFlight(input.id, input.year, fields);
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível atualizar a passagem adicional.",
        });
      }

      await notifyWhenIssuedStateChanges(updated, before);
      return updated;
    }),

  delete: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: yearSchema }))
    .mutation(async ({ input }) => {
      const before = await getAdditionalFlight(input.id, input.year);
      if (!before) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A passagem adicional não foi encontrada.",
        });
      }

      const deleted = await deleteAdditionalFlight(input.id, input.year);
      if (!deleted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível excluir a passagem adicional.",
        });
      }
      if (before.isTicketIssued === 1) {
        await notifyTicketChange("deleted", before, before.weekNumber);
      }
      return { success: true };
    }),
});
