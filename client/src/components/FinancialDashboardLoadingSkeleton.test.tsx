/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialDashboardLoadingSkeleton } from "./FinancialDashboardLoadingSkeleton";

describe("FinancialDashboardLoadingSkeleton", () => {
  it("expõe um estado de carregamento acessível e preserva os principais blocos do dashboard", () => {
    const { container } = render(<FinancialDashboardLoadingSkeleton />);

    expect(
      screen
        .getByRole("status", { name: "Carregando dados financeiros" })
        .getAttribute("aria-busy")
    ).toBe("true");
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(38);

    const contentBlocks = container.querySelectorAll("section > div");
    expect(contentBlocks[0]?.className).toContain("grid-cols-1");
    expect(contentBlocks[0]?.className).toContain("md:grid-cols-4");
    expect(contentBlocks[2]?.className).toContain("lg:grid-cols-2");
  });
});
