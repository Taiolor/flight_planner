/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ authenticated: false, moduleLoads: 0, chatMutation: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  flightAuth: { check: { useQuery: () => ({ data: { authenticated: state.authenticated } }) } },
  flyIa: { chat: { useMutation: () => ({ mutate: state.chatMutation, isPending: false }) } },
} }));
vi.mock("@/contexts/YearContext", () => ({ useYear: () => ({ selectedYear: 2026 }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("./AIChatBox", async () => {
  state.moduleLoads += 1;
  return { AIChatBox: () => <div>Renderizador de chat pronto</div> };
});
import FlyIA from "./FlyIA";

afterEach(() => { cleanup(); state.authenticated = false; state.chatMutation.mockClear(); });

describe("Fly.IA on-demand renderer", () => {
  it("keeps the renderer unloaded while the launcher is idle", async () => {
    state.authenticated = true;
    render(<FlyIA />);
    await vi.dynamicImportSettled();
    expect(state.moduleLoads).toBe(0);
    expect(screen.queryByText("Renderizador de chat pronto")).toBeNull();
    expect(screen.getByRole("button", { name: "Abrir Fly.IA" })).toBeTruthy();
  });

  it("keeps the login gate immediate and does not import the chat for visitors", async () => {
    render(<FlyIA />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Fly.IA" }));
    await vi.dynamicImportSettled();
    expect(screen.getAllByText("Entre para consultar o seu planejamento com o Fly.IA. Suas perguntas usam apenas os dados do exercício selecionado.").length).toBeGreaterThan(0);
    expect(state.moduleLoads).toBe(0);
    expect(state.chatMutation).not.toHaveBeenCalled();
  });

  it("loads the renderer only on an authenticated opening and hides it on close", async () => {
    state.authenticated = true;
    render(<FlyIA />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Fly.IA" }));
    expect(await screen.findByText("Renderizador de chat pronto")).toBeTruthy();
    expect(state.moduleLoads).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Fechar Fly.IA" }));
    expect(screen.queryByText("Renderizador de chat pronto")).toBeNull();
  });
});
