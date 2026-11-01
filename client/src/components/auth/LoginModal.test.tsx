/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  login: vi.fn(), cancel: vi.fn(), check: vi.fn(), invalidate: vi.fn(), success: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: { login: { useMutation: () => ({ mutateAsync: mocks.login, isPending: false }) } },
    useUtils: () => ({ flightAuth: { check: { cancel: mocks.cancel, fetch: mocks.check } }, invalidate: mocks.invalidate }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
import { LoginModal } from "./LoginModal";
(globalThis as typeof globalThis & { React: typeof React }).React = React;

function startLogin() {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "owner@example.com" } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "test-password-only" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.login.mockResolvedValue({ success: true });
  mocks.cancel.mockResolvedValue(undefined);
  mocks.check.mockResolvedValue({ authenticated: true, isAdmin: true });
  mocks.invalidate.mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe("LoginModal verified session", () => {
  it("checks the new cookie before closing, invalidating protected data or showing success", async () => {
    const close = vi.fn();
    const order: string[] = [];
    mocks.login.mockImplementation(async () => { order.push("login"); return { success: true }; });
    mocks.cancel.mockImplementation(async () => { order.push("cancel-anonymous-check"); });
    mocks.check.mockImplementation(async () => { order.push("check-cookie"); return { authenticated: true }; });
    mocks.invalidate.mockImplementation(async () => { order.push("refresh-data"); });
    render(<LoginModal open onOpenChange={close} />);
    startLogin();
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Login realizado com sucesso!"));
    expect(order).toEqual(["login", "cancel-anonymous-check", "check-cookie", "refresh-data"]);
    expect(mocks.check).toHaveBeenCalledWith(undefined, { staleTime: 0 });
    expect(close).toHaveBeenCalledWith(false);
    expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe("");
  });

  it("does not report success if credentials pass but the browser does not maintain the session", async () => {
    mocks.check.mockResolvedValue({ authenticated: false, isAdmin: false });
    const close = vi.fn();
    render(<LoginModal open onOpenChange={close} />);
    startLogin();
    expect((await screen.findByRole("alert")).textContent).toContain("O navegador não confirmou a sessão");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("keeps the dialog open when the fresh session check has a network error", async () => {
    mocks.check.mockRejectedValue(new Error("Falha de conexão ao confirmar a sessão."));
    render(<LoginModal open onOpenChange={vi.fn()} />);
    startLogin();
    expect((await screen.findByRole("alert")).textContent).toContain("Falha de conexão");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("retains the server credential error and does not check a nonexistent session", async () => {
    mocks.login.mockRejectedValue(new Error("E-mail ou senha incorretos."));
    render(<LoginModal open onOpenChange={vi.fn()} />);
    startLogin();
    expect((await screen.findByRole("alert")).textContent).toBe("E-mail ou senha incorretos.");
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("blocks repeated clicks and Enter while waiting for cookie confirmation", async () => {
    let finish!: (value: { authenticated: boolean }) => void;
    mocks.check.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<LoginModal open onOpenChange={vi.fn()} />);
    startLogin();
    const button = await screen.findByRole("button", { name: "Confirmando sessão..." });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByLabelText("Senha"), { key: "Enter" });
    expect(mocks.login).toHaveBeenCalledTimes(1);
    expect(mocks.success).not.toHaveBeenCalled();
    finish({ authenticated: true });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledTimes(1));
  });
});
