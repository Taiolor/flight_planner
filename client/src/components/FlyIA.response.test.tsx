/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  options: null as any,
  isPending: false,
  mutate: vi.fn(),
  toastError: vi.fn(),
  voiceMutateAsync: vi.fn(),
  rerender: () => {},
  followUpPrompts: null as null | ((message: { role: "assistant"; content: string }) => string[]),
  onFollowUpPromptSelected: null as null | ((prompt: string) => void),
  voiceInput: null as any,
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
      transcribeVoice: {
        useMutation: () => ({ mutateAsync: state.voiceMutateAsync, isPending: false }),
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
    voiceInput,
  }: {
    messages: Array<{ role: string; content: string }>;
    onSendMessage: (content: string) => void;
    followUpPrompts?: (message: { role: "assistant"; content: string }) => string[];
    onFollowUpPromptSelected?: (prompt: string) => void;
    isLoading: boolean;
    voiceInput?: any;
  }) => {
    state.followUpPrompts = followUpPrompts ?? null;
    state.onFollowUpPromptSelected = onFollowUpPromptSelected ?? null;
    state.voiceInput = voiceInput ?? null;
    const latestAssistant = [...messages].reverse().find(message => message.role === "assistant");
    const prompts = latestAssistant && followUpPrompts
      ? followUpPrompts({ role: "assistant", content: latestAssistant.content })
      : [];
    return (
      <div>
        <button type="button" onClick={() => onSendMessage("Qual é meu próximo voo?")}>Enviar pergunta de teste</button>
        <button type="button" onClick={() => onSendMessage("Quais são os detalhes?")}>Pedir detalhes</button>
        <button type="button" onClick={() => onFollowUpPromptSelected?.("Há algum voo cancelado ou remarcado?")}>Registrar interesse em alerta</button>
        {voiceInput && (
          <>
            <button
              type="button"
              aria-label={voiceInput.state === "recording" ? "Parar gravação" : "Falar uma pergunta"}
              onClick={voiceInput.state === "recording" ? voiceInput.onStopRecording : voiceInput.onStartRecording}
            >Voz</button>
            <span data-testid="voice-transcript">{voiceInput.transcript ?? ""}</span>
            <span data-testid="voice-error">{voiceInput.error ?? ""}</span>
          </>
        )}
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

function mount(width?: number) {
  host = document.createElement("div");
  if (width) host.style.width = `${width}px`;
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
  state.voiceMutateAsync.mockReset();
  state.followUpPrompts = null;
  state.onFollowUpPromptSelected = null;
  state.voiceInput = null;
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

  it("permite pausar a adaptação, redefinir o tema e sinaliza sugestões adaptadas", () => {
    mount();
    sendQuestion();
    act(() => state.options.onSuccess({ response: "Seu próximo voo sai às 22:05." }));
    act(() => state.onFollowUpPromptSelected?.("Há algum voo cancelado ou remarcado?"));

    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')?.textContent)
      .toContain("Alertas");

    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Desativar sugestões personalizadas"]')?.click());
    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')).toBeNull();
    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Quais são os detalhes do próximo voo?");

    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Ativar sugestões personalizadas"]')?.click());
    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Há algum voo cancelado ou remarcado?");

    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Redefinir tema preferido: Alertas"]')?.click());
    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')).toBeNull();
  });

  it("limpa todas as preferências e restaura a ordem padrão das sugestões", () => {
    mount();
    sendQuestion();
    act(() => state.options.onSuccess({ response: "Seu próximo voo sai às 22:05." }));
    act(() => state.onFollowUpPromptSelected?.("Há algum voo cancelado ou remarcado?"));
    act(() => state.onFollowUpPromptSelected?.("Qual é a distância total planejada?"));

    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')).not.toBeNull();
    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Redefinir todas as sugestões personalizadas"]')?.click());

    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')).toBeNull();
    expect(document.querySelector('[data-testid="primeira-sugestao"]')?.textContent)
      .toBe("Quais são os detalhes do próximo voo?");
  });

  it("explica a adaptação, limita a quantidade e alterna para o modo explorar", () => {
    mount();

    const help = document.querySelector<HTMLButtonElement>('button[aria-label="Como funcionam as sugestões"]');
    act(() => help?.click());
    expect(document.querySelector('#flyia-suggestion-help')?.textContent).toContain("modo explorar");
    expect(help?.getAttribute("aria-expanded")).toBe("true");

    const count = document.querySelector<HTMLSelectElement>('select[aria-label="Quantidade de sugestões"]');
    act(() => {
      if (!count) return;
      count.value = "2";
      count.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(state.followUpPrompts?.({ role: "assistant", content: "O gasto em passagens é R$ 1.200." })).toHaveLength(2);

    act(() => document.querySelector<HTMLButtonElement>('button[aria-label="Ativar modo explorar"]')?.click());
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="Ativar modo afinidade"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(state.followUpPrompts?.({ role: "assistant", content: "O gasto em passagens é R$ 1.200." })).toEqual([
      "Quanto já foi gasto em passagens?",
      "Qual é meu próximo voo?",
    ]);
  });

  it.each([
    { label: "celular", width: 320 },
    { label: "desktop", width: 1280 },
  ])("mantém controles acessíveis e fluidos em $label", ({ width }) => {
    mount(width);
    sendQuestion();
    act(() => state.options.onSuccess({ response: "Seu próximo voo sai às 22:05." }));
    act(() => state.onFollowUpPromptSelected?.("Há algum voo cancelado ou remarcado?"));

    const controls = document.querySelector<HTMLElement>('[data-testid="flyia-suggestion-controls"]');
    const toggle = document.querySelector<HTMLButtonElement>('button[aria-label="Desativar sugestões personalizadas"]');
    expect(host?.style.width).toBe(`${width}px`);
    expect(controls?.className).toContain("flex-wrap");
    expect(toggle?.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector('[data-testid="flyia-adapted-suggestions-indicator"]')?.textContent)
      .toContain("Alertas");
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="Redefinir tema preferido: Alertas"]')).not.toBeNull();
    expect(document.querySelector<HTMLSelectElement>('select[aria-label="Quantidade de sugestões"]')).not.toBeNull();
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="Como funcionam as sugestões"]')).not.toBeNull();
  });

  it("captura áudio, transcreve e preenche a pergunta editável", async () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    const originalMediaDevices = navigator.mediaDevices;
    const originalFetch = globalThis.fetch;
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    const upload = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ audioKey: "flyia-voice/test/voice.webm" }),
    });

    class FakeMediaRecorder {
      static isTypeSupported() { return true; }
      state: RecordingState = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onstop: ((event: Event) => void) | null = null;
      constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["fala"], { type: "audio/webm" }) } as BlobEvent);
        this.onstop?.(new Event("stop"));
      }
    }

    Reflect.set(globalThis, "MediaRecorder", FakeMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    Reflect.set(globalThis, "fetch", upload);
    state.voiceMutateAsync.mockResolvedValue({ text: "Qual é meu próximo voo?", language: "pt" });

    try {
      mount();
      const start = document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]');
      await act(async () => { start?.click(); await Promise.resolve(); });
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(document.querySelector<HTMLButtonElement>('button[aria-label="Parar gravação"]')).not.toBeNull();

      const stop = document.querySelector<HTMLButtonElement>('button[aria-label="Parar gravação"]');
      await act(async () => {
        stop?.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(upload).toHaveBeenCalledWith("/api/flyia/voice-upload", expect.objectContaining({ method: "POST" }));
      expect(state.voiceMutateAsync).toHaveBeenCalledWith({ audioKey: "flyia-voice/test/voice.webm" });
      expect(document.querySelector('[data-testid="voice-transcript"]')?.textContent).toBe("Qual é meu próximo voo?");
      expect(stopTrack).toHaveBeenCalled();
    } finally {
      Reflect.set(globalThis, "MediaRecorder", originalMediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: originalMediaDevices });
      Reflect.set(globalThis, "fetch", originalFetch);
    }
  });

  it("explica em português quando a permissão de microfone é negada", async () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    const originalMediaDevices = navigator.mediaDevices;
    class SupportedMediaRecorder {
      static isTypeSupported() { return true; }
    }
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("bloqueado", "NotAllowedError"));

    Reflect.set(globalThis, "MediaRecorder", SupportedMediaRecorder);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });

    try {
      mount();
      const start = document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]');
      await act(async () => { start?.click(); await Promise.resolve(); });

      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(document.querySelector('[data-testid="voice-error"]')?.textContent)
        .toBe("Permita o uso do microfone para falar sua pergunta.");
      expect(document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]')).not.toBeNull();
    } finally {
      Reflect.set(globalThis, "MediaRecorder", originalMediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: originalMediaDevices });
    }
  });

  it("mantém a digitação disponível quando o navegador não suporta captura de voz", async () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    const originalMediaDevices = navigator.mediaDevices;

    Reflect.set(globalThis, "MediaRecorder", undefined);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });

    try {
      mount();
      const start = document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]');
      await act(async () => { start?.click(); });

      expect(document.querySelector('[data-testid="voice-error"]')?.textContent)
        .toBe("A gravação por microfone não é compatível com este navegador. Digite sua pergunta.");
      expect(document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]')).not.toBeNull();
    } finally {
      Reflect.set(globalThis, "MediaRecorder", originalMediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: originalMediaDevices });
    }
  });
});
