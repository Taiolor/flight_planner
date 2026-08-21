/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIChatBox } from "./AIChatBox";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(messages: React.ComponentProps<typeof AIChatBox>["messages"]) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(<AIChatBox messages={messages} onSendMessage={vi.fn()} height="420px" />));
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.replaceChildren();
});

describe("AIChatBox action de rota", () => {
  it("exibe o botão de rota com nova aba e proteção de referência", () => {
    mount([{
      role: "assistant",
      content: "A estimativa é de 1 h 10 min.",
      action: {
        label: "Ver rota no mapa",
        href: "https://www.google.com/maps/dir/?api=1&origin=Paulista&destination=GRU&travelmode=driving",
        ariaLabel: "Abrir rota até o aeroporto no Google Maps",
      },
    }]);

    const action = document.querySelector<HTMLAnchorElement>("[data-testid='flyia-map-route-action']");
    expect(action?.textContent).toContain("Ver rota no mapa");
    expect(action?.target).toBe("_blank");
    expect(action?.rel).toContain("noopener");
    expect(action?.href).toContain("origin=Paulista");
  });

  it("não apresenta botão quando a resposta não contém uma ação de rota validada", () => {
    mount([{ role: "assistant", content: "Seu próximo voo parte às 22:05." }]);
    expect(document.querySelector("[data-testid='flyia-map-route-action']")).toBeNull();
  });
});
