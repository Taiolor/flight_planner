import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getSessionFromCookie } from "../flightAuthMiddleware";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const session = await getSessionFromCookie(opts.req);
    if (session) {
      user = {
        id: 0,
        openId: `flight:${session.email}`,
        name: session.email,
        email: session.email,
        loginMethod: "password",
        role: session.role,
        createdAt: new Date(0),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
