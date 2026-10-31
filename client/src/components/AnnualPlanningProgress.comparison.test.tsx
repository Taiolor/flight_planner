// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnnualPlanningProgress } from "./AnnualPlanningProgress";

describe("AnnualPlanningProgress", () => {
  afterEach(cleanup);

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
    onSaveComparisonGoal: vi.fn(),
    comparison: [
      {
        year: 2026,
        totalWeeks: 44,
        issuedWeeks: 28,
        pendingWeeks: 16,
        completionPercent: 64,
        goal: 35,
        goalProgress: { percent: 80, remaining: 7, achieved: false },
      },
      {
        year: 2027,
        totalWeeks: 44,
        issuedWeeks: 8,
        pendingWeeks: 36,
        completionPercent: 18,
        goal: 30,
        goalProgress: { percent: 27, remaining: 22, achieved: false },
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
    expect(screen.getByText("28/35 meta · 80% · faltam 7")).toBeTruthy();
    expect(screen.getByText("8/30 meta · 27% · faltam 22")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso da meta de emissões em 2026",
      }).getAttribute("aria-valuenow")
    ).toBe("80");
    expect(screen.getByText("Atual")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", {
        name: "Progresso da meta de emissões em 2027",
      }).getAttribute("aria-valuenow")
    ).toBe("27");
  });

  it("permite ajustar a meta de outro exercício e mostra a tendência da meta atual", () => {
    const onSaveComparisonGoal = vi.fn();
    render(
      <AnnualPlanningProgress
        {...baseProps}
        onSaveComparisonGoal={onSaveComparisonGoal}
        today={new Date("2026-08-22T12:00:00")}
      />
    );

    expect(screen.getByText("Tendência de emissões versus meta")).toBeTruthy();
    expect(screen.getByText("16 p.p. acima do ritmo esperado.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ajustar meta de 2027" }));
    fireEvent.change(screen.getByLabelText("Meta de emissões para 2027"), {
      target: { value: "32" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSaveComparisonGoal).toHaveBeenCalledWith(2027, 32, 44);
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
