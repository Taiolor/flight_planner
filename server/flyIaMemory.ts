import crypto from "crypto";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import {
  flyIaContextMetrics,
  flyIaSessionMemories,
} from "../drizzle/schema";
import { getDb } from "./db";

export const FLY_IA_MEMORY_TTL_MS = 8 * 60 * 60 * 1000;
export const FLY_IA_MEMORY_MAX_CHARS = 2_400;

export type FlyIaContextMetricInput = {
  sessionKey: string;
  year: number;
  model: string;
  outcome: "generated" | "deterministic" | "provider_error" | "budget_blocked";
  contextChars: number;
  historyChars: number;
  payloadHistoryChars: number;
  memoryChars: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
};

function integerAtLeast(value: number, minimum = 0) {
  return Math.max(minimum, Math.round(Number.isFinite(value) ? value : 0));
}

/** A chave é derivada do cookie de sessão e nunca persiste o token original. */
export function createFlyIaSessionKey(email: string, sessionToken?: string) {
  return crypto
    .createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${sessionToken || "no-session-token"}`)
    .digest("hex");
}

export function sanitizeFlyIaSessionMemory(value: string) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[dado removido]")
    .replace(/\b(localizador|locator)\s*[:#-]?\s*[A-Za-z0-9-]{4,}\b/gi, "$1: [dado removido]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-FLY_IA_MEMORY_MAX_CHARS);
}

/**
 * Mantém apenas fatos já apresentados pelo assistente. Perguntas livres do
 * usuário não são persistidas para reduzir o risco de reter informação pessoal.
 */
export function mergeFlyIaSessionMemory(existingSummary: string | null, answer: string) {
  const cleanAnswer = sanitizeFlyIaSessionMemory(answer);
  const combined = [existingSummary, cleanAnswer].filter(Boolean).join("\n\n");
  return sanitizeFlyIaSessionMemory(combined);
}

export function isFlyIaSessionMemoryActive(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime();
}

export function buildFlyIaSessionMemoryRecord(input: {
  sessionKey: string;
  year: number;
  existingSummary: string | null;
  answer: string;
  sourceResponsesCount: number;
  now: Date;
}) {
  const summary = mergeFlyIaSessionMemory(input.existingSummary, input.answer);
  return {
    sessionKey: input.sessionKey,
    year: input.year,
    summary,
    summaryChars: summary.length,
    sourceResponsesCount: integerAtLeast(input.sourceResponsesCount + 1),
    expiresAt: new Date(input.now.getTime() + FLY_IA_MEMORY_TTL_MS),
    updatedAt: input.now,
  };
}

export async function getFlyIaSessionMemory(
  sessionKey: string,
  year: number,
  now = new Date()
) {
  const db = await getDb();
  if (!db) return null;
  await db.delete(flyIaSessionMemories).where(
    and(
      eq(flyIaSessionMemories.sessionKey, sessionKey),
      eq(flyIaSessionMemories.year, year),
      lte(flyIaSessionMemories.expiresAt, now)
    )
  );
  const rows = await db
    .select()
    .from(flyIaSessionMemories)
    .where(
      and(
        eq(flyIaSessionMemories.sessionKey, sessionKey),
        eq(flyIaSessionMemories.year, year),
        gt(flyIaSessionMemories.expiresAt, now)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function saveFlyIaSessionMemory(input: {
  sessionKey: string;
  year: number;
  existingSummary: string | null;
  answer: string;
  sourceResponsesCount: number;
  now?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const now = input.now ?? new Date();
  const record = buildFlyIaSessionMemoryRecord({ ...input, now });
  await db
    .insert(flyIaSessionMemories)
    .values({
      sessionKey: record.sessionKey,
      year: record.year,
      summary: record.summary,
      summaryChars: record.summaryChars,
      sourceResponsesCount: record.sourceResponsesCount,
      expiresAt: record.expiresAt,
    })
    .onDuplicateKeyUpdate({
      set: {
        summary: record.summary,
        summaryChars: record.summaryChars,
        sourceResponsesCount: record.sourceResponsesCount,
        expiresAt: record.expiresAt,
        updatedAt: record.updatedAt,
      },
    });
  return { summary: record.summary, expiresAt: record.expiresAt };
}

export async function recordFlyIaContextMetric(input: FlyIaContextMetricInput) {
  const db = await getDb();
  if (!db) return;
  await db.insert(flyIaContextMetrics).values({
    sessionKey: input.sessionKey,
    year: integerAtLeast(input.year),
    model: input.model.slice(0, 80),
    outcome: input.outcome,
    contextChars: integerAtLeast(input.contextChars),
    historyChars: integerAtLeast(input.historyChars),
    payloadHistoryChars: integerAtLeast(input.payloadHistoryChars),
    memoryChars: integerAtLeast(input.memoryChars),
    inputTokens: integerAtLeast(input.inputTokens),
    outputTokens: integerAtLeast(input.outputTokens),
    totalTokens: integerAtLeast(input.totalTokens),
    latencyMs: integerAtLeast(input.latencyMs),
  });
}

export function buildFlyIaMemoryDashboardResult(input: {
  activeSessions: unknown;
  metrics?: {
    requests?: unknown;
    unanswered?: unknown;
    averageLatencyMs?: unknown;
    averageTokens?: unknown;
    averageContextChars?: unknown;
    averageSavedChars?: unknown;
  };
}) {
  const metrics = input.metrics ?? {};
  return {
    activeSessions: Number(input.activeSessions ?? 0),
    retentionHours: FLY_IA_MEMORY_TTL_MS / (60 * 60 * 1000),
    metrics: {
      requests: Number(metrics.requests ?? 0),
      unanswered: Number(metrics.unanswered ?? 0),
      averageLatencyMs: Math.round(Number(metrics.averageLatencyMs ?? 0)),
      averageTokens: Math.round(Number(metrics.averageTokens ?? 0)),
      averageContextChars: Math.round(Number(metrics.averageContextChars ?? 0)),
      averageSavedChars: Math.round(Number(metrics.averageSavedChars ?? 0)),
    },
  };
}

export async function getFlyIaMemoryDashboard(now = new Date()) {
  const db = await getDb();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (!db) {
    return buildFlyIaMemoryDashboardResult({ activeSessions: 0 });
  }

  const [sessionRows, metricRows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(flyIaSessionMemories).where(gt(flyIaSessionMemories.expiresAt, now)),
    db.select({
      requests: sql<number>`COUNT(*)`,
      unanswered: sql<number>`SUM(CASE WHEN ${flyIaContextMetrics.outcome} IN ('provider_error', 'budget_blocked') THEN 1 ELSE 0 END)`,
      averageLatencyMs: sql<number>`AVG(${flyIaContextMetrics.latencyMs})`,
      averageTokens: sql<number>`AVG(${flyIaContextMetrics.totalTokens})`,
      averageContextChars: sql<number>`AVG(${flyIaContextMetrics.contextChars})`,
      averageSavedChars: sql<number>`AVG(GREATEST(${flyIaContextMetrics.historyChars} - ${flyIaContextMetrics.payloadHistoryChars}, 0))`,
    }).from(flyIaContextMetrics).where(gt(flyIaContextMetrics.createdAt, since)),
  ]);
  return buildFlyIaMemoryDashboardResult({
    activeSessions: sessionRows[0]?.count,
    metrics: metricRows[0],
  });
}
