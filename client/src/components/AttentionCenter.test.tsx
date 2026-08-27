/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttentionCenter } from "./AttentionCenter";

describe("AttentionCenter", () => {
  const props = {
    items: [{ id: "deadline-27", kind: "deadline" as const, severity: "urgent" as const, weekNumber: 27, title: "Emitir a passagem da semana 27", description: "A viagem começa em 10 dias.", actionLabel: "Abrir Gestão", urgencyScore: 90 }],
    dismissedItems: [],
    dismissals: {},
    hideValues: true,
    isOpen: false,
    onToggle: vi.fn(),
    onOpenWeek: vi.fn(),
    onDismiss: vi.fn(),
    onRestore: vi.fn(),
  };

  it("usa o mesmo acabamento da Central de Decisão e mantém a sanfona acessível", () => {
    const view = render(<AttentionCenter {...props} />);

    const section = view.container.querySelector('section[aria-labelledby="attention-center-title"]');
    const toggle = view.getByRole("button", { name: "Expandir Central de atenção" });
    expect(section?.className).toContain("bg-gradient-to-br");
    expect(section?.className).toContain("shadow-2xl");
    expect(toggle.className).not.toContain("border");
    expect(toggle.className).toContain("transition-colors");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(view.container.textContent).toContain("Em foco: Emitir a passagem da semana 27");

    fireEvent.click(toggle);
    expect(props.onToggle).toHaveBeenCalledOnce();
  });
});
