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
  followUpPrompts: null as null | ((message: { role: "assistant"; content: string }) => string[]),
  onFollowUpPromptSelected: null as null | ((prompt: string) => void),
}));

const COMPLETE_NEXT_FLIGHT = [
  "**Próximo voo — ida**",
  "- **Rota:** GRU — Aeroporto Internacional de São Paulo/Guarulhos → NVT — Aeroporto de Navegantes",
  "- **Data e hora:** 26/04/2026 às 22:05",
  "- **Companhia:** GOL",
  "- **Voo:** G31234",
  "- **Terminal:** 2",
  "- **Status:** Programado",
].join("\n");

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
    followUpPrompts,
    onFollowUpPromptSelected,
    isLoading,
  }: {
    messages: Array<{ role: string; content: string }>;
    onSendMessage: (content: string) => void;
    followUpPrompts?: (message: { role: "assistant"; content: string }) => string[];
    onFollowUpPromptSelected?: (prompt: string) => void;
    isLoading: boolean;
  }) => {
    state.followUpPrompts = followUpPrompts ?? null;
    state.onFollowUpPromptSelected = onFollowUpPromptSelected ?? null;
    const latestAssistant = [...messages].reverse().find(message => message.role === "assistant");
    const prompts = latestAssistant && followUpPrompts
      ? followUpPrompts({ role: "assistant", content: latestAssistant.content })
      : [];
    return (
      <div>
        <button type="button" onClick={() => onSendMessage("Qual é meu próximo voo?")}>Enviar pergunta de teste</button>
        <button type="button" onClick={() => onSendMessage("Quais são os detalhes?")}>Pedir detalhes</button>
        <button type="button" onClick={() => onFollowUpPromptSelected?.("Há algum voo cancelado ou remarcado?")}>Registrar interesse em alerta</button>
        <span data-testid="primeira-sugestao">{prompts[0] ?? "Sem sugestão"}</span>
        <span>{isLoading ? "Fly.IA carregando" : "Fly.IA pronta"}</span>
        {messages.map((message, index) => <p key={index}>{message.content}</p>)}
      </div>
    );
  },
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
  state.followUpPrompts = null;
  state.onFollowUpPromptSelected = null;
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

  it("mantém os detalhes completos ao perguntar novamente pelo próximo voo", () => {
    mount();

    sendQuestion();
    act(() => state.options.onSuccess({ response: COMPLETE_NEXT_FLIGHT }));
    act(() => {
      Array.from(document.body.querySelectorAll<HTMLButtonElement>("button"))
        .find(button => button.textContent === "Pedir detalhes")
        ?.click();
    });

    expect(state.mutate).toHaveBeenLastCalledWith({
      year: 2026,
      messages: [
        { role: "user", content: "Qual é meu próximo voo?" },
        { role: "assistant", content: COMPLETE_NEXT_FLIGHT },
        { role: "user", content: "Quais são os detalhes?" },
      ],
    });

    act(() => state.options.onSuccess({ response: COMPLETE_NEXT_FLIGHT }));
    expect(document.body.textContent).toContain("26/04/2026 às 22:05");
    expect(document.body.textContent).toContain("G31234");
    expect(document.body.textContent).toContain("Terminal:** 2");
  });

  it("prioriza o tema escolhido durante a conversa e remove a preferência ao limpar", () => {
    mount();
    sendQuestion();
    act(() => state.options.onSuccess({ response: "Seu próximo voo sai às 22:05." }));

    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Quais são os detalhes do próximo voo?");

    act(() => {
      Array.from(document.body.querySelectorAll<HTMLButtonElement>("button"))
        .find(button => button.textContent === "Registrar interesse em alerta")
        ?.click();
    });

    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Há algum voo cancelado ou remarcado?");

    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Limpar conversa"]')?.click());
    act(() => state.options.onSuccess({ response: "Seu próximo voo sai às 22:05." }));

    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Quais são os detalhes do próximo voo?");
  });
});
