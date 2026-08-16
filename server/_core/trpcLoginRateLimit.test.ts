import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  createTrpcLoginRateLimiter,
  isFlightLoginRequest,
} from "./trpcLoginRateLimit";

describe("trpcLoginRateLimit", () => {
  it("identifica exclusivamente o procedimento de login interno", () => {
    expect(isFlightLoginRequest("/flightAuth.login")).toBe(true);
    expect(isFlightLoginRequest("/flights.getWeeks")).toBe(false);
  });

  it("aplica o limitador uma única vez para login", () => {
    const limiter = vi.fn();
    const next = vi.fn();
    const middleware = createTrpcLoginRateLimiter(limiter);

    middleware(
      { path: "/flightAuth.login" } as Request,
      {} as Response,
      next as NextFunction
    );

    expect(limiter).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("não limita procedimentos tRPC não relacionados à autenticação", () => {
    const limiter = vi.fn();
    const next = vi.fn();
    const middleware = createTrpcLoginRateLimiter(limiter);

    middleware(
      { path: "/flights.getWeeks" } as Request,
      {} as Response,
      next as NextFunction
    );

    expect(limiter).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
