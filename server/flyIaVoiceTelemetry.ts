import { gte, sql } from "drizzle-orm";
import { flyIaVoiceUsageEvents } from "../drizzle/schema";
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

function nonNegativeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function dashboardNumber(value: unknown) {
  return nonNegativeInteger(value);
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
