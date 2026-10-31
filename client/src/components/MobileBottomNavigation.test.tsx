/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authCheck: vi.fn(),
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/calendar"],
}));

vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: {
      check: {
        useQuery: mocks.authCheck,
      },
    },
  },
}));

import { MobileBottomNavigation } from "./MobileBottomNavigation";

describe("MobileBottomNavigation", () => {
  beforeEach(() => {
    mocks.authCheck.mockReturnValue({
      data: { authenticated: false, isAdmin: false },
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("expõe os quatro destinos, o painel de mais opções e destaca a rota atual", () => {
    render(<MobileBottomNavigation />);

    expect(screen.getByRole("navigation", { name: "Navegação principal mobile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Calendário" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Gestão" }).getAttribute("href")).toBe("/gestao-passagens");
    expect(screen.getByRole("link", { name: "Cotações" }).getAttribute("href")).toBe("/cotacoes");
    expect(screen.getByRole("button", { name: "Mais opções de navegação" })).toBeTruthy();
  });

  it("exibe os três atalhos administrativos no painel mobile para administradores", () => {
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, isAdmin: true },
      isLoading: false,
    });

    render(<MobileBottomNavigation />);
    fireEvent.click(screen.getByRole("button", { name: "Mais opções de navegação" }));

    expect(screen.getByRole("link", { name: "Painel de avisos" }).getAttribute("href")).toBe("/admin/notifications");
    expect(screen.getByRole("link", { name: "Locais de Acesso" }).getAttribute("href")).toBe("/admin/telemetria");
    expect(screen.getByRole("link", { name: "Uso de IA" }).getAttribute("href")).toBe("/admin/gemini");
  });

  it("mantém os dois atalhos exclusivos ocultos fora de uma sessão administrativa", () => {
    mocks.authCheck.mockReturnValue({
      data: { authenticated: true, isAdmin: false },
      isLoading: false,
    });

    render(<MobileBottomNavigation />);
    fireEvent.click(screen.getByRole("button", { name: "Mais opções de navegação" }));

    expect(screen.getByRole("link", { name: "Painel de avisos" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Locais de Acesso" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Uso de IA" })).toBeNull();
  });
});
