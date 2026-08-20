import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  values: vi.fn(),
  insert: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
}));

import { recordProtectedAccessAttempt } from "./protectedAccessMetrics";

describe("métricas de acesso protegido", () => {
  beforeEach(() => {
    mocks.values.mockReset();
    mocks.insert.mockReset();
    mocks.getDb.mockReset();
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.getDb.mockResolvedValue({ insert: mocks.insert });
  });

  it("persiste apenas a categoria do recurso, sem dados pessoais", async () => {
    await expect(recordProtectedAccessAttempt("financial")).resolves.toBe(true);

    expect(mocks.values).toHaveBeenCalledWith({ resource: "financial" });
    const payload = mocks.values.mock.calls[0][0];
    expect(Object.keys(payload)).toEqual(["resource"]);
  });

  it("não falha quando o banco não está disponível", async () => {
    mocks.getDb.mockResolvedValueOnce(null);
    await expect(recordProtectedAccessAttempt("fly-ia")).resolves.toBe(false);
  });
});
