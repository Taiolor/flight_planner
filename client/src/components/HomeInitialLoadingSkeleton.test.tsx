// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeInitialLoadingSkeleton } from "./HomeInitialLoadingSkeleton";

describe("HomeInitialLoadingSkeleton", () => {
  it("preserva uma estrutura acessível e responsiva durante a carga inicial", () => {
    const { container } = render(<HomeInitialLoadingSkeleton year={2026} />);

    const status = screen.getByRole("status", { name: /carregando planejamento de viagens de 2026/i });
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText(/preparando seu planejamento de viagens/i).className).toContain("sr-only");
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(12);
  });
});
