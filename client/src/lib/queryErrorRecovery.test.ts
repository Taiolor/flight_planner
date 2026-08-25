import { TRPCClientError } from "@trpc/client";
import { describe, expect, it } from "vitest";
import { isRetryableDatabaseQueryError } from "./queryErrorRecovery";

describe("isRetryableDatabaseQueryError", () => {
  it("identifica uma falha de consulta que pode ser transitória", () => {
    expect(
      isRetryableDatabaseQueryError(
        new TRPCClientError("Failed query: select * from flight_weeks")
      )
    ).toBe(true);
  });

  it("não repete erros tRPC de regra de negócio ou autenticação", () => {
    expect(
      isRetryableDatabaseQueryError(new TRPCClientError("Faça login para acessar."))
    ).toBe(false);
    expect(isRetryableDatabaseQueryError(new Error("Failed query"))).toBe(false);
  });
});
