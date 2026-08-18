import { and, eq } from "drizzle-orm";
import { additionalFlights, type AdditionalFlight } from "../drizzle/schema";
import { getDb } from "./db";

export type AdditionalFlightInput = Omit<
  AdditionalFlight,
  "id" | "createdAt" | "updatedAt"
>;

export async function getAdditionalFlightsForYear(year: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(additionalFlights)
    .where(eq(additionalFlights.year, year));
}

export async function createAdditionalFlight(
  input: Omit<AdditionalFlightInput, "id">
): Promise<AdditionalFlight | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(additionalFlights).values(input);
  const inserted = await db
    .select()
    .from(additionalFlights)
    .where(eq(additionalFlights.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] ?? null;
}

export async function updateAdditionalFlight(
  id: number,
  year: number,
  patch: Partial<AdditionalFlightInput>
): Promise<AdditionalFlight | null> {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(additionalFlights)
    .set(patch)
    .where(and(eq(additionalFlights.id, id), eq(additionalFlights.year, year)));
  const updated = await db
    .select()
    .from(additionalFlights)
    .where(and(eq(additionalFlights.id, id), eq(additionalFlights.year, year)))
    .limit(1);
  return updated[0] ?? null;
}

export async function deleteAdditionalFlight(id: number, year: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .delete(additionalFlights)
    .where(and(eq(additionalFlights.id, id), eq(additionalFlights.year, year)));
  return Number(result[0].affectedRows) > 0;
}
