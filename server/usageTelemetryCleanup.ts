import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { deleteExpiredUsageTelemetry } from "./usageTelemetry";

/** Callback idempotente da plataforma para retenção limitada dos eventos de uso. */
export async function runUsageTelemetryCleanup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    const deleted = await deleteExpiredUsageTelemetry(30);
    res.json({ ok: true, deleted, taskUid: user.taskUid });
  } catch (error) {
    console.error("[Usage telemetry] Falha na limpeza de retenção:", error);
    res.status(500).json({
      error: "usage-telemetry-cleanup-failed",
      timestamp: new Date().toISOString(),
    });
  }
}
