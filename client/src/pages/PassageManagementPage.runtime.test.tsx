/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./Home", () => ({
  default: ({ mode }: { mode?: string }) => (
    <main aria-label="Gestão de Passagens dedicada">
      {mode === "passage-management" && (
        <>
          <h1>Gestão de Passagens</h1>
          <section aria-labelledby="annual-summary"><h2 id="annual-summary">Resumo Anual</h2></section>
          <section aria-labelledby="annual-filters"><h2 id="annual-filters">Filtros e Controles</h2></section>
          <section aria-labelledby="monthly-management"><h2 id="monthly-management">Gestão de Passagens</h2><button aria-expanded="false">Expandir todos os meses</button></section>
        </>
      )}
    </main>
  ),
}));

import PassageManagementPage from "./PassageManagementPage";

describe("PassageManagementPage em runtime", () => {
  it("monta o contexto anual dedicado com resumo, filtros e gestão mensal", () => {
    render(<PassageManagementPage />);

    expect(screen.getByRole("main", { name: "Gestão de Passagens dedicada" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Resumo Anual" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Filtros e Controles" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Gestão de Passagens" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Expandir todos os meses" }).getAttribute("aria-expanded")).toBe("false");
  });
});
