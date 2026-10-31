// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIChatBox } from "./AIChatBox";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
});

describe("AIChatBox follow-up prompts", () => {
  it("exibe chips acessíveis após a resposta e envia a pergunta selecionada", () => {
    const onSendMessage = vi.fn();
    const onFollowUpPromptSelected = vi.fn();
    host = document.createElement("div");
    host.style.width = "320px";
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "assistant", content: "Seu próximo voo sai às 22:05." }]}
          onSendMessage={onSendMessage}
          onFollowUpPromptSelected={onFollowUpPromptSelected}
          followUpPrompts={() => ["Quais são os detalhes do próximo voo?", "Há algum voo cancelado?"]}
          height="360px"
        />
      );
    });

    const chip = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .find(button => button.textContent === "Quais são os detalhes do próximo voo?");
    expect(chip?.getAttribute("aria-label")).toBe("Perguntar: Quais são os detalhes do próximo voo?");
    expect(chip?.parentElement?.className).toContain("flex-wrap");

    act(() => chip?.click());
    expect(onSendMessage).toHaveBeenCalledWith("Quais são os detalhes do próximo voo?");
    expect(onFollowUpPromptSelected).toHaveBeenCalledWith("Quais são os detalhes do próximo voo?");
    expect(document.activeElement?.tagName).toBe("TEXTAREA");
  });

  it("oculta as sugestões enquanto uma nova resposta está pendente", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "assistant", content: "Resposta anterior." }]}
          onSendMessage={() => undefined}
          followUpPrompts={() => ["Continuar a conversa"]}
          isLoading
          height="360px"
        />
      );
    });

    expect(document.body.textContent).not.toContain("Continuar a conversa");
  });

  it.each([
    { label: "celular", width: 320 },
    { label: "desktop", width: 1280 },
  ])("mantém os chips fluidos e com quebra de linha em $label", ({ width }) => {
    host = document.createElement("div");
    host.style.width = `${width}px`;
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "assistant", content: "Resposta de planejamento." }]}
          onSendMessage={() => undefined}
          followUpPrompts={() => ["Qual é meu próximo voo?", "Quais cidades estão no planejamento?", "Há algum voo cancelado ou remarcado?"]}
          height="360px"
        />
      );
    });

    const container = document.querySelector<HTMLElement>('[data-testid="follow-up-prompts"]');
    const chip = container?.querySelector<HTMLElement>("button");
    expect(host.style.width).toBe(`${width}px`);
    expect(container?.className).toContain("w-full");
    expect(container?.className).toContain("flex-wrap");
    expect(chip?.className).toContain("max-w-full");
  });
});
