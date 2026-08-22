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

    expect(screen.getByText("28 de 35 emissões da meta anual já foram registradas.")).toBeTruthy();
    expect(screen.getByText("80%")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso anual de passagens emitidas",
      }).getAttribute("aria-valuenow")
    ).toBe("80");
    expect(screen.getByText("Comparativo entre anos")).toBeTruthy();
    expect(screen.getByText("28/35 meta · faltam 7")).toBeTruthy();
    expect(screen.getByText("8/44 emitidas · 36 pendentes")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso da meta de emissões em 2026",
      }).getAttribute("aria-valuenow")
    ).toBe("80");
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
