import type { Request, Response } from "express";
import { isScheduledRequest } from "./_core/scheduledAuth";
import { sendShareByEmailNotification } from "./_core/emailNotification";
import { getTicketNotificationEmails } from "./db";
import {
  getOperationalOverview,
  getOperationalReportScheduleByTaskUid,
  markOperationalReportSent,
} from "./operationalDb";
import { buildOperationalExecutiveReportEmail } from "./operationalReport";

/** Executa o envio mensal pelo Heartbeat; é idempotente por taskUid e não usa o corpo da requisição. */
export async function runScheduledOperationalReport(req: Request, res: Response) {
  try {
    if (!isScheduledRequest(req)) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    const taskUid = String(req.body?.taskUid ?? "").trim();
    if (!taskUid) {
      res.status(400).json({ error: "taskUid-required" });
      return;
    }
    const schedule = await getOperationalReportScheduleByTaskUid(taskUid);
    if (!schedule || !schedule.enabled) {
      res.json({ ok: true, skipped: "disabled-or-orphan" });
      return;
    }

    const [overview, recipients] = await Promise.all([
      getOperationalOverview(schedule.year),
      getTicketNotificationEmails(),
    ]);
    if (!recipients.length) {
      res.json({ ok: true, skipped: "no-active-recipients" });
      return;
    }

    const sent = await sendShareByEmailNotification(
      recipients.map(recipient => recipient.email),
      `Relatório executivo de viagens · ${schedule.year}`,
      buildOperationalExecutiveReportEmail(schedule.year, overview)
    );
    if (!sent) throw new Error("Falha ao enviar relatório executivo recorrente");
    await markOperationalReportSent(taskUid);
    res.json({ ok: true, sentTo: recipients.length, year: schedule.year });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[OperationalReportSchedule]", error);
    res.status(500).json({
      error: message,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
