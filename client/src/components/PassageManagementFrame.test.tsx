/** @vitest-environment jsdom */
import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PassageManagementFrame } from "./PassageManagementFrame";

function FrameHarness() {
  const [allMonthsExpanded, setAllMonthsExpanded] = useState(false);
  return (
    <PassageManagementFrame
      allMonthsExpanded={allMonthsExpanded}
      onToggleAll={() => setAllMonthsExpanded(value => !value)}
    >
      {allMonthsExpanded ? <div>Janeiro, Fevereiro e Março abertos</div> : <div>Meses recolhidos</div>}
    </PassageManagementFrame>
  );
}

describe("PassageManagementFrame", () => {
  it("alterna o estado acessível e o conteúdo de meses visíveis", () => {
    render(<FrameHarness />);

    const button = screen.getByRole("button", { name: "Expandir todos os meses" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Meses recolhidos")).toBeTruthy();

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Recolher todos os meses" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Janeiro, Fevereiro e Março abertos")).toBeTruthy();
  });

  it("preserva a estrutura responsiva do cabeçalho e do controle global", () => {
    const { container } = render(
      <PassageManagementFrame allMonthsExpanded onToggleAll={() => {}}>
        <div>Conteúdo</div>
      </PassageManagementFrame>
    );
    const current = within(container);

    expect(container.querySelector(".sm\\:flex-row")).toBeTruthy();
    expect(container.querySelector(".sm\\:justify-between")).toBeTruthy();
    expect(current.getByRole("heading", { name: "Gestão de Passagens" })).toBeTruthy();
  });
});
