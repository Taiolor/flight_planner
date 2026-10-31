/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    notificationSettings: {
      get: { useQuery: mocks.get },
      update: { useMutation: mocks.update },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { NotificationSettingsPopup } from "./NotificationSettingsPopup";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("NotificationSettingsPopup", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("expõe estado acessível durante o salvamento", async () => {
    mocks.get.mockReturnValue({ data: undefined });
    mocks.update.mockReturnValue({ mutate: vi.fn(), isPending: true });

    render(<NotificationSettingsPopup isAuthenticated onLoginRequired={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Configurar agendamentos de notificação" }));

    const saveButton = await screen.findByRole("button", { name: "Salvando..." });
    expect(saveButton.getAttribute("aria-busy")).toBe("true");
    expect(saveButton.className).toContain("motion-reduce:transition-none");
  });

  it("persiste preferências de push e e-mail por tipo de aviso", async () => {
    const mutate = vi.fn();
    mocks.get.mockReturnValue({
      data: {
        aviso1Minutes: 1440,
        aviso2Minutes: 0,
        flightPushEnabled: false,
        ticketEmailEnabled: true,
      },
    });
    mocks.update.mockReturnValue({ mutate, isPending: false });

    render(<NotificationSettingsPopup isAuthenticated onLoginRequired={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Configurar agendamentos de notificação" }));

    const pushControl = await screen.findByRole("checkbox", { name: "Ativar notificações push para voos próximos" });
    const emailControl = screen.getByRole("checkbox", { name: "Ativar e-mails para alterações de bilhetes" });
    expect((pushControl as HTMLInputElement).checked).toBe(false);
    expect((emailControl as HTMLInputElement).checked).toBe(true);

    fireEvent.click(pushControl);
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    await waitFor(() => expect(mutate).toHaveBeenCalledWith({
      aviso1Minutes: 1440,
      aviso2Minutes: 0,
      flightPushEnabled: true,
      ticketEmailEnabled: true,
    }));
  });
});
