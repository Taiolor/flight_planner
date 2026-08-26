import crypto from "crypto";
import { and, desc, eq, gt, gte, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  FlightWeek,
  InsertUser,
  users,
  flightWeeks,
  flightPrices,
  public_prices,
  InsertFlightWeek,
  InsertFlightPrice,
  authSessions,
  InsertAuthSession,
  flightAccessRoles,
  pushSubscriptions,
  InsertPushSubscription,
  notificationSettings,
  notificationLogs,
  InsertNotificationLog,
  flightQuotes,
  InsertFlightQuote,
  planningYears,
  InsertPlanningYear,
  apiUsageTracker,
  ticketNotificationEmails,
  InsertTicketNotificationEmail,
  TicketNotificationEmail,
  performanceMetrics,
  pwaInstallationEvents,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  buildNotificationLogPage,
  type NotificationLogCursor,
} from "./notificationLogPagination";
import {
  summarizeNotificationLogsByDay,
  type NotificationLogStatus,
} from "./notificationLogAnalytics";
import { buildNotificationLogSearchPattern } from "./notificationLogSearch";
import {
  isFlightWeeksSchemaMismatchError,
  isTransientFlightWeeksReadError,
  retryTransientFlightWeeksRead,
} from "./flightWeeksQueryRecovery";

function getNotificationLogSearchCondition(search?: string) {
  const searchPattern = buildNotificationLogSearchPattern(search);
  return searchPattern
    ? sql`CONCAT_WS(' ', ${notificationLogs.weekNumber}, ${notificationLogs.direction}, ${notificationLogs.avisoLabel}, ${notificationLogs.airline}, ${notificationLogs.flightNumber}, ${notificationLogs.status}, ${notificationLogs.errorMessage}, ${notificationLogs.deliveryKey}) LIKE ${searchPattern} ESCAPE '\\'`
    : undefined;
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// =====================
// Flight Weeks
// =====================

const DEFAULT_PLANNING_YEAR = 2026;
const flightWeeksPromises = new Map<number, Promise<FlightWeek[]>>();
const FLIGHT_WEEKS_RELIABILITY_METRIC = "DBQ";
const FLIGHT_WEEKS_TRANSIENT_PROCEDURE = "flights.getWeeks.transient";
const FLIGHT_WEEKS_SCHEMA_PROCEDURE = "flights.getWeeks.schema";
export const flightWeeksProjection = {
  id: flightWeeks.id,
  year: flightWeeks.year,
  weekNumber: flightWeeks.weekNumber,
  departureDate: flightWeeks.departureDate,
  returnDate: flightWeeks.returnDate,
  departureDayOfWeek: flightWeeks.departureDayOfWeek,
  returnDayOfWeek: flightWeeks.returnDayOfWeek,
  holiday: flightWeeks.holiday,
  isDeleted: flightWeeks.isDeleted,
  isTicketIssued: flightWeeks.isTicketIssued,
  isSelected: flightWeeks.isSelected,
  departureAirline: flightWeeks.departureAirline,
  returnAirline: flightWeeks.returnAirline,
  departureFlightDatetime: flightWeeks.departureFlightDatetime,
  returnFlightDatetime: flightWeeks.returnFlightDatetime,
  departureAirport: flightWeeks.departureAirport,
  returnAirport: flightWeeks.returnAirport,
  departureLocator: flightWeeks.departureLocator,
  returnLocator: flightWeeks.returnLocator,
  departureFlightNumber: flightWeeks.departureFlightNumber,
  returnFlightNumber: flightWeeks.returnFlightNumber,
  departureTerminal: flightWeeks.departureTerminal,
  returnTerminal: flightWeeks.returnTerminal,
  ticketType: flightWeeks.ticketType,
  smilesPoints: flightWeeks.smilesPoints,
  latamPassPoints: flightWeeks.latamPassPoints,
  departureRescheduled: flightWeeks.departureRescheduled,
  returnRescheduled: flightWeeks.returnRescheduled,
  departureCancelled: flightWeeks.departureCancelled,
  returnCancelled: flightWeeks.returnCancelled,
  createdAt: flightWeeks.createdAt,
  updatedAt: flightWeeks.updatedAt,
};

async function recordFlightWeeksReadFailure(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  error: unknown
) {
  const procedure = isFlightWeeksSchemaMismatchError(error)
    ? FLIGHT_WEEKS_SCHEMA_PROCEDURE
    : FLIGHT_WEEKS_TRANSIENT_PROCEDURE;

  try {
    await db.insert(performanceMetrics).values({
      metric: FLIGHT_WEEKS_RELIABILITY_METRIC,
      value: 1,
      route: "/",
      procedure,
    });
  } catch {
    // A telemetria jamais deve impedir o retorno controlado do erro original.
  }
}

export type FlightWeeksReliabilitySummary = {
  transientFailures: number;
  schemaFailures: number;
  lastFailureAt: Date | null;
};

export async function getFlightWeeksReliabilitySummary(
  hours: number
): Promise<FlightWeeksReliabilitySummary> {
  const db = await getDb();
  if (!db) {
    return { transientFailures: 0, schemaFailures: 0, lastFailureAt: null };
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await db
    .select({
      procedure: performanceMetrics.procedure,
      count: sql<number>`count(*)`,
      lastFailureAt: sql<Date | null>`max(${performanceMetrics.recordedAt})`,
    })
    .from(performanceMetrics)
    .where(
      and(
        eq(performanceMetrics.metric, FLIGHT_WEEKS_RELIABILITY_METRIC),
        gte(performanceMetrics.recordedAt, since)
      )
    )
    .groupBy(performanceMetrics.procedure);

  return rows.reduce<FlightWeeksReliabilitySummary>(
    (summary, row) => {
      const count = Number(row.count);
      if (row.procedure === FLIGHT_WEEKS_SCHEMA_PROCEDURE) {
        summary.schemaFailures += count;
      } else if (row.procedure === FLIGHT_WEEKS_TRANSIENT_PROCEDURE) {
        summary.transientFailures += count;
      }

      if (
        row.lastFailureAt &&
        (!summary.lastFailureAt || row.lastFailureAt > summary.lastFailureAt)
      ) {
        summary.lastFailureAt = row.lastFailureAt;
      }
      return summary;
    },
    { transientFailures: 0, schemaFailures: 0, lastFailureAt: null }
  );
}

export async function getAllFlightWeeks(
  year = DEFAULT_PLANNING_YEAR
): Promise<FlightWeek[]> {
  const cached = flightWeeksPromises.get(year);
  if (cached) return cached;

  const request = (async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      try {
        return await retryTransientFlightWeeksRead(
          () =>
            db
              .select(flightWeeksProjection)
              .from(flightWeeks)
              .where(eq(flightWeeks.year, year))
              .orderBy(flightWeeks.weekNumber),
          {
            onTransientFailure: error =>
              recordFlightWeeksReadFailure(db, error),
          }
        );
      } catch (error) {
        if (!isTransientFlightWeeksReadError(error)) {
          await recordFlightWeeksReadFailure(db, error);
        }
        throw error;
      }
    } finally {
      flightWeeksPromises.delete(year);
    }
  })();

  flightWeeksPromises.set(year, request);
  return request;
}

export async function getFlightWeek(
  weekNumber: number,
  year = DEFAULT_PLANNING_YEAR
): Promise<FlightWeek | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(flightWeeks)
    .where(
      and(
        eq(flightWeeks.weekNumber, weekNumber),
        eq(flightWeeks.year, year)
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function upsertFlightWeek(week: InsertFlightWeek) {
  const db = await getDb();
  if (!db) return;

  const yearToUse = week.year ?? DEFAULT_PLANNING_YEAR;
  const existing = await db
    .select()
    .from(flightWeeks)
    .where(
      and(
        eq(flightWeeks.weekNumber, week.weekNumber),
        eq(flightWeeks.year, yearToUse)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(flightWeeks)
      .set({
        departureDate: week.departureDate,
        returnDate: week.returnDate,
        departureDayOfWeek: week.departureDayOfWeek,
        returnDayOfWeek: week.returnDayOfWeek,
        holiday: week.holiday,
        isDeleted: week.isDeleted,
        isTicketIssued: week.isTicketIssued,
        isSelected: week.isSelected,
      })
      .where(
        and(
          eq(flightWeeks.weekNumber, week.weekNumber),
          eq(flightWeeks.year, yearToUse)
        )
      );
  } else {
    await db.insert(flightWeeks).values(week);
  }
}

export async function updateFlightWeekStatus(
  weekNumber: number,
  data: {
    year?: number;
    isDeleted?: number;
    isTicketIssued?: number;
    isSelected?: number;
    departureDate?: string;
    returnDate?: string;
    departureDayOfWeek?: string;
    returnDayOfWeek?: string;
    departureAirline?: string | null;
    returnAirline?: string | null;
    departureFlightDatetime?: string | null;
    returnFlightDatetime?: string | null;
    departureAirport?: string | null;
    returnAirport?: string | null;
    departureLocator?: string | null;
    returnLocator?: string | null;
    departureFlightNumber?: string | null;
    returnFlightNumber?: string | null;
    departureTerminal?: string | null;
    returnTerminal?: string | null;
    ticketType?: string | null;
    smilesPoints?: number | null;
    latamPassPoints?: number | null;
    departureRescheduled?: number;
    returnRescheduled?: number;
    departureCancelled?: number;
    returnCancelled?: number;
  }
) {
  const db = await getDb();
  if (!db) return;

  const currentYear = data.year ?? DEFAULT_PLANNING_YEAR;

  const existing = await db
    .select()
    .from(flightWeeks)
    .where(
      and(
        eq(flightWeeks.weekNumber, weekNumber),
        eq(flightWeeks.year, currentYear)
      )
    )
    .limit(1);

  if (existing.length === 0) return;

  await db
    .update(flightWeeks)
    .set(data)
    .where(
      and(
        eq(flightWeeks.weekNumber, weekNumber),
        eq(flightWeeks.year, currentYear)
      )
    );
}

export async function initFlightWeeks(
  weeks: InsertFlightWeek[],
  year = DEFAULT_PLANNING_YEAR
) {
  const db = await getDb();
  if (!db || weeks.length === 0) return;

  // A chave única (year, weekNumber) transforma a operação em um merge seguro:
  // inserimos semanas ausentes e preservamos qualquer edição já feita pelo usuário.
  await db
    .insert(flightWeeks)
    .values(weeks.map(week => ({ ...week, year })))
    .onDuplicateKeyUpdate({
      set: { weekNumber: sql`${flightWeeks.weekNumber}` },
    });
}

// =====================
// Flight Prices
// =====================

const flightPricesPromises = new Map<
  number,
  Promise<(typeof flightPrices.$inferSelect)[]>
>();

export async function getAllFlightPrices(
  year = DEFAULT_PLANNING_YEAR
): Promise<(typeof flightPrices.$inferSelect)[]> {
  const cached = flightPricesPromises.get(year);
  if (cached) return cached;

  const request = (async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(flightPrices)
        .where(eq(flightPrices.year, year));
    } finally {
      flightPricesPromises.delete(year);
    }
  })();

  flightPricesPromises.set(year, request);
  return request;
}

export async function getPublicPrices(year = DEFAULT_PLANNING_YEAR) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: public_prices.id,
      year: public_prices.year,
      weekNumber: public_prices.weekNumber,
      airline: public_prices.airline,
      price: public_prices.price,
      createdAt: public_prices.createdAt,
      updatedAt: public_prices.updatedAt,
    })
    .from(public_prices)
    .where(eq(public_prices.year, year));
}

export async function upsertFlightPrice(
  weekNumber: number,
  airline: string,
  price: string,
  year = DEFAULT_PLANNING_YEAR
) {
  const db = await getDb();
  if (!db) return;

  const criteria = and(
    eq(flightPrices.weekNumber, weekNumber),
    eq(flightPrices.airline, airline),
    eq(flightPrices.year, year)
  );
  const existing = await db
    .select()
    .from(flightPrices)
    .where(criteria)
    .limit(1);

  if (existing.length > 0) {
    await db.update(flightPrices).set({ price }).where(criteria);
  } else {
    await db.insert(flightPrices).values({
      year,
      weekNumber,
      airline,
      price,
    });
  }
}

export async function deleteFlightPrice(
  weekNumber: number,
  airline: string,
  year = DEFAULT_PLANNING_YEAR
) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(flightPrices)
    .where(
      and(
        eq(flightPrices.weekNumber, weekNumber),
        eq(flightPrices.airline, airline),
        eq(flightPrices.year, year)
      )
    );
}

// =====================
// Auth Sessions
// =====================

export async function createAuthSession(email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedEmail = email.toLowerCase().trim();
  const isBootstrapAdmin =
    Boolean(ENV.authEmail) && normalizedEmail === ENV.authEmail.toLowerCase();

  await db
    .insert(flightAccessRoles)
    .values({
      email: normalizedEmail,
      role: isBootstrapAdmin ? "admin" : "user",
    })
    .onDuplicateKeyUpdate({ set: { email: normalizedEmail } });

  // Gerar token único
  const token = crypto.randomBytes(32).toString("hex");

  // Sessão expira em 8 horas
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await db.insert(authSessions).values({
    sessionToken: token,
    email: normalizedEmail,
    expiresAt,
  });

  return token;
}

export async function validateAuthSession(
  token: string
): Promise<{ email: string; role: "user" | "admin" } | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const result = await db
    .select({
      email: authSessions.email,
      role: flightAccessRoles.role,
    })
    .from(authSessions)
    .innerJoin(
      flightAccessRoles,
      eq(authSessions.email, flightAccessRoles.email)
    )
    .where(
      and(eq(authSessions.sessionToken, token), gt(authSessions.expiresAt, now))
    )
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function deleteAuthSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(authSessions).where(eq(authSessions.sessionToken, token));
}

export async function cleanExpiredSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  await db.delete(authSessions).where(lt(authSessions.expiresAt, now));
}

// =====================
// Push Subscriptions
// =====================

export async function savePushSubscription(
  data: InsertPushSubscription
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Verificar se já existe uma subscription com o mesmo endpoint
  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, data.endpoint))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar chaves caso tenham mudado
    await db
      .update(pushSubscriptions)
      .set({
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
      })
      .where(eq(pushSubscriptions.endpoint, data.endpoint));
  } else {
    await db.insert(pushSubscriptions).values(data);
  }
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function getAllPushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions);
}

export async function getPushSubscriptionByEndpoint(endpoint: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// =====================
// Notification Settings
// =====================

export type NotificationChannelSettings = {
  aviso1Minutes: number;
  aviso2Minutes: number;
  flightPushEnabled: boolean;
  ticketEmailEnabled: boolean;
};

const defaultNotificationSettings: NotificationChannelSettings = {
  aviso1Minutes: 1440,
  aviso2Minutes: 0,
  flightPushEnabled: true,
  ticketEmailEnabled: true,
};

let cachedSettingsPromise: Promise<NotificationChannelSettings> | null = null;

export async function getNotificationSettings() {
  if (cachedSettingsPromise) {
    return cachedSettingsPromise;
  }

  cachedSettingsPromise = (async () => {
    const db = await getDb();
    if (!db) return defaultNotificationSettings;

    const rows = await db.select().from(notificationSettings).limit(1);
    if (rows.length === 0) {
      // Criar registro padrão se não existir
      await db
        .insert(notificationSettings)
        .values({
          aviso1Minutes: defaultNotificationSettings.aviso1Minutes,
          aviso2Minutes: defaultNotificationSettings.aviso2Minutes,
          flightPushEnabled: 1,
          ticketEmailEnabled: 1,
        });
      return defaultNotificationSettings;
    }
    return {
      aviso1Minutes: rows[0].aviso1Minutes,
      aviso2Minutes: rows[0].aviso2Minutes,
      flightPushEnabled: rows[0].flightPushEnabled === 1,
      ticketEmailEnabled: rows[0].ticketEmailEnabled === 1,
    };
  })();

  try {
    return await cachedSettingsPromise;
  } catch (error) {
    cachedSettingsPromise = null;
    throw error;
  }
}

export async function updateNotificationSettings(settings: NotificationChannelSettings) {
  const db = await getDb();
  if (!db) return;

  const rows = await db.select().from(notificationSettings).limit(1);
  if (rows.length === 0) {
    await db
      .insert(notificationSettings)
      .values({
        aviso1Minutes: settings.aviso1Minutes,
        aviso2Minutes: settings.aviso2Minutes,
        flightPushEnabled: settings.flightPushEnabled ? 1 : 0,
        ticketEmailEnabled: settings.ticketEmailEnabled ? 1 : 0,
      });
  } else {
    await db
      .update(notificationSettings)
      .set({
        aviso1Minutes: settings.aviso1Minutes,
        aviso2Minutes: settings.aviso2Minutes,
        flightPushEnabled: settings.flightPushEnabled ? 1 : 0,
        ticketEmailEnabled: settings.ticketEmailEnabled ? 1 : 0,
      })
      .where(eq(notificationSettings.id, rows[0].id));
  }

  // Invalidate cache
  cachedSettingsPromise = Promise.resolve(settings);
}

export type PwaInstallationInput = {
  installationId: string;
  platform: "ios" | "android" | "desktop" | "unknown";
  method: "native" | "manual";
};

export async function recordPwaInstallation(input: PwaInstallationInput) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db.insert(pwaInstallationEvents).values({
    ...input,
    consentedAt: now,
    installedAt: now,
  }).onDuplicateKeyUpdate({
    set: { platform: input.platform, method: input.method, installedAt: now },
  });
}

export async function deletePwaInstallation(installationId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pwaInstallationEvents).where(eq(pwaInstallationEvents.installationId, installationId));
}

export async function getRecentPwaInstallations(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: pwaInstallationEvents.id,
      platform: pwaInstallationEvents.platform,
      method: pwaInstallationEvents.method,
      installedAt: pwaInstallationEvents.installedAt,
    })
    .from(pwaInstallationEvents)
    .orderBy(desc(pwaInstallationEvents.installedAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

// =====================
// Notification Logs
// =====================

export async function insertNotificationLog(
  data: InsertNotificationLog & { year: number }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificationLogs).values(data);
}

export async function getNotificationLogs(
  year: number,
  limit = 25,
  cursor?: NotificationLogCursor,
  status?: NotificationLogStatus,
  search?: string
) {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null };

  const cursorCondition = cursor
    ? or(
        lt(notificationLogs.sentAt, cursor.sentAt),
        and(
          eq(notificationLogs.sentAt, cursor.sentAt),
          lt(notificationLogs.id, cursor.id)
        )
      )
    : undefined;
  const whereClause = and(
    eq(notificationLogs.year, year),
    status ? eq(notificationLogs.status, status) : undefined,
    getNotificationLogSearchCondition(search),
    cursorCondition
  );

  const rows = await db
    .select()
    .from(notificationLogs)
    .where(whereClause)
    .orderBy(desc(notificationLogs.sentAt), desc(notificationLogs.id))
    .limit(limit + 1);

  return buildNotificationLogPage(rows, limit);
}

export async function getNotificationLogDailySummary(
  year: number,
  status?: NotificationLogStatus,
  search?: string
) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({ sentAt: notificationLogs.sentAt, status: notificationLogs.status })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.year, year),
        status ? eq(notificationLogs.status, status) : undefined,
        getNotificationLogSearchCondition(search)
      )
    )
    .orderBy(desc(notificationLogs.sentAt), desc(notificationLogs.id));

  return summarizeNotificationLogsByDay(rows);
}

export async function getNotificationLogsForExport(
  year: number,
  status?: NotificationLogStatus,
  search?: string
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.year, year),
        status ? eq(notificationLogs.status, status) : undefined,
        getNotificationLogSearchCondition(search)
      )
    )
    .orderBy(desc(notificationLogs.sentAt), desc(notificationLogs.id));
}

/**
 * Reserva um envio automático pelo identificador único da entrega. Se o
 * callback for repetido pela plataforma, o registro existente impede um novo
 * push para o mesmo voo, trecho e janela de aviso.
 */
export async function claimNotificationDelivery(
  data: InsertNotificationLog & { year: number; deliveryKey: string }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(notificationLogs).values(data);
    return true;
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return false;
    }
    throw error;
  }
}

export async function completeNotificationDelivery(
  deliveryKey: string,
  data: {
    status: string;
    devicesReached: number;
    totalDevices: number;
    errorMessage?: string | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notificationLogs)
    .set(data)
    .where(eq(notificationLogs.deliveryKey, deliveryKey));
}

export async function deleteOldNotificationLogs(daysOld = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    await db
      .delete(notificationLogs)
      .where(lt(notificationLogs.sentAt, cutoffDate));
    return 1; // Sucesso
  } catch (error) {
    console.error("[Cleanup] Erro ao deletar logs antigos:", error);
    return 0;
  }
}

// =====================
// Flight Quotes
// =====================

export async function getAllFlightQuotes(year: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(flightQuotes)
    .where(eq(flightQuotes.year, year))
    .orderBy(desc(flightQuotes.quotedAt));
}

export async function getFlightQuotesByWeek(
  weekNumber: number,
  year: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(flightQuotes)
    .where(
      and(
        eq(flightQuotes.weekNumber, weekNumber),
        eq(flightQuotes.year, year)
      )
    )
    .orderBy(desc(flightQuotes.quotedAt));
}

export async function insertFlightQuote(
  data: InsertFlightQuote & { year: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(flightQuotes)
    .values(data);
  return result;
}

export async function deleteFlightQuote(id: number, year: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(flightQuotes)
    .where(and(eq(flightQuotes.id, id), eq(flightQuotes.year, year)));
}

// =====================
// Planning Years
// =====================

export async function getPlanningYears() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planningYears).orderBy(desc(planningYears.year));
}

export async function upsertPlanningYear(data: InsertPlanningYear) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(planningYears)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        status: data.status,
        weekCount: data.weekCount,
      },
    });
}

// =====================
// API Usage Tracker
// =====================

export async function getApiUsage(yearMonth: string) {
  const db = await getDb();
  if (!db) return { requestsUsed: 0, requestsLimit: 20 };

  const rows = await db
    .select()
    .from(apiUsageTracker)
    .where(eq(apiUsageTracker.yearMonth, yearMonth))
    .limit(1);

  if (rows.length === 0) {
    return { requestsUsed: 0, requestsLimit: 20 };
  }
  return {
    requestsUsed: rows[0].requestsUsed,
    requestsLimit: rows[0].requestsLimit,
  };
}

export async function incrementApiUsage(
  yearMonth: string
): Promise<{ requestsUsed: number; requestsLimit: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select()
    .from(apiUsageTracker)
    .where(eq(apiUsageTracker.yearMonth, yearMonth))
    .limit(1);

  if (rows.length === 0) {
    await db.insert(apiUsageTracker).values({
      yearMonth,
      requestsUsed: 1,
      requestsLimit: 20,
    });
    return { requestsUsed: 1, requestsLimit: 20 };
  } else {
    const newCount = rows[0].requestsUsed + 1;
    await db
      .update(apiUsageTracker)
      .set({ requestsUsed: newCount })
      .where(eq(apiUsageTracker.yearMonth, yearMonth));
    return { requestsUsed: newCount, requestsLimit: rows[0].requestsLimit };
  }
}

/**
 * Reserva uma consulta da franquia mensal em uma única operação atômica.
 * O retorno `reserved: false` indica que o limite já havia sido atingido,
 * sem permitir que chamadas concorrentes ultrapassem a cota configurada.
 */
export async function reserveApiUsage(
  yearMonth: string
): Promise<{ reserved: boolean; requestsUsed: number; requestsLimit: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    INSERT INTO api_usage_tracker (yearMonth, requestsUsed, requestsLimit)
    VALUES (${yearMonth}, 1, 20)
    ON DUPLICATE KEY UPDATE
      requestsUsed = IF(requestsUsed < requestsLimit, requestsUsed + 1, requestsUsed)
  `);
  const header = (Array.isArray(result) ? result[0] : result) as {
    affectedRows?: number;
  };
  const usage = await getApiUsage(yearMonth);

  return {
    reserved: Number(header.affectedRows ?? 0) > 0,
    ...usage,
  };
}

// ============================================================================
// Ticket Notification Emails - CRUD helpers
// ============================================================================

/**
 * Get all ticket notification email recipients
 */
let cachedEmails: TicketNotificationEmail[] | null = null;
let emailsCacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

export function invalidateEmailsCache() {
  cachedEmails = null;
  emailsCacheTimestamp = 0;
}

export async function getTicketNotificationEmails(): Promise<
  TicketNotificationEmail[]
> {
  const now = Date.now();
  if (cachedEmails && now - emailsCacheTimestamp < CACHE_TTL) {
    return cachedEmails;
  }

  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get ticket notification emails: database not available"
    );
    return [];
  }

  try {
    const rows = await db
      .select()
      .from(ticketNotificationEmails)
      .where(eq(ticketNotificationEmails.active, 1))
      .orderBy(desc(ticketNotificationEmails.createdAt));

    // Update cache
    cachedEmails = rows;
    emailsCacheTimestamp = now;

    return rows;
  } catch (error) {
    console.error(
      "[Database] Error fetching ticket notification emails:",
      error
    );
    return [];
  }
}

/**
 * Add a new ticket notification email recipient
 */
export async function addTicketNotificationEmail(
  email: string,
  name?: string
): Promise<TicketNotificationEmail | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot add ticket notification email: database not available"
    );
    return null;
  }

  try {
    const result = await db.insert(ticketNotificationEmails).values({
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
    });

    // Fetch and return the inserted row
    const rows = await db
      .select()
      .from(ticketNotificationEmails)
      .where(eq(ticketNotificationEmails.email, email.toLowerCase().trim()));

    invalidateEmailsCache();
    invalidateEmailsCache();
    return rows[0] || null;
  } catch (error) {
    console.error("[Database] Error adding ticket notification email:", error);
    return null;
  }
}

/**
 * Remove a ticket notification email recipient by ID
 */
export async function removeTicketNotificationEmail(
  emailId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot remove ticket notification email: database not available"
    );
    return false;
  }

  try {
    await db
      .delete(ticketNotificationEmails)
      .where(eq(ticketNotificationEmails.id, emailId));
    invalidateEmailsCache();
    return true;
  } catch (error) {
    console.error(
      "[Database] Error removing ticket notification email:",
      error
    );
    return false;
  }
}

/**
 * Update a ticket notification email recipient
 */
export async function updateTicketNotificationEmail(
  emailId: number,
  updates: { name?: string }
): Promise<TicketNotificationEmail | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot update ticket notification email: database not available"
    );
    return null;
  }

  try {
    await db
      .update(ticketNotificationEmails)
      .set({
        name: updates.name?.trim() || null,
      })
      .where(eq(ticketNotificationEmails.id, emailId));

    // Fetch and return the updated row
    const rows = await db
      .select()
      .from(ticketNotificationEmails)
      .where(eq(ticketNotificationEmails.id, emailId));

    return rows[0] || null;
  } catch (error) {
    console.error(
      "[Database] Error updating ticket notification email:",
      error
    );
    return null;
  }
}
