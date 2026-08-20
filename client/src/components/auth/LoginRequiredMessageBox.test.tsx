// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const recordAttempt = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc", () => ({
  trpc: {
    protectedAccess: {
      record: {
        useMutation: () => ({ mutate: recordAttempt }),
      },
    },
  },
}));
import {
  LoginRequiredMessageBox,
  LoginRequiredScreen,
} from "./LoginRequiredMessageBox";

describe("LoginRequiredMessageBox", () => {
  it("centraliza a mensagem e encaminha o usuário ao login", () => {
    const onOpenChange = vi.fn();
    const onLogin = vi.fn();
    render(
      <LoginRequiredMessageBox
        open
        onOpenChange={onOpenChange}
        onLogin={onLogin}
        title="Acesso ao planejamento"
        description="Entre para acessar seus dados de viagem."
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLogin).toHaveBeenCalledOnce();
  });

  it("mantém o estado de página protegido centralizado e acessível", () => {
    render(
      <LoginRequiredScreen
        title="Planejamento protegido"
        description="Entre para continuar."
        onLogin={vi.fn()}
      />
    );

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Planejamento protegido")).toBeTruthy();
  });
});
