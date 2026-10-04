import type { Request, Response } from "express";
import { isScheduledRequest } from "./_core/scheduledAuth";
import { deleteExpiredUsageTelemetry } from "./usageTelemetry";

/** Callback idempotente da plataforma para retenção limitada dos eventos de uso. */
export async function runUsageTelemetryCleanup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isScheduledRequest(req)) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    const deleted = await deleteExpiredUsageTelemetry(30);
    res.json({ ok: true, deleted });
  } catch (error) {
    console.error("[Usage telemetry] Falha na limpeza de retenção:", error);
    res.status(500).json({
      error: "usage-telemetry-cleanup-failed",
      timestamp: new Date().toISOString(),
    });
  }
}
