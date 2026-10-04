import type { Request } from "express";
import crypto from "node:crypto";
import { ENV } from "./env";

/**
 * Authenticates callbacks from an external scheduler without using external provider authentication.
 * The scheduler must send Authorization: Bearer <SCHEDULE_SECRET>.
 */
export function isScheduledRequest(req: Request): boolean {
  const configuredSecret = ENV.scheduleSecret;
  const authorization = req.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (!configuredSecret || scheme?.toLowerCase() !== "bearer" || !token) {
    return false;
  }

  const expected = Buffer.from(configuredSecret, "utf8");
  const received = Buffer.from(token, "utf8");
  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}
