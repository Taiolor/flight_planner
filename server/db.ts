import crypto from "crypto";
import { and, desc, eq, gt, lt } from "drizzle-orm";
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
  pushSubscriptions,
  InsertPushSubscription,
  notificationSettings,
  notificationLogs,
  InsertNotificationLog,
  flightQuotes,
  InsertFlightQuote,
  apiUsageTracker,
  ticketNotificationEmails,
  InsertTicketNotificationEmail,
  TicketNotificationEmail,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ⚡ Bolt: Single-flight mechanism to prevent thundering herd when multiple requests fetch flight weeks concurrently
let _flightWeeksPromise: Promise<FlightWeek[]> | null = null;

export async function getAllFlightWeeks(): Promise<FlightWeek[]> {
  if (_flightWeeksPromise) return _flightWeeksPromise;

  _flightWeeksPromise = (async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(flightWeeks)
        .orderBy(flightWeeks.weekNumber);
    } finally {
      _flightWeeksPromise = null;
    }
  })();

  return _flightWeeksPromise;
}

export async function getFlightWeek(
  weekNumber: number
): Promise<FlightWeek | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(flightWeeks)
    .where(eq(flightWeeks.weekNumber, weekNumber))
    .limit(1);
  return result[0] || null;
}

export async function upsertFlightWeek(week: InsertFlightWeek) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(flightWeeks)
    .where(eq(flightWeeks.weekNumber, week.weekNumber))
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
      .where(eq(flightWeeks.weekNumber, week.weekNumber));
  } else {
    await db.insert(flightWeeks).values(week);
  }
}

export async function updateFlightWeekStatus(
  weekNumber: number,
  data: {
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
    ticketType?: string | null;
    smilesPoints?: number | null;
    latamPassPoints?: number | null;
  }
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(flightWeeks)
    .where(eq(flightWeeks.weekNumber, weekNumber))
    .limit(1);

  if (existing.length === 0) return;

  await db
    .update(flightWeeks)
    .set(data)
    .where(eq(flightWeeks.weekNumber, weekNumber));
}

export async function initFlightWeeks(weeks: InsertFlightWeek[]) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(flightWeeks).limit(1);
  if (existing.length > 0) return; // Already initialized

  await db.insert(flightWeeks).values(weeks);
}

// =====================
// Flight Prices
// =====================

// ⚡ Bolt: Single-flight mechanism to prevent thundering herd when multiple requests fetch flight prices concurrently
let _flightPricesPromise: Promise<(typeof flightPrices.$inferSelect)[]> | null =
  null;

export async function getAllFlightPrices(): Promise<
  (typeof flightPrices.$inferSelect)[]
> {
  if (_flightPricesPromise) return _flightPricesPromise;

  _flightPricesPromise = (async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(flightPrices);
    } finally {
      _flightPricesPromise = null;
    }
  })();

  return _flightPricesPromise;
}

export async function getPublicPrices() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: public_prices.id, weekNumber: public_prices.weekNumber, airline: public_prices.airline, price: public_prices.price, createdAt: public_prices.createdAt, updatedAt: public_prices.updatedAt }).from(public_prices);
}

export async function upsertFlightPrice(
  weekNumber: number,
  airline: string,
  price: string
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(flightPrices)
    .where(
      and(
        eq(flightPrices.weekNumber, weekNumber),
        eq(flightPrices.airline, airline)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(flightPrices)
      .set({ price })
      .where(
        and(
          eq(flightPrices.weekNumber, weekNumber),
          eq(flightPrices.airline, airline)
        )
      );
  } else {
    await db.insert(flightPrices).values({ weekNumber, airline, price });
  }
}

export async function deleteFlightPrice(weekNumber: number, airline: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(flightPrices)
    .where(
      and(
        eq(flightPrices.weekNumber, weekNumber),
        eq(flightPrices.airline, airline)
      )
    );
}

// =====================
// Auth Sessions
// =====================

export async function createAuthSession(email: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gerar token único
  const token = crypto.randomBytes(32).toString("hex");

  // Sessão expira em 8 horas
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await db.insert(authSessions).values({
    sessionToken: token,
    email,
    expiresAt,
  });

  return token;
}

export async function validateAuthSession(
  token: string
): Promise<{ email: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const result = await db
    .select()
    .from(authSessions)
    .where(
      and(eq(authSessions.sessionToken, token), gt(authSessions.expiresAt, now))
    )
    .limit(1);

  if (result.length === 0) return null;
  return { email: result[0].email };
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

let cachedSettingsPromise: Promise<{
  aviso1Minutes: number;
  aviso2Minutes: number;
}> | null = null;

export async function getNotificationSettings() {
  if (cachedSettingsPromise) {
    return cachedSettingsPromise;
  }

  cachedSettingsPromise = (async () => {
    const db = await getDb();
    if (!db) return { aviso1Minutes: 1440, aviso2Minutes: 0 };

    const rows = await db.select().from(notificationSettings).limit(1);
    if (rows.length === 0) {
      // Criar registro padrão se não existir
      await db
        .insert(notificationSettings)
        .values({ aviso1Minutes: 1440, aviso2Minutes: 0 });
      return { aviso1Minutes: 1440, aviso2Minutes: 0 };
    }
    return {
      aviso1Minutes: rows[0].aviso1Minutes,
      aviso2Minutes: rows[0].aviso2Minutes,
    };
  })();

  try {
    return await cachedSettingsPromise;
  } catch (error) {
    cachedSettingsPromise = null;
    throw error;
  }
}

export async function updateNotificationSettings(
  aviso1Minutes: number,
  aviso2Minutes: number
) {
  const db = await getDb();
  if (!db) return;

  const rows = await db.select().from(notificationSettings).limit(1);
  if (rows.length === 0) {
    await db
      .insert(notificationSettings)
      .values({ aviso1Minutes, aviso2Minutes });
  } else {
    await db
      .update(notificationSettings)
      .set({ aviso1Minutes, aviso2Minutes })
      .where(eq(notificationSettings.id, rows[0].id));
  }

  // Invalidate cache
  cachedSettingsPromise = Promise.resolve({ aviso1Minutes, aviso2Minutes });
}

// =====================
// Notification Logs
// =====================

export async function insertNotificationLog(
  data: InsertNotificationLog
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificationLogs).values(data);
}

export async function getNotificationLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notificationLogs)
    .orderBy(desc(notificationLogs.sentAt))
    .limit(limit);
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

export async function getAllFlightQuotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flightQuotes).orderBy(desc(flightQuotes.quotedAt));
}

export async function getFlightQuotesByWeek(weekNumber: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(flightQuotes)
    .where(eq(flightQuotes.weekNumber, weekNumber))
    .orderBy(desc(flightQuotes.quotedAt));
}

export async function insertFlightQuote(data: InsertFlightQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(flightQuotes).values(data);
  return result;
}

export async function deleteFlightQuote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(flightQuotes).where(eq(flightQuotes.id, id));
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
