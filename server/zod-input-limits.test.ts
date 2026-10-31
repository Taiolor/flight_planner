import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { cookie: "" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

describe("Zod input length limits", () => {
  it("rejects notifyOwner content above 5000 characters", async () => {
    const caller = appRouter.createCaller(
      createContext({ role: "admin" } as User)
    );

    await expect(
      caller.system.notifyOwner({
        title: "Security test",
        content: "x".repeat(5001),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects public push endpoint values above 1024 characters", async () => {
    const caller = appRouter.createCaller(createContext(null));

    await expect(
      caller.push.unsubscribe({ endpoint: "x".repeat(1025) })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(
      caller.push.checkSubscription({ endpoint: "x".repeat(1025) })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
