import { describe, expect, it } from "vitest";
import { queryCachePolicies } from "./queryCache";

describe("políticas de cache tRPC", () => {
  it("mantém dados anuais em cache por mais tempo que o uso de API", () => {
    expect(queryCachePolicies.annualPlanning.staleTime).toBe(120_000);
    expect(queryCachePolicies.financial.staleTime).toBe(120_000);
    expect(queryCachePolicies.apiUsage.staleTime).toBe(30_000);
  });

  it("evita refetch ao retornar o foco para dados de leitura frequente", () => {
    expect(queryCachePolicies.annualPlanning.refetchOnWindowFocus).toBe(false);
    expect(queryCachePolicies.quotes.refetchOnWindowFocus).toBe(false);
    expect(queryCachePolicies.admin.refetchOnWindowFocus).toBe(false);
  });

  it("mantém a chave pública VAPID em cache sem expiração operacional", () => {
    expect(queryCachePolicies.staticPublicKey.staleTime).toBe(Infinity);
  });
});
