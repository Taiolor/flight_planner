/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticated: false,
  toastInfo: vi.fn(),
  chatMutate: vi.fn(),
}));
let root: Root | null = null;
let host: HTMLDivElement | null = null;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: {
      check: {
        useQuery: () => ({ data: { authenticated: state.authenticated } }),
      },
    },
    flyIa: {
      chat: {
        useMutation: () => ({ mutate: state.chatMutate, isPending: false }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { info: state.toastInfo, error: vi.fn() },
}));

vi.mock("@/contexts/YearContext", () => ({
  useYear: () => ({ selectedYear: 2026 }),
}));

import FlyIA from "./FlyIA";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(<FlyIA />));
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  state.authenticated = false;
  state.toastInfo.mockReset();
  state.chatMutate.mockReset();
  document.body.replaceChildren();
});

describe("Fly.IA interactions", () => {
  it("orienta visitantes a entrar em vez de abrir uma conversa com dados protegidos", () => {
    mount();
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Abrir Fly.IA"]'
    );

    expect(trigger).toBeTruthy();
    act(() => trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(state.toastInfo).toHaveBeenCalledWith(
      "Entre para consultar o seu planejamento com o Fly.IA."
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("abre a janela de conversa para uma sessão autenticada", () => {
    state.authenticated = true;
    mount();
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Abrir Fly.IA"]'
    );

    act(() => trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Assistente do planejamento de 2026");
  });
});
