import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  geminiBudgetAlerts,
  geminiBudgetSettings,
  geminiMonthlyUsage,
  geminiUsageEvents,
  type GeminiBudgetSettings,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sendGeminiBudgetAlertEmail } from "./_core/emailNotification";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

export type GeminiTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GeminiBudgetSnapshot = {
  yearMonth: string;
  requestsCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
  monthlyBudgetCents: number;
  usagePercent: number;
  isAtLimit: boolean;
  settings: GeminiBudgetSettings;
};

export class GeminiBudgetExceededError extends Error {
  constructor() {
    super(
      "O limite interno de orçamento do Fly.IA foi alcançado. Aguarde a revisão do administrador."
    );
  }
}

const DEFAULT_SETTINGS: GeminiBudgetSettings = {
  id: 1,
  monthlyBudgetCents: 10_000,
  inputCostCentsPerMillion: 75,
  outputCostCentsPerMillion: 375,
  warningThresholdPercent: 70,
  criticalThresholdPercent: 90,
  limitThresholdPercent: 100,
  emailAlertsEnabled: 1,
  pushAlertsEnabled: 1,
  updatedAt: new Date(),
};

function integerAtLeast(value: unknown, minimum = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.round(parsed)) : minimum;
}

export function getGeminiBudgetMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find(part => part.type === "year")?.value ?? String(now.getFullYear());
  const month = parts.find(part => part.type === "month")?.value ?? String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function calculateGeminiCostCents(
  usage: GeminiTokenUsage,
  settings: Pick<GeminiBudgetSettings, "inputCostCentsPerMillion" | "outputCostCentsPerMillion">
): number {
  const inputCost = (integerAtLeast(usage.inputTokens) * settings.inputCostCentsPerMillion) / 1_000_000;
  const outputCost = (integerAtLeast(usage.outputTokens) * settings.outputCostCentsPerMillion) / 1_000_000;
  return Math.max(0, Math.round(inputCost + outputCost));
}

function buildSnapshot(
  yearMonth: string,
  settings: GeminiBudgetSettings,
  usage: Omit<GeminiBudgetSnapshot, "yearMonth" | "monthlyBudgetCents" | "usagePercent" | "isAtLimit" | "settings">
): GeminiBudgetSnapshot {
  const monthlyBudgetCents = integerAtLeast(settings.monthlyBudgetCents);
  const usagePercent = monthlyBudgetCents > 0
    ? Number(((usage.estimatedCostCents / monthlyBudgetCents) * 100).toFixed(2))
    : 0;
  const limitCost = Math.ceil((monthlyBudgetCents * settings.limitThresholdPercent) / 100);

  return {
    yearMonth,
    ...usage,
    monthlyBudgetCents,
    usagePercent,
    isAtLimit: monthlyBudgetCents > 0 && usage.estimatedCostCents >= limitCost,
    settings,
  };
}

export async function getGeminiBudgetSettings(): Promise<GeminiBudgetSettings> {
  const db = await getDb();
  if (!db) return DEFAULT_SETTINGS;

  const rows = await db.select().from(geminiBudgetSettings).where(eq(geminiBudgetSettings.id, 1)).limit(1);
  if (rows[0]) return rows[0];

  await db.insert(geminiBudgetSettings).values(DEFAULT_SETTINGS).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });
  const created = await db.select().from(geminiBudgetSettings).where(eq(geminiBudgetSettings.id, 1)).limit(1);
  return created[0] ?? DEFAULT_SETTINGS;
}

export async function updateGeminiBudgetSettings(
  changes: Pick<
    GeminiBudgetSettings,
    | "monthlyBudgetCents"
    | "inputCostCentsPerMillion"
    | "outputCostCentsPerMillion"
    | "warningThresholdPercent"
    | "criticalThresholdPercent"
    | "limitThresholdPercent"
    | "emailAlertsEnabled"
    | "pushAlertsEnabled"
  >
): Promise<GeminiBudgetSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(geminiBudgetSettings).values({ id: 1, ...changes }).onDuplicateKeyUpdate({
    set: { ...changes, updatedAt: new Date() },
  });
  return getGeminiBudgetSettings();
}

async function getMonthlyUsage(yearMonth: string) {
  const db = await getDb();
  if (!db) {
    return {
      requestsCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostCents: 0,
    };
  }
  const rows = await db.select().from(geminiMonthlyUsage).where(eq(geminiMonthlyUsage.yearMonth, yearMonth)).limit(1);
  return rows[0] ?? {
    requestsCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostCents: 0,
  };
}

export async function getGeminiBudgetSnapshot(
  yearMonth = getGeminiBudgetMonth()
): Promise<GeminiBudgetSnapshot> {
  const [settings, usage] = await Promise.all([getGeminiBudgetSettings(), getMonthlyUsage(yearMonth)]);
  return buildSnapshot(yearMonth, settings, usage);
}

function thresholdEntries(settings: GeminiBudgetSettings) {
  return [...new Set([
    settings.warningThresholdPercent,
    settings.criticalThresholdPercent,
    settings.limitThresholdPercent,
  ])]
    .filter(threshold => threshold > 0 && threshold <= 200)
    .sort((left, right) => left - right);
}

export function getReachedGeminiBudgetThresholds(
  usagePercent: number,
  settings: GeminiBudgetSettings
) {
  return thresholdEntries(settings).filter(thresholdPercent => usagePercent >= thresholdPercent);
}

function formatBrl(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

async function deliverBudgetAlert(
  snapshot: GeminiBudgetSnapshot,
  thresholdPercent: number
) {
  const db = await getDb();
  if (!db) return;
  const deliveryKey = `${snapshot.yearMonth}:${thresholdPercent}`;
  const insert = await db.execute(sql`
    INSERT IGNORE INTO gemini_budget_alerts
      (yearMonth, thresholdPercent, estimatedCostCents, deliveryKey, status)
    VALUES
      (${snapshot.yearMonth}, ${thresholdPercent}, ${snapshot.estimatedCostCents}, ${deliveryKey}, 'processing')
  `);
  const header = (Array.isArray(insert) ? insert[0] : insert) as { affectedRows?: number };
  if (Number(header.affectedRows ?? 0) === 0) return;

  const title = `Fly.IA: ${thresholdPercent}% do orçamento atingido`;
  const body = `O consumo estimado de ${snapshot.yearMonth} é ${formatBrl(snapshot.estimatedCostCents)} de ${formatBrl(snapshot.monthlyBudgetCents)} (${snapshot.usagePercent}%).`;
  let emailSent = false;
  let pushSent = false;

  if (snapshot.settings.emailAlertsEnabled === 1 && ENV.authEmail) {
    emailSent = await sendGeminiBudgetAlertEmail(ENV.authEmail, {
      thresholdPercent,
      yearMonth: snapshot.yearMonth,
      estimatedCostCents: snapshot.estimatedCostCents,
      monthlyBudgetCents: snapshot.monthlyBudgetCents,
      usagePercent: snapshot.usagePercent,
    });
  }

  if (snapshot.settings.pushAlertsEnabled === 1) {
    pushSent = await notifyOwner({ title, content: body }).catch(() => false);
  }

  await db.update(geminiBudgetAlerts).set({
    emailSent: emailSent ? 1 : 0,
    pushSent: pushSent ? 1 : 0,
    status: emailSent || pushSent ? "success" : "failed",
  }).where(eq(geminiBudgetAlerts.deliveryKey, deliveryKey));
}

async function notifyReachedThresholds(snapshot: GeminiBudgetSnapshot) {
  for (const thresholdPercent of getReachedGeminiBudgetThresholds(
    snapshot.usagePercent,
    snapshot.settings
  )) {
    await deliverBudgetAlert(snapshot, thresholdPercent);
  }
}

export async function recordGeminiUsage(
  model: string,
  usage: GeminiTokenUsage,
  yearMonth = getGeminiBudgetMonth()
): Promise<GeminiBudgetSnapshot> {
  const db = await getDb();
  if (!db) return getGeminiBudgetSnapshot(yearMonth);

  const settings = await getGeminiBudgetSettings();
  const normalizedUsage: GeminiTokenUsage = {
    inputTokens: integerAtLeast(usage.inputTokens),
    outputTokens: integerAtLeast(usage.outputTokens),
    totalTokens: integerAtLeast(usage.totalTokens),
  };
  const estimatedCostCents = calculateGeminiCostCents(normalizedUsage, settings);

  await db.insert(geminiUsageEvents).values({
    yearMonth,
    model: model.slice(0, 80),
    ...normalizedUsage,
    estimatedCostCents,
  });
  await db.execute(sql`
    INSERT INTO gemini_monthly_usage
      (yearMonth, requestsCount, inputTokens, outputTokens, totalTokens, estimatedCostCents)
    VALUES
      (${yearMonth}, 1, ${normalizedUsage.inputTokens}, ${normalizedUsage.outputTokens}, ${normalizedUsage.totalTokens}, ${estimatedCostCents})
    ON DUPLICATE KEY UPDATE
      requestsCount = requestsCount + 1,
      inputTokens = inputTokens + VALUES(inputTokens),
      outputTokens = outputTokens + VALUES(outputTokens),
      totalTokens = totalTokens + VALUES(totalTokens),
      estimatedCostCents = estimatedCostCents + VALUES(estimatedCostCents)
  `);

  const snapshot = await getGeminiBudgetSnapshot(yearMonth);
  await notifyReachedThresholds(snapshot);
  return snapshot;
}

function previousMonths(count: number, now = new Date()) {
  const dates = Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return getGeminiBudgetMonth(date);
  });
  return dates.reverse();
}

export async function getGeminiBudgetDashboard() {
  const [snapshot, settings] = await Promise.all([getGeminiBudgetSnapshot(), getGeminiBudgetSettings()]);
  const db = await getDb();
  const months = previousMonths(6);
  if (!db) return { snapshot, settings, history: months.map(yearMonth => ({ yearMonth, requestsCount: 0, estimatedCostCents: 0, totalTokens: 0 })), alerts: [] };

  const [historyRows, alerts] = await Promise.all([
    db.select().from(geminiMonthlyUsage).where(inArray(geminiMonthlyUsage.yearMonth, months)).orderBy(geminiMonthlyUsage.yearMonth),
    db.select().from(geminiBudgetAlerts).orderBy(desc(geminiBudgetAlerts.notifiedAt)).limit(20),
  ]);
  const historyByMonth = new Map(historyRows.map(row => [row.yearMonth, row]));
  return {
    snapshot,
    settings,
    history: months.map(yearMonth => historyByMonth.get(yearMonth) ?? {
      yearMonth,
      requestsCount: 0,
      estimatedCostCents: 0,
      totalTokens: 0,
    }),
    alerts,
  };
}
