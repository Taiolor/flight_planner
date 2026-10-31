/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlightQuotesLoadingSkeleton } from "./FlightQuotesLoadingSkeleton";

describe("FlightQuotesLoadingSkeleton", () => {
  it("comunica carregamento e desativa movimento para reduced motion", () => {
    render(<FlightQuotesLoadingSkeleton year={2026} />);

    const status = screen.getByRole("status", {
      name: "Carregando cotações de 2026",
    });

    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.className).toContain("animate-pulse");
    expect(status.className).toContain("motion-reduce:animate-none");
    expect(screen.getAllByTestId("quote-week-skeleton")).toHaveLength(8);
  });
});

