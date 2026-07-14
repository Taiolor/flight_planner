import { TRPCError } from "@trpc/server";
import { parse } from "cookie";
import { validateAuthSession } from "./db";
import { publicProcedure } from "./_core/trpc";

export const SESSION_COOKIE = "flight_session";

export async function getSessionFromCookie(
  req: any
): Promise<{ email: string } | null> {
  const cookieHeader = req.headers?.cookie ?? "";
  const cookies = parse(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return null;
  return validateAuthSession(sessionToken);
}

export const flightProtectedProcedure = publicProcedure.use(
  async ({ ctx, next }) => {
    const session = await getSessionFromCookie(ctx.req);
    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Faça login para acessar.",
      });
    }
    return next({
      ctx: {
        ...ctx,
        flightSession: session,
      },
    });
  }
);
