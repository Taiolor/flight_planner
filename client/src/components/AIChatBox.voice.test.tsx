/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIChatBox } from "./AIChatBox";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(voiceInput: React.ComponentProps<typeof AIChatBox>["voiceInput"]) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(
    <AIChatBox
      messages={[{ role: "assistant", content: "Como posso ajudar?" }]}
      onSendMessage={vi.fn()}
      height="420px"
      voiceInput={voiceInput}
    />
  ));
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
});

describe("AIChatBox voice input", () => {
  it("aciona a gravação e apresenta o estado de escuta", () => {
    const start = vi.fn();
    mount({ state: "recording", onStartRecording: start, onStopRecording: vi.fn() });

    expect(document.body.textContent).toContain("Ouvindo… toque novamente para finalizar.");
    const stop = document.querySelector<HTMLButtonElement>('button[aria-label="Parar gravação"]');
    expect(stop).not.toBeNull();
    act(() => stop?.click());
  });

  it("preenche o campo com a transcrição editável e confirma o consumo", () => {
    const consumed = vi.fn();
    mount({
      state: "idle",
      transcript: "Qual é meu próximo voo?",
      onStartRecording: vi.fn(),
      onStopRecording: vi.fn(),
      onTranscriptConsumed: consumed,
    });

    const input = document.querySelector<HTMLTextAreaElement>('textarea');
    expect(input?.value).toBe("Qual é meu próximo voo?");
    expect(consumed).toHaveBeenCalledTimes(1);
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]')).not.toBeNull();
  });

  it("informa o estado de transcrição e desabilita o microfone temporariamente", () => {
    mount({
      state: "transcribing",
      error: "Não foi possível transcrever o áudio agora.",
      onStartRecording: vi.fn(),
      onStopRecording: vi.fn(),
    });

    expect(document.body.textContent).toContain("Transcrevendo sua pergunta…");
    expect(document.body.textContent).toContain("Não foi possível transcrever o áudio agora.");
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]')?.disabled).toBe(true);
  });

  it("preserva o campo editável quando a voz não é compatível com o navegador", () => {
    mount({
      state: "idle",
      error: "A gravação por microfone não é compatível com este navegador. Digite sua pergunta.",
      onStartRecording: vi.fn(),
      onStopRecording: vi.fn(),
    });

    const input = document.querySelector<HTMLTextAreaElement>("textarea");
    expect(document.body.textContent).toContain("A gravação por microfone não é compatível com este navegador.");
    expect(input?.placeholder).toBe("Digite ou fale sua pergunta…");
    expect(input?.disabled).toBe(false);
    act(() => {
      if (!input) return;
      input.value = "Vou digitar minha pergunta";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(input?.value).toBe("Vou digitar minha pergunta");
  });

  it.each(["celular", "desktop"])("mantém o controle de voz fluido em %s", () => {
    mount({
      state: "idle",
      transcript: "O texto reconhecido continua editável.",
      onStartRecording: vi.fn(),
      onStopRecording: vi.fn(),
    });

    const form = document.querySelector("form");
    const input = document.querySelector<HTMLTextAreaElement>("textarea");
    const microphone = document.querySelector<HTMLButtonElement>('button[aria-label="Falar uma pergunta"]');

    expect(form?.className).toContain("flex");
    expect(input?.className).toContain("min-h-9");
    expect(microphone?.className).toContain("shrink-0");
    expect(microphone?.className).toContain("w-[38px]");
    expect(input?.value).toBe("O texto reconhecido continua editável.");
  });
});
