/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DecisionCenter } from "./DecisionCenter";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("DecisionCenter", () => {
  const props = {
    items: [{ id: "pending-27", severity: "warning" as const, destination: "management" as const, weekNumber: 27, title: "Emitir passagem da semana 27", reason: "Viagem em 10 dias.", actionLabel: "Abrir Gestão", score: 900, price: 620, priceVariationPercent: 8, manualAdjustment: 0 }],
    secondaryItems: [],
    isExpanded: true,
    secondaryQueueOpen: false,
    nextTrip: { weekNumber: 27, departureDate: "30/08/2026", returnDate: "04/09/2026", route: "GRU → NVT", airline: "GOL", status: "pending" as const },
    isLoading: false,
    hasError: false,
    onRetry: vi.fn(),
    onToggleExpanded: vi.fn(),
    onToggleSecondaryQueue: vi.fn(),
    onAdjustRelevance: vi.fn(),
    onOpenManagementWeek: vi.fn(),
    onOpenCalendarWeek: vi.fn(),
    metrics: { issuedCount: 2, pendingCount: 3, annualTotal: "R$ 1.240,00", averageTrip: "R$ 620,00" },
  };

  it("expõe prioridades semânticas e encaminha cada CTA ao contexto correto", () => {
    render(<DecisionCenter {...props} />);

    expect(screen.getByRole("region", { name: /central de decisão/i })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Prioridades operacionais" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /abrir gestão/i }));
    expect(props.onOpenManagementWeek).toHaveBeenCalledWith(27);
    fireEvent.click(screen.getByRole("button", { name: /abrir no calendário/i }));
    expect(props.onOpenCalendarWeek).toHaveBeenCalledWith(27);
    fireEvent.click(screen.getByRole("button", { name: "Elevar relevância da semana 27" }));
    expect(props.onAdjustRelevance).toHaveBeenCalledWith(27, "raise");
  });

  it("permite expandir a fila secundária sem misturá-la às prioridades do dia", () => {
    const secondary = { id: "pending-31", severity: "warning" as const, destination: "management" as const, weekNumber: 31, title: "Emitir passagem da semana 31", reason: "Viagem em 25 dias.", actionLabel: "Abrir Gestão", score: 640, price: 540, priceVariationPercent: -4, manualAdjustment: 0 };
    render(<DecisionCenter {...props} secondaryItems={[secondary]} secondaryQueueOpen={false} />);

    const toggle = screen.getByRole("button", { name: /fila secundária/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(props.onToggleSecondaryQueue).toHaveBeenCalledTimes(1);
  });

  it("recolhe integralmente o conteúdo da Central pelo controle sanfona acessível", () => {
    const view = render(<DecisionCenter {...props} isExpanded={false} />);

    const toggle = view.getByRole("button", { name: "Expandir central" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(view.container.querySelector('[aria-label="Prioridades operacionais"]')).toBeNull();
    fireEvent.click(toggle);
    expect(props.onToggleExpanded).toHaveBeenCalledOnce();
  });

  it("oferece recuperação explícita quando a Central falha", () => {
    render(<DecisionCenter {...props} hasError />);
    expect(screen.getByRole("alert").textContent).toContain("não conseguiu atualizar as prioridades");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });
});
