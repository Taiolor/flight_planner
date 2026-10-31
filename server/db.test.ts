import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";

// Mock the drizzle-orm/mysql2 module
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(),
}));

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
