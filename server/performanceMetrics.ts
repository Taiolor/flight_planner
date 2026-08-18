import { and, gte, sql } from "drizzle-orm";
import { performanceMetrics, type InsertPerformanceMetric } from "../drizzle/schema";
import { getDb } from "./db";

export async function recordPerformanceMetrics(
  samples: InsertPerformanceMetric[]
): Promise<void> {
  const db = await getDb();
  if (!db || samples.length === 0) return;
  await db.insert(performanceMetrics).values(samples);
}

export async function getPerformanceMetricSummary(hours: number) {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db
    .select({
      metric: performanceMetrics.metric,
      count: sql<number>`count(*)`,
      average: sql<number>`round(avg(${performanceMetrics.value}))`,
      minimum: sql<number>`min(${performanceMetrics.value})`,
      maximum: sql<number>`max(${performanceMetrics.value})`,
    })
    .from(performanceMetrics)
    .where(gte(performanceMetrics.recordedAt, since))
    .groupBy(performanceMetrics.metric);
}
