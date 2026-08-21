/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/calendar"],
}));

vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));

import { MobileBottomNavigation } from "./MobileBottomNavigation";

describe("MobileBottomNavigation", () => {
  it("expõe os quatro destinos e destaca a rota atual", () => {
    render(<MobileBottomNavigation />);

    expect(screen.getByRole("navigation", { name: "Navegação principal mobile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Início" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Calendário" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Gestão" }).getAttribute("href")).toBe("/gestao-passagens");
    expect(screen.getByRole("link", { name: "Cotações" }).getAttribute("href")).toBe("/cotacoes");
  });
});
