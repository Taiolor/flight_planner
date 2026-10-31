import { and, eq } from "drizzle-orm";
import {
  mileagePurchases,
  type InsertMileagePurchase,
  type MileagePurchase,
} from "../drizzle/schema";
import { getDb } from "./db";

export type MileagePurchaseInput = Omit<
  InsertMileagePurchase,
  "id" | "createdAt" | "updatedAt"
>;

export interface MileagePurchaseSummary {
  purchaseCount: number;
  totalMiles: number;
  totalPaidCents: number;
  byProgram: Record<string, { miles: number; paidCents: number; count: number }>;
}

export async function getMileagePurchasesByYear(year: number): Promise<MileagePurchase[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(mileagePurchases)
    .where(eq(mileagePurchases.year, year))
    .orderBy(mileagePurchases.purchaseDate, mileagePurchases.id);
}

export async function getMileagePurchasesSummaryByYear(
  year: number,
  rows?: MileagePurchase[]
): Promise<MileagePurchaseSummary> {
  const purchases = rows ?? (await getMileagePurchasesByYear(year));
  const byProgram: MileagePurchaseSummary["byProgram"] = {};

  for (const purchase of purchases) {
    const program = purchase.program.trim();
    const current = byProgram[program] ?? { miles: 0, paidCents: 0, count: 0 };
    current.miles += purchase.miles;
    current.paidCents += purchase.paidPriceCents;
    current.count += 1;
    byProgram[program] = current;
  }

  return {
    purchaseCount: purchases.length,
    totalMiles: purchases.reduce((sum, purchase) => sum + purchase.miles, 0),
    totalPaidCents: purchases.reduce(
      (sum, purchase) => sum + purchase.paidPriceCents,
      0
    ),
    byProgram,
  };
}

export async function createMileagePurchase(
  input: MileagePurchaseInput
): Promise<MileagePurchase | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(mileagePurchases).values(input);
  const rows = await db
    .select()
    .from(mileagePurchases)
    .where(eq(mileagePurchases.id, Number(result[0].insertId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateMileagePurchase(
  id: number,
  year: number,
  patch: Partial<MileagePurchaseInput>
): Promise<MileagePurchase | null> {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(mileagePurchases)
    .set(patch)
    .where(and(eq(mileagePurchases.id, id), eq(mileagePurchases.year, year)));
  const rows = await db
    .select()
    .from(mileagePurchases)
    .where(and(eq(mileagePurchases.id, id), eq(mileagePurchases.year, year)))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteMileagePurchase(id: number, year: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(mileagePurchases)
    .where(and(eq(mileagePurchases.id, id), eq(mileagePurchases.year, year)));
  return Number(result[0].affectedRows) > 0;
}
