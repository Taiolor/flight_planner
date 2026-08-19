// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnnualPlanningProgress } from "./AnnualPlanningProgress";

describe("AnnualPlanningProgress", () => {
  const baseProps = {
    progress: {
      totalWeeks: 44,
      issuedWeeks: 28,
      pendingWeeks: 16,
      urgentWeeks: 2,
      completionPercent: 64,
    },
    goal: 35,
    goalProgress: { percent: 80, remaining: 7, achieved: false },
    year: 2026,
    isOpen: true,
    onToggle: vi.fn(),
    onShowPending: vi.fn(),
    onSaveGoal: vi.fn(),
    comparison: [
      {
        year: 2026,
        totalWeeks: 44,
        issuedWeeks: 28,
        pendingWeeks: 16,
        completionPercent: 64,
      },
      {
        year: 2027,
        totalWeeks: 44,
        issuedWeeks: 8,
        pendingWeeks: 36,
        completionPercent: 18,
      },
    ],
  };

  it("exibe emissões e pendências de cada ano", () => {
    render(<AnnualPlanningProgress {...baseProps} />);

    expect(screen.getByText("Comparativo entre anos")).toBeTruthy();
    expect(screen.getByText("28/44 emitidas · 16 pendentes")).toBeTruthy();
    expect(screen.getByText("8/44 emitidas · 36 pendentes")).toBeTruthy();
    expect(screen.getByText("Atual")).toBeTruthy();
  });

  it("expõe um controle de sanfona acessível", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <AnnualPlanningProgress {...baseProps} onToggle={onToggle} />
    );

    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-controls="annual-progress-content"]'
    );
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle!);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
