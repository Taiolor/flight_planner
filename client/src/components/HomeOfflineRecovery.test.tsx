// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeOfflineRecovery } from "./HomeOfflineRecovery";

describe("HomeOfflineRecovery", () => {
  it("explica a ausência de dados locais e permite verificar a conexão novamente", () => {
    const onRetry = vi.fn();
    render(<HomeOfflineRecovery year={2026} lastSyncedAt={null} onRetry={onRetry} />);

    expect(screen.getByRole("alert").textContent).toContain("Não há dados locais para 2026");
    expect(screen.getByText("Este dispositivo ainda não possui uma sincronização local registrada.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Verificar conexão novamente" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("mostra a agenda mínima cacheada sem expor localizadores ou valores", () => {
    render(
      <HomeOfflineRecovery
        year={2026}
        lastSyncedAt={1_785_000_000_000}
        onRetry={vi.fn()}
        cachedTrips={{
          version: 1,
          cachedAt: 1_785_000_000_000,
          trips: [{ weekNumber: 27, departureDate: "30/06/2026", returnDate: "04/07/2026", route: "GRU → NVT", airline: "latam", status: "pending" }],
        }}
      />
    );

    const offlineAgenda = screen.getByLabelText("Próximas viagens disponíveis offline").textContent ?? "";
    expect(offlineAgenda).toContain("Semana 27");
    expect(offlineAgenda).not.toContain("LOC-");
    expect(offlineAgenda).not.toContain("R$");
  });
});
