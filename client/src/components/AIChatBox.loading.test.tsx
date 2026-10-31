/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIChatBox } from "./AIChatBox";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("AIChatBox loading skeleton", () => {
  it("exibe um skeleton acessível enquanto a resposta está pendente", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "user", content: "Qual é meu próximo voo?" }]}
          onSendMessage={() => undefined}
          isLoading
          height="360px"
        />
      );
    });

    const skeleton = document.querySelector('[data-testid="assistant-response-skeleton"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute("role")).toBe("status");
    expect(skeleton?.getAttribute("aria-live")).toBe("polite");
    expect(skeleton?.textContent).toContain("Analisando sua pergunta…");
    expect(skeleton?.textContent).toContain("Isso pode levar alguns segundos.");
    expect(skeleton?.getAttribute("aria-label")).toContain("Analisando sua pergunta…");
    expect(skeleton?.textContent).not.toContain("%");
    expect(skeleton?.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });

  it("alterna a explicação de processamento sem prometer um percentual", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "user", content: "Como estará o clima?" }]}
          onSendMessage={() => undefined}
          isLoading
          height="360px"
        />
      );
    });

    act(() => vi.advanceTimersByTime(2_400));
    expect(document.body.textContent).toContain("Consultando informações da viagem…");
    expect(document.querySelectorAll('[class*="motion-reduce:animate-none"]').length).toBeGreaterThan(3);
  });

  it("remove o skeleton quando não há resposta pendente", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "assistant", content: "Pronto para ajudar." }]}
          onSendMessage={() => undefined}
          isLoading={false}
          height="360px"
        />
      );
    });

    expect(document.querySelector('[data-testid="assistant-response-skeleton"]')).toBeNull();
  });

  it("mantém o skeleton fluido em celular e limitado para leitura em desktop", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "user", content: "Quais são os detalhes?" }]}
          onSendMessage={() => undefined}
          isLoading
          height="360px"
        />
      );
    });

    const skeleton = document.querySelector<HTMLElement>('[data-testid="assistant-response-skeleton"]');
    const responseBubble = skeleton?.querySelector<HTMLElement>(".w-\\[min\\(80\\%\\,17rem\\)\\]");
    expect(responseBubble?.className).toContain("w-[min(80%,17rem)]");
    expect(responseBubble?.className).toContain("rounded-lg");
    responseBubble?.querySelectorAll<HTMLElement>('[data-slot="skeleton"]').forEach(line => {
      expect(line.className).toContain("motion-reduce:animate-none");
    });
  });

  it.each([
    { name: "celular", viewportWidth: 320, expectedAvailableWidth: 256 },
    { name: "desktop", viewportWidth: 1280, expectedAvailableWidth: 272 },
  ])("preserva a largura legível do skeleton em $name", ({ viewportWidth, expectedAvailableWidth }) => {
    host = document.createElement("div");
    host.style.width = `${viewportWidth}px`;
    document.body.appendChild(host);
    root = createRoot(host);

    act(() => {
      root?.render(
        <AIChatBox
          messages={[{ role: "user", content: "Aguarde a resposta." }]}
          onSendMessage={() => undefined}
          isLoading
          height="360px"
        />
      );
    });

    const skeleton = document.querySelector<HTMLElement>('[data-testid="assistant-response-skeleton"]');
    const responseBubble = Array.from(skeleton?.children ?? []).find(element =>
      (element as HTMLElement).className.includes("w-[min(80%,17rem)]")
    ) as HTMLElement | undefined;
    const expectedCssWidth = `min(80%,17rem)`;

    expect(host.style.width).toBe(`${viewportWidth}px`);
    expect(responseBubble?.className).toContain(`w-[${expectedCssWidth}]`);
    expect(expectedAvailableWidth).toBe(Math.min(viewportWidth * 0.8, 272));
    expect(responseBubble?.className).not.toContain("min-w-");
  });
});
