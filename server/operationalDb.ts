import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  flightQuotes,
  flightWeeks,
  operationalCategoryGoals,
  operationalFlightAttachments,
  operationalReportSchedules,
  operationalTravelChecklists,
  operationalTravelCredits,
} from "../drizzle/schema";
import { getDb } from "./db";
import { buildOperationalInsights } from "./operationalInsights";

export type OperationalChecklistCategory =
  | "checkin"
  | "bagagem"
  | "assento"
  | "traslado"
  | "hospedagem"
  | "documentos"
  | "outro";

export type OperationalCreditType = "credito" | "voucher" | "reembolso";
export type OperationalCreditStatus = "ativo" | "usado" | "expirado";
export type OperationalGoalCategory = "viagens" | "orcamento" | "milhas" | "creditos";

const CHECKLIST_TEMPLATE: Array<{ category: OperationalChecklistCategory; label: string }> = [
  { category: "checkin", label: "Realizar check-in" },
  { category: "documentos", label: "Conferir documento e localizador" },
  { category: "bagagem", label: "Organizar bagagem" },
  { category: "assento", label: "Confirmar assento" },
  { category: "traslado", label: "Confirmar traslado até o aeroporto" },
];

export async function getOperationalOverview(year: number) {
  const db = await getDb();
  if (!db) {
    return {
      weeks: [], checklists: [], credits: [], goals: [], attachments: [], decisions: [],
      totals: { activeCreditsCents: 0, incompleteChecklistItems: 0, pendingPurchases: 0 },
    };
  }

  const [weeks, quotes, checklists, credits, goals, attachments] = await Promise.all([
    db.select().from(flightWeeks).where(eq(flightWeeks.year, year)),
    db.select().from(flightQuotes).where(eq(flightQuotes.year, year)).orderBy(desc(flightQuotes.quotedAt)),
    db.select().from(operationalTravelChecklists).where(eq(operationalTravelChecklists.year, year)).orderBy(desc(operationalTravelChecklists.updatedAt)),
    db.select().from(operationalTravelCredits).where(eq(operationalTravelCredits.year, year)).orderBy(desc(operationalTravelCredits.updatedAt)),
    db.select().from(operationalCategoryGoals).where(eq(operationalCategoryGoals.year, year)),
    db.select().from(operationalFlightAttachments).where(eq(operationalFlightAttachments.year, year)).orderBy(desc(operationalFlightAttachments.createdAt)),
  ]);

  const incompleteChecklistCount = new Map<number, number>();
  for (const item of checklists) {
    if (!item.completed) {
      incompleteChecklistCount.set(item.weekNumber, (incompleteChecklistCount.get(item.weekNumber) ?? 0) + 1);
    }
  }

  const decisions = buildOperationalInsights(weeks, quotes, credits, incompleteChecklistCount);
  return {
    weeks,
    checklists,
    credits,
    goals,
    attachments,
    decisions,
    totals: {
      activeCreditsCents: credits
        .filter(credit => credit.status === "ativo")
        .reduce((total, credit) => total + credit.availableCents, 0),
      incompleteChecklistItems: [...incompleteChecklistCount.values()].reduce((total, count) => total + count, 0),
      pendingPurchases: weeks.filter(week => !week.isDeleted && !week.isTicketIssued).length,
    },
  };
}

export async function ensureOperationalChecklistTemplate(year: number, weekNumber: number) {
  const db = await getDb();
  if (!db) return [];
  const existing = await db
    .select({ label: operationalTravelChecklists.label })
    .from(operationalTravelChecklists)
    .where(and(eq(operationalTravelChecklists.year, year), eq(operationalTravelChecklists.weekNumber, weekNumber)));
  const labels = new Set(existing.map(item => item.label));
  const pending = CHECKLIST_TEMPLATE.filter(item => !labels.has(item.label));
  if (pending.length) {
    await db.insert(operationalTravelChecklists).values(
      pending.map(item => ({ ...item, year, weekNumber }))
    );
  }
  return db
    .select()
    .from(operationalTravelChecklists)
    .where(and(eq(operationalTravelChecklists.year, year), eq(operationalTravelChecklists.weekNumber, weekNumber)))
    .orderBy(desc(operationalTravelChecklists.updatedAt));
}

export async function addOperationalChecklistItem(input: {
  year: number;
  weekNumber: number;
  category: OperationalChecklistCategory;
  label: string;
  dueAt?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(operationalTravelChecklists).values({ ...input, completed: 0 });
  return result[0]?.insertId ?? null;
}

export async function setOperationalChecklistCompletion(input: { id: number; year: number; completed: boolean }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .update(operationalTravelChecklists)
    .set({ completed: input.completed ? 1 : 0, completedAt: input.completed ? new Date() : null })
    .where(and(eq(operationalTravelChecklists.id, input.id), eq(operationalTravelChecklists.year, input.year)));
  return result[0]?.affectedRows === 1;
}

export async function deleteOperationalChecklistItem(id: number, year: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(operationalTravelChecklists).where(and(eq(operationalTravelChecklists.id, id), eq(operationalTravelChecklists.year, year)));
  return result[0]?.affectedRows === 1;
}

export async function upsertOperationalCredit(input: {
  id?: number;
  year: number;
  airline: string;
  creditType: OperationalCreditType;
  code?: string;
  originalCents: number;
  availableCents: number;
  expiresAt?: Date;
  status: OperationalCreditStatus;
  linkedWeekNumber?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const { id, ...values } = input;
  if (id) {
    await db.update(operationalTravelCredits).set(values).where(and(eq(operationalTravelCredits.id, id), eq(operationalTravelCredits.year, input.year)));
    return id;
  }
  const result = await db.insert(operationalTravelCredits).values(values);
  return result[0]?.insertId ?? null;
}

export async function deleteOperationalCredit(id: number, year: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(operationalTravelCredits).where(and(eq(operationalTravelCredits.id, id), eq(operationalTravelCredits.year, year)));
  return result[0]?.affectedRows === 1;
}

export async function upsertOperationalGoal(input: { year: number; category: OperationalGoalCategory; targetValue: number }) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(operationalCategoryGoals).values(input).onDuplicateKeyUpdate({ set: { targetValue: input.targetValue } });
  return true;
}

export async function addOperationalAttachment(input: {
  year: number;
  weekNumber: number;
  attachmentType: "comprovante" | "cartao_embarque" | "recibo" | "outro";
  storageKey: string;
  storageUrl: string;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  description?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(operationalFlightAttachments).values(input);
  return result[0]?.insertId ?? null;
}

export async function deleteOperationalAttachment(id: number, year: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(operationalFlightAttachments).where(and(eq(operationalFlightAttachments.id, id), eq(operationalFlightAttachments.year, year)));
  return result[0]?.affectedRows === 1;
}

export async function getOperationalReportSchedule() {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(operationalReportSchedules).where(eq(operationalReportSchedules.id, 1)).limit(1))[0] ?? null;
}

export async function saveOperationalReportSchedule(input: {
  year: number;
  enabled: boolean;
  cronExpression: string;
  scheduleCronTaskUid?: string | null;
}) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(operationalReportSchedules).values({ id: 1, ...input, enabled: input.enabled ? 1 : 0 }).onDuplicateKeyUpdate({
    set: {
      year: input.year,
      enabled: input.enabled ? 1 : 0,
      cronExpression: input.cronExpression,
      scheduleCronTaskUid: input.scheduleCronTaskUid,
    },
  });
  return true;
}

export async function getOperationalReportScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(operationalReportSchedules).where(eq(operationalReportSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0] ?? null;
}

export async function markOperationalReportSent(taskUid: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(operationalReportSchedules).set({ lastSentAt: new Date() }).where(eq(operationalReportSchedules.scheduleCronTaskUid, taskUid));
  return result[0]?.affectedRows === 1;
}
