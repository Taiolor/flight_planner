import { describe, expect, it } from "vitest";
import { canLoadProtectedQuoteData } from "./quoteAccess";

describe("canLoadProtectedQuoteData", () => {
  it("mantém consultas protegidas desabilitadas enquanto a sessão ainda está sendo verificada", () => {
    expect(
      canLoadProtectedQuoteData({
        isAuthResolved: false,
        isAuthenticating: true,
        isAuthenticated: false,
      })
    ).toBe(false);
  });

  it("mantém consultas protegidas desabilitadas para visitantes sem login", () => {
    expect(
      canLoadProtectedQuoteData({
        isAuthResolved: true,
        isAuthenticating: false,
        isAuthenticated: false,
      })
    ).toBe(false);
  });

  it("libera consultas protegidas somente após uma sessão autenticada ser confirmada", () => {
    expect(
      canLoadProtectedQuoteData({
        isAuthResolved: true,
        isAuthenticating: false,
        isAuthenticated: true,
      })
    ).toBe(true);
  });
});
