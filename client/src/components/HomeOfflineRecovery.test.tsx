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
});
