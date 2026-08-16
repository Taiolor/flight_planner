import type { NextFunction, Request, RequestHandler, Response } from "express";

const FLIGHT_LOGIN_PROCEDURE = "flightAuth.login";

export function isFlightLoginRequest(pathname: string): boolean {
  return pathname.includes(FLIGHT_LOGIN_PROCEDURE);
}

/**
 * Aplica o limite de autenticação somente ao procedimento de login interno.
 * Este middleware é registrado uma única vez antes do adaptador tRPC.
 */
export function createTrpcLoginRateLimiter(
  authLimiter: RequestHandler
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    if (isFlightLoginRequest(req.path)) {
      authLimiter(req, res, next);
      return;
    }

    next();
  };
}
