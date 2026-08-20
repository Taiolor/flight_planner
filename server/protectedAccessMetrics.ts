import { desc, sql } from "drizzle-orm";
import { protectedAccessAttempts } from "../drizzle/schema";
import type { ProtectedAccessResource } from "../shared/protectedAccess";
import { getDb } from "./db";

/** Registra apenas a categoria do recurso solicitado, sem identificação pessoal. */
export async function recordProtectedAccessAttempt(resource: ProtectedAccessResource) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(protectedAccessAttempts).values({ resource });
  return true;
}

export async function getProtectedAccessAttemptSummary(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      resource: protectedAccessAttempts.resource,
      count: sql<number>`count(*)`,
    })
    .from(protectedAccessAttempts)
    .groupBy(protectedAccessAttempts.resource)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}
