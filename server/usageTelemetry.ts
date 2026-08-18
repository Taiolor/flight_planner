import crypto from "crypto";
import { and, asc, desc, gte, lt, sql } from "drizzle-orm";
import {
  usageTelemetryEvents,
  type InsertUsageTelemetryEvent,
} from "../drizzle/schema";
import { getDb } from "./db";

export type UsageTelemetryEventInput = Omit<
  InsertUsageTelemetryEvent,
  "id" | "sessionHash" | "createdAt"
>;

function hashSession(sessionId: string): string {
  return crypto.createHash("sha256").update(sessionId).digest("hex");
}

export async function recordUsageTelemetryEvents(
  sessionId: string,
  events: UsageTelemetryEventInput[]
): Promise<void> {
  const db = await getDb();
  if (!db || events.length === 0) return;

  const sessionHash = hashSession(sessionId);
  await db.insert(usageTelemetryEvents).values(
    events.map(event => ({ ...event, sessionHash }))
  );
}

export async function getUsageTelemetryMapData(hours: number, limit: number) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select({
      id: usageTelemetryEvents.id,
      eventType: usageTelemetryEvents.eventType,
      route: usageTelemetryEvents.route,
      procedure: usageTelemetryEvents.procedure,
      latitudeE2: usageTelemetryEvents.latitudeE2,
      longitudeE2: usageTelemetryEvents.longitudeE2,
      createdAt: usageTelemetryEvents.createdAt,
    })
    .from(usageTelemetryEvents)
    .where(
      and(
        gte(usageTelemetryEvents.createdAt, since),
        sql`${usageTelemetryEvents.latitudeE2} is not null`,
        sql`${usageTelemetryEvents.longitudeE2} is not null`
      )
    )
    .orderBy(desc(usageTelemetryEvents.createdAt), asc(usageTelemetryEvents.id))
    .limit(limit);
}

export async function getUsageTelemetrySummary(hours: number) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select({
      eventType: usageTelemetryEvents.eventType,
      count: sql<number>`count(*)`,
      located: sql<number>`sum(case when ${usageTelemetryEvents.latitudeE2} is not null then 1 else 0 end)`,
    })
    .from(usageTelemetryEvents)
    .where(gte(usageTelemetryEvents.createdAt, since))
    .groupBy(usageTelemetryEvents.eventType);
}

export async function deleteUsageTelemetryForSession(sessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(usageTelemetryEvents)
    .where(sql`${usageTelemetryEvents.sessionHash} = ${hashSession(sessionId)}`);
}

export async function deleteExpiredUsageTelemetry(retentionDays = 30) {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await db
    .delete(usageTelemetryEvents)
    .where(lt(usageTelemetryEvents.createdAt, cutoff));
  return result[0]?.affectedRows ?? 0;
}
