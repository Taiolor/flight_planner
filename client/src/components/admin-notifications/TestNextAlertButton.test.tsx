/** @vitest-environment jsdom */
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  mutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    adminNotifications: {
      sendNextAlert: { useMutation: mocks.useMutation },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

import { TestNextAlertButton } from "./TestNextAlertButton";

describe("TestNextAlertButton", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mostra carregamento e bloqueia repetição enquanto envia o próximo alerta", () => {
    mocks.useMutation.mockReturnValue({ mutate: mocks.mutate, isPending: true });

    render(<TestNextAlertButton year={2026} />);

    const button = screen.getByRole("button", { name: "Enviando..." });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("confirma visualmente o envio bem-sucedido do próximo alerta", () => {
    let onSuccess: ((result: { sent: number }) => void) | undefined;
    mocks.useMutation.mockImplementation(options => {
      onSuccess = options.onSuccess;
      return { mutate: mocks.mutate, isPending: false };
    });

    render(<TestNextAlertButton year={2026} />);
    fireEvent.click(screen.getByRole("button", { name: "Testar" }));

    expect(mocks.mutate).toHaveBeenCalledWith({ year: 2026 });
    act(() => {
      onSuccess?.({ sent: 2 });
    });

    expect(screen.getByRole("status").textContent).toContain(
      "Notificação enviada para 2 dispositivo(s)"
    );
    expect(screen.getByRole("button", { name: "Enviado" })).toBeTruthy();
  });
});
