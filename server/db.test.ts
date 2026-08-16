import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";

// Mock the drizzle-orm/mysql2 module
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(),
}));

describe("upsertUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "mysql://mock",
      JWT_SECRET: "test-secret",
    };
    vi.clearAllMocks();
    vi.resetModules(); // This will clear the module cache, so _db in db.ts is null for each test
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if db insertion fails due to database rejection", async () => {
    const dbError = new Error("Constraint violation");
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockImplementation(async () => {
        throw dbError;
      }),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { upsertUser } = await import("./db");

    let caughtError;
    try {
      await upsertUser({ openId: "invalid-duplicate-user" });
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBe(dbError);
    expect(console.error).toHaveBeenCalledWith(
      "[Database] Failed to upsert user:",
      dbError
    );
  });

  it("should throw an error if user openId is missing", async () => {
    const { upsertUser } = await import("./db");

    // @ts-expect-error - testing invalid input
    await expect(upsertUser({})).rejects.toThrow(
      "User openId is required for upsert"
    );
  });

  it("should return early and warn if db is not available", async () => {
    const { upsertUser } = await import("./db");

    vi.stubEnv("DATABASE_URL", ""); // db will fail to connect

    await expect(
      upsertUser({ openId: "test-user-123" })
    ).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalledWith(
      "[Database] Cannot upsert user: database not available"
    );
    vi.unstubAllEnvs();
  });

  it("should successfully upsert user", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { upsertUser } = await import("./db");

    await expect(
      upsertUser({ openId: "test-user-123", email: "test@example.com" })
    ).resolves.toBeUndefined();

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "test-user-123",
        email: "test@example.com",
      })
    );
    expect(mockDb.onDuplicateKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ email: "test@example.com" }),
      })
    );
  });

  it("should set lastSignedIn in updateSet if updateSet is otherwise empty", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { upsertUser } = await import("./db");

    await expect(
      upsertUser({ openId: "test-user-123" }) // No other fields provided
    ).resolves.toBeUndefined();

    expect(mockDb.onDuplicateKeyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          lastSignedIn: expect.any(Date),
        }),
      })
    );
  });

  it("should handle full parameters and specific role assignment", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { upsertUser } = await import("./db");

    const date = new Date();
    await expect(
      upsertUser({
        openId: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "google",
        role: "admin",
        lastSignedIn: date,
      })
    ).resolves.toBeUndefined();

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "google",
        role: "admin",
        lastSignedIn: date,
      })
    );
  });

  it("should fall back to admin role if openId matches ownerOpenId", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    // We mock ENV to enforce ownerOpenId matching
    vi.doMock("./_core/env", () => ({
      ENV: { ownerOpenId: "owner-123" },
    }));
    vi.resetModules();

    const { upsertUser } = await import("./db");

    await expect(upsertUser({ openId: "owner-123" })).resolves.toBeUndefined();

    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ openId: "owner-123", role: "admin" })
    );
  });
});

describe("deleteOldNotificationLogs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "mysql://mock",
      JWT_SECRET: "test-secret",
    };
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 1 on successful deletion", async () => {
    const mockDb = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ affectedRows: 5 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { deleteOldNotificationLogs } = await import("./db");

    const result = await deleteOldNotificationLogs(90);

    expect(result).toBe(1);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("should return 0 and log error on database failure", async () => {
    const mockDb = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockRejectedValue(new Error("Database connection lost")),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { deleteOldNotificationLogs } = await import("./db");

    const result = await deleteOldNotificationLogs(90);

    expect(result).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      "[Cleanup] Erro ao deletar logs antigos:",
      expect.any(Error)
    );
  });

  it("should return 0 if db is not available", async () => {
    vi.stubEnv("DATABASE_URL", ""); // db will fail to connect

    const { deleteOldNotificationLogs } = await import("./db");

    const result = await deleteOldNotificationLogs(90);

    expect(result).toBe(0);
    vi.unstubAllEnvs();
  });
});

describe("removeTicketNotificationEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "mysql://mock",
      JWT_SECRET: "test-secret",
    };
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return true on successful deletion", async () => {
    const mockDb = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { removeTicketNotificationEmail } = await import("./db");

    const result = await removeTicketNotificationEmail(1);

    expect(result).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
  });

  it("should return false and log error on database failure", async () => {
    const mockDb = {
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockRejectedValue(new Error("Database connection lost")),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { removeTicketNotificationEmail } = await import("./db");

    const result = await removeTicketNotificationEmail(1);

    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "[Database] Error removing ticket notification email:",
      expect.any(Error)
    );
  });

  it("should return false and warn if db is not available", async () => {
    vi.stubEnv("DATABASE_URL", ""); // db will fail to connect

    const { removeTicketNotificationEmail } = await import("./db");

    const result = await removeTicketNotificationEmail(1);

    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      "[Database] Cannot remove ticket notification email: database not available"
    );
    vi.unstubAllEnvs();
  });
});
