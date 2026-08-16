import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";

type TrpcErrorShape = {
  message: string;
  data: {
    stack?: string;
    [key: string]: unknown;
  };
};

export function sanitizeTrpcErrorShape<T extends TrpcErrorShape>(
  shape: T,
  errorCode: string,
  isProduction = ENV.isProduction
): T {
  const { stack: _stack, ...dataWithoutStack } = shape.data;
  const shouldMaskMessage =
    isProduction && errorCode === "INTERNAL_SERVER_ERROR";

  return {
    ...shape,
    message: shouldMaskMessage ? "Internal server error" : shape.message,
    data: isProduction ? dataWithoutStack : shape.data,
  } as T;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return sanitizeTrpcErrorShape(shape, error.code);
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
