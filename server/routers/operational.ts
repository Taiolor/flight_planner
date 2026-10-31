import { router } from "../_core/trpc";
import { flightProtectedProcedure } from "../flightAuthMiddleware";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import {
  addOperationalChecklistItem,
  deleteOperationalAttachment,
  deleteOperationalChecklistItem,
  deleteOperationalCredit,
  ensureOperationalChecklistTemplate,
  getOperationalOverview,
  getOperationalReportSchedule,
  setOperationalChecklistCompletion,
  saveOperationalReportSchedule,
  upsertOperationalCredit,
  upsertOperationalGoal,
} from "../operationalDb";
import { getTicketNotificationEmails } from "../db";
import { sendShareByEmailNotification } from "../_core/emailNotification";
import { buildOperationalExecutiveReportEmail } from "../operationalReport";

const planningYearSchema = z.number().int().min(2020).max(2100);
const checklistCategorySchema = z.enum(["checkin", "bagagem", "assento", "traslado", "hospedagem", "documentos", "outro"]);
const creditTypeSchema = z.enum(["credito", "voucher", "reembolso"]);
const creditStatusSchema = z.enum(["ativo", "usado", "expirado"]);

export const operationalRouter = router({
  getOverview: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .query(({ input }) => getOperationalOverview(input.year)),
  getReportSchedule: flightProtectedProcedure.query(() => getOperationalReportSchedule()),
  ensureChecklistTemplate: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema, weekNumber: z.number().int().min(1).max(54) }))
    .mutation(({ input }) => ensureOperationalChecklistTemplate(input.year, input.weekNumber)),
  addChecklistItem: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema, weekNumber: z.number().int().min(1).max(54), category: checklistCategorySchema, label: z.string().trim().min(2).max(160), dueAt: z.date().optional() }))
    .mutation(({ input }) => addOperationalChecklistItem(input)),
  setChecklistCompletion: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: planningYearSchema, completed: z.boolean() }))
    .mutation(({ input }) => setOperationalChecklistCompletion(input)),
  deleteChecklistItem: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: planningYearSchema }))
    .mutation(({ input }) => deleteOperationalChecklistItem(input.id, input.year)),
  upsertCredit: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive().optional(), year: planningYearSchema, airline: z.string().trim().min(2).max(80), creditType: creditTypeSchema, code: z.string().trim().max(120).optional(), originalCents: z.number().int().min(0).max(100_000_000), availableCents: z.number().int().min(0).max(100_000_000), expiresAt: z.date().optional(), status: creditStatusSchema, linkedWeekNumber: z.number().int().min(1).max(54).optional(), notes: z.string().trim().max(500).optional() }))
    .mutation(({ input }) => upsertOperationalCredit(input)),
  deleteCredit: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: planningYearSchema }))
    .mutation(({ input }) => deleteOperationalCredit(input.id, input.year)),
  upsertGoal: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema, category: z.enum(["viagens", "orcamento", "milhas", "creditos"]), targetValue: z.number().int().min(0).max(1_000_000_000) }))
    .mutation(({ input }) => upsertOperationalGoal(input)),
  deleteAttachment: flightProtectedProcedure
    .input(z.object({ id: z.number().int().positive(), year: planningYearSchema }))
    .mutation(({ input }) => deleteOperationalAttachment(input.id, input.year)),
  sendExecutiveReport: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema }))
    .mutation(async ({ input }) => {
      const [overview, recipients] = await Promise.all([
        getOperationalOverview(input.year),
        getTicketNotificationEmails(),
      ]);
      if (!recipients.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cadastre ao menos um destinatário ativo antes de enviar o relatório." });
      }
      const sent = await sendShareByEmailNotification(
        recipients.map(recipient => recipient.email),
        `Relatório executivo de viagens · ${input.year}`,
        buildOperationalExecutiveReportEmail(input.year, overview)
      );
      if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível enviar o relatório executivo." });
      return { sent: true, recipientCount: recipients.length };
    }),
  configureReportSchedule: flightProtectedProcedure
    .input(z.object({ year: planningYearSchema, enabled: z.boolean(), cronExpression: z.string().regex(/^\d+ \d+ \d+ \d+ \d+ \d+$/, "Use o formato cron de seis campos.") }))
    .mutation(async ({ input, ctx }) => {
      const current = await getOperationalReportSchedule();
      let taskUid = current?.scheduleCronTaskUid ?? null;
      if (!taskUid && input.enabled) {
        const job = await createHeartbeatJob({
          name: "operational-executive-report",
          cron: input.cronExpression,
          path: "/api/scheduled/operational-executive-report",
          description: "Relatório executivo recorrente de viagens",
        }, "");
        taskUid = job.taskUid;
        await updateHeartbeatJob(taskUid, { payload: { taskUid } }, "");
      } else if (taskUid) {
        await updateHeartbeatJob(taskUid, {
          cron: input.cronExpression,
          enable: input.enabled,
          payload: { taskUid },
        }, "");
      }
      await saveOperationalReportSchedule({ ...input, scheduleCronTaskUid: taskUid });
      return { enabled: input.enabled, taskUid };
    }),
});
