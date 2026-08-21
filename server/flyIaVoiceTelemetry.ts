import { gte, sql } from "drizzle-orm";
import { flyIaVoiceUsageEvents, geminiUsageEvents } from "../drizzle/schema";
import { getDb } from "./db";

export type FlyIaVoiceOutcome = "transcribed" | "empty" | "provider_error" | "rejected";

export type FlyIaVoiceTelemetryInput = {
  durationMs: number;
  audioBytes: number;
  latencyMs: number;
  outcome: FlyIaVoiceOutcome;
};

export type FlyIaVoiceDashboard = {
  periodDays: number;
  requests: number;
  transcribed: number;
  failed: number;
  totalDurationMs: number;
  averageDurationMs: number;
  averageAudioBytes: number;
  averageLatencyMs: number;
};

export type FlyIaTelemetryTimelinePoint = {
  date: string;
  label: string;
  totalTokens: number;
  audioDurationMs: number;
};

function nonNegativeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function dashboardNumber(value: unknown) {
  return nonNegativeInteger(value);
}

function dayKey(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function dayLabel(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}` : date;
}

function dailyRange(now: Date, periodDays: number) {
  return Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (periodDays - 1 - index)));
    return date.toISOString().slice(0, 10);
  });
}

export async function recordFlyIaVoiceUsage(input: FlyIaVoiceTelemetryInput) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(flyIaVoiceUsageEvents).values({
      durationMs: nonNegativeInteger(input.durationMs),
      audioBytes: nonNegativeInteger(input.audioBytes),
      latencyMs: nonNegativeInteger(input.latencyMs),
      outcome: input.outcome,
    });
    return true;
  } catch (error) {
    console.error("[Fly.IA Voice] Não foi possível registrar a telemetria", error);
    return false;
  }
}

export async function getFlyIaVoiceDashboard(now = new Date()): Promise<FlyIaVoiceDashboard> {
  const periodDays = 30;
  const fallback: FlyIaVoiceDashboard = {
    periodDays,
    requests: 0,
    transcribed: 0,
    failed: 0,
    totalDurationMs: 0,
    averageDurationMs: 0,
    averageAudioBytes: 0,
    averageLatencyMs: 0,
  };
  const db = await getDb();
  if (!db) return fallback;

  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      requests: sql<number>`COUNT(*)`,
      transcribed: sql<number>`COALESCE(SUM(CASE WHEN ${flyIaVoiceUsageEvents.outcome} = 'transcribed' THEN 1 ELSE 0 END), 0)`,
      failed: sql<number>`COALESCE(SUM(CASE WHEN ${flyIaVoiceUsageEvents.outcome} <> 'transcribed' THEN 1 ELSE 0 END), 0)`,
      totalDurationMs: sql<number>`COALESCE(SUM(${flyIaVoiceUsageEvents.durationMs}), 0)`,
      averageDurationMs: sql<number>`COALESCE(AVG(${flyIaVoiceUsageEvents.durationMs}), 0)`,
      averageAudioBytes: sql<number>`COALESCE(AVG(${flyIaVoiceUsageEvents.audioBytes}), 0)`,
      averageLatencyMs: sql<number>`COALESCE(AVG(${flyIaVoiceUsageEvents.latencyMs}), 0)`,
    })
    .from(flyIaVoiceUsageEvents)
    .where(gte(flyIaVoiceUsageEvents.createdAt, since));
  const row = rows[0];
  if (!row) return fallback;

  return {
    periodDays,
    requests: dashboardNumber(row.requests),
    transcribed: dashboardNumber(row.transcribed),
    failed: dashboardNumber(row.failed),
    totalDurationMs: dashboardNumber(row.totalDurationMs),
    averageDurationMs: dashboardNumber(row.averageDurationMs),
    averageAudioBytes: dashboardNumber(row.averageAudioBytes),
    averageLatencyMs: dashboardNumber(row.averageLatencyMs),
  };
}

/**
 * Série diária sem conteúdo, identidade ou sessão. É usada exclusivamente pelo
 * painel administrativo para relacionar o volume de LLM com a duração de voz.
 */
export async function getFlyIaTelemetryTimeline(now = new Date()): Promise<FlyIaTelemetryTimelinePoint[]> {
  const periodDays = 14;
  const dates = dailyRange(now, periodDays);
  const empty = dates.map(date => ({ date, label: dayLabel(date), totalTokens: 0, audioDurationMs: 0 }));
  const db = await getDb();
  if (!db) return empty;

  const since = new Date(now.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);
  const tokenDay = sql<string>`DATE(${geminiUsageEvents.createdAt})`;
  const voiceDay = sql<string>`DATE(${flyIaVoiceUsageEvents.createdAt})`;
  const [tokenRows, voiceRows] = await Promise.all([
    db.select({ day: tokenDay, totalTokens: sql<number>`COALESCE(SUM(${geminiUsageEvents.totalTokens}), 0)` })
      .from(geminiUsageEvents)
      .where(gte(geminiUsageEvents.createdAt, since))
      .groupBy(tokenDay)
      .orderBy(tokenDay),
    db.select({ day: voiceDay, audioDurationMs: sql<number>`COALESCE(SUM(${flyIaVoiceUsageEvents.durationMs}), 0)` })
      .from(flyIaVoiceUsageEvents)
      .where(gte(flyIaVoiceUsageEvents.createdAt, since))
      .groupBy(voiceDay)
      .orderBy(voiceDay),
  ]);

  const byDate = new Map(empty.map(point => [point.date, point]));
  for (const row of tokenRows) {
    const point = byDate.get(dayKey(row.day));
    if (point) point.totalTokens = dashboardNumber(row.totalTokens);
  }
  for (const row of voiceRows) {
    const point = byDate.get(dayKey(row.day));
    if (point) point.audioDurationMs = dashboardNumber(row.audioDurationMs);
  }
  return empty;
}
