import { describe, expect, it } from "vitest";
import { getAdminAccessState } from "./AdminNotifications";

describe("getAdminAccessState", () => {
  it("mantém a página em carregamento enquanto a sessão é verificada", () => {
    expect(
      getAdminAccessState({
        isCheckingAuthentication: true,
        isAuthenticated: false,
      })
    ).toBe("checking");
  });

  it("solicita login sem disparar consultas administrativas protegidas", () => {
    expect(
      getAdminAccessState({
        isCheckingAuthentication: false,
        isAuthenticated: false,
      })
    ).toBe("login-required");
  });

  it("libera o painel somente após autenticação válida", () => {
    expect(
      getAdminAccessState({
        isCheckingAuthentication: false,
        isAuthenticated: true,
      })
    ).toBe("authorized");
  });
});
