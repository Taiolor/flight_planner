import { and, eq, inArray } from "drizzle-orm";
import {
  flightMemories,
  flightMemoryMedia,
  flightMemorySummaries,
  type FlightMemory,
  type FlightMemoryMedia,
  type FlightMemorySummary,
} from "../drizzle/schema";
import { getDb } from "./db";

export type MemoryWithMedia = FlightMemory & {
  media: FlightMemoryMedia[];
};

export async function getFlightMemorySummariesForYear(
  year: number
): Promise<FlightMemorySummary[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(flightMemorySummaries)
    .where(eq(flightMemorySummaries.year, year));
}

export async function upsertFlightMemorySummary(input: {
  year: number;
  weekNumber: number;
  summary: string;
  model: string;
  sourceFingerprint: string;
}): Promise<FlightMemorySummary | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(flightMemorySummaries)
    .where(
      and(
        eq(flightMemorySummaries.year, input.year),
        eq(flightMemorySummaries.weekNumber, input.weekNumber)
      )
    )
    .limit(1);

  if (existing[0]) {
    const generatedAt = new Date();
    await db
      .update(flightMemorySummaries)
      .set({
        summary: input.summary,
        model: input.model,
        sourceFingerprint: input.sourceFingerprint,
        generatedAt,
      })
      .where(eq(flightMemorySummaries.id, existing[0].id));
    return { ...existing[0], ...input, generatedAt };
  }

  const result = await db.insert(flightMemorySummaries).values(input);
  const inserted = await db
    .select()
    .from(flightMemorySummaries)
    .where(eq(flightMemorySummaries.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] ?? null;
}

export async function getMemoriesForYear(
  year: number
): Promise<MemoryWithMedia[]> {
  const db = await getDb();
  if (!db) return [];

  const memories = await db
    .select()
    .from(flightMemories)
    .where(eq(flightMemories.year, year));

  if (memories.length === 0) return [];

  const media = await db
    .select()
    .from(flightMemoryMedia)
    .where(inArray(flightMemoryMedia.memoryId, memories.map(memory => memory.id)));

  const mediaByMemory = new Map<number, FlightMemoryMedia[]>();
  for (const item of media) {
    const current = mediaByMemory.get(item.memoryId) ?? [];
    current.push(item);
    mediaByMemory.set(item.memoryId, current);
  }

  return memories.map(memory => ({
    ...memory,
    media: mediaByMemory.get(memory.id) ?? [],
  }));
}

export async function upsertFlightMemory(input: {
  year: number;
  weekNumber: number;
  title?: string | null;
  note?: string | null;
}): Promise<FlightMemory | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(flightMemories)
    .where(
      and(
        eq(flightMemories.year, input.year),
        eq(flightMemories.weekNumber, input.weekNumber)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(flightMemories)
      .set({ title: input.title ?? null, note: input.note ?? null })
      .where(eq(flightMemories.id, existing[0].id));
    return { ...existing[0], title: input.title ?? null, note: input.note ?? null };
  }

  const result = await db.insert(flightMemories).values({
    year: input.year,
    weekNumber: input.weekNumber,
    title: input.title ?? null,
    note: input.note ?? null,
  });
  const inserted = await db
    .select()
    .from(flightMemories)
    .where(eq(flightMemories.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] ?? null;
}

export async function addFlightMemoryMedia(input: {
  memoryId: number;
  storageKey: string;
  storageUrl: string;
  mediaType: "image" | "video";
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  caption?: string | null;
}): Promise<FlightMemoryMedia | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(flightMemoryMedia).values(input);
  const inserted = await db
    .select()
    .from(flightMemoryMedia)
    .where(eq(flightMemoryMedia.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] ?? null;
}

export async function deleteFlightMemoryMedia(input: {
  year: number;
  mediaId: number;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const ownership = await db
    .select({ mediaId: flightMemoryMedia.id })
    .from(flightMemoryMedia)
    .innerJoin(
      flightMemories,
      eq(flightMemoryMedia.memoryId, flightMemories.id)
    )
    .where(
      and(
        eq(flightMemoryMedia.id, input.mediaId),
        eq(flightMemories.year, input.year)
      )
    )
    .limit(1);

  if (!ownership[0]) return false;
  await db.delete(flightMemoryMedia).where(eq(flightMemoryMedia.id, input.mediaId));
  return true;
}
