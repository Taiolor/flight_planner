/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  options: null as any,
  isPending: false,
  mutate: vi.fn(),
  toastError: vi.fn(),
  rerender: () => {},
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: {
      check: { useQuery: () => ({ data: { authenticated: true } }) },
    },
    flyIa: {
      chat: {
        useMutation: (options: unknown) => {
          state.options = options;
          return { mutate: state.mutate, isPending: state.isPending };
        },
      },
    },
  },
}));

vi.mock("./AIChatBox", () => ({
  AIChatBox: ({
    messages,
    onSendMessage,
    isLoading,
  }: {
    messages: Array<{ role: string; content: string }>;
    onSendMessage: (content: string) => void;
    isLoading: boolean;
  }) => (
    <div>
      <button type="button" onClick={() => onSendMessage("Qual é meu próximo voo?")}>Enviar pergunta de teste</button>
      <span>{isLoading ? "Fly.IA carregando" : "Fly.IA pronta"}</span>
      {messages.map((message, index) => <p key={index}>{message.content}</p>)}
    </div>
  ),
}));

vi.mock("@/contexts/YearContext", () => ({ useYear: () => ({ selectedYear: 2026 }) }));
vi.mock("sonner", () => ({ toast: { error: state.toastError } }));

import FlyIA from "./FlyIA";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount() {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  state.rerender = () => root?.render(<FlyIA />);
  act(() => root?.render(<FlyIA />));
  act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Abrir Fly.IA"]')?.click());
}

function sendQuestion() {
  act(() => {
    Array.from(document.body.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => button.textContent === "Enviar pergunta de teste")
      ?.click();
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  state.options = null;
  state.isPending = false;
  state.mutate.mockReset();
  state.toastError.mockReset();
  document.body.replaceChildren();
});

describe("Fly.IA response flow", () => {
  it("envia a pergunta, mostra carregamento e renderiza a resposta retornada", () => {
    state.mutate.mockImplementation(() => {
      state.isPending = true;
      act(() => state.rerender());
    });
    mount();

    sendQuestion();

    expect(state.mutate).toHaveBeenCalledWith({
      year: 2026,
      messages: [{ role: "user", content: "Qual é meu próximo voo?" }],
    });
    expect(document.body.textContent).toContain("Fly.IA carregando");

    act(() => {
      state.isPending = false;
      state.options.onSuccess({ response: "Seu próximo voo é amanhã." });
    });

    expect(document.body.textContent).toContain("Seu próximo voo é amanhã.");
    expect(document.body.textContent).toContain("Fly.IA pronta");
  });

  it("mostra um retorno visível no chat quando o provedor falha", () => {
    state.mutate.mockImplementation(() => {
      state.isPending = true;
      act(() => state.rerender());
    });
    mount();

    sendQuestion();
    act(() => {
      state.isPending = false;
      state.options.onError({ message: "O Fly.IA está indisponível no momento." });
    });

    expect(document.body.textContent).toContain("Não consegui responder agora.");
    expect(document.body.textContent).toContain("O Fly.IA está indisponível no momento.");
    expect(document.body.textContent).toContain("Fly.IA pronta");
    expect(state.toastError).toHaveBeenCalledWith("O Fly.IA está indisponível no momento.");
  });
});
