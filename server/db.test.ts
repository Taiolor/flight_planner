import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";

// Mock the drizzle-orm/mysql2 module
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(),
}));

describe("upsertUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DATABASE_URL: "mysql://mock" };
    vi.clearAllMocks();
    vi.resetModules(); // This will clear the module cache, so _db in db.ts is null for each test
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if db insertion fails", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      onDuplicateKeyUpdate: vi
        .fn()
        .mockRejectedValue(new Error("DB insertion failed")),
    };

    (drizzle as any).mockReturnValue(mockDb);

    const { upsertUser } = await import("./db");

    await expect(upsertUser({ openId: "test-user-123" })).rejects.toThrow(
      "DB insertion failed"
    );

    expect(console.error).toHaveBeenCalledWith(
      "[Database] Failed to upsert user:",
      expect.any(Error)
    );
  });

  it("should throw an error if user openId is missing", async () => {
    const { upsertUser } = await import("./db");

    // @ts-expect-error - testing invalid input
    await expect(upsertUser({})).rejects.toThrow(
      "User openId is required for upsert"
    );
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
    expect(mockDb.values).toHaveBeenCalled();
    expect(mockDb.onDuplicateKeyUpdate).toHaveBeenCalled();
  });
});
