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

describe("AIChatBox cartão meteorológico", () => {
  it("exibe condição, temperatura, chuva, vento e fonte de forma acessível", () => {
    mount([{
      role: "assistant",
      content: "A previsão está disponível.",
      weather: {
        destinationLabel: "Navegantes", forecastDate: "2026-04-26", summary: "Chuva fraca",
        temperatureMinC: 18, temperatureMaxC: 24, precipitationProbability: 60, windSpeedKmh: 22,
        sourceLabel: "Open-Meteo", sourceUrl: "https://open-meteo.com/", travelLeg: "Volta",
        precipitationAlert: "Atenção: há condição de chuva intensa na previsão.",
        packingGuidance: ["guarda-chuva compacto ou capa leve", "casaco leve para manhã ou noite"],
      },
    }]);

    const card = document.querySelector("[data-testid='flyia-weather-card']");
    expect(card?.textContent).toContain("Clima em Navegantes");
    expect(card?.textContent).toContain("18–24 °C");
    expect(card?.textContent).toContain("60%");
    expect(card?.textContent).toContain("22 km/h");
    expect(card?.textContent).toContain("Volta · 26/04/2026");
    expect(document.querySelector("[data-testid='flyia-weather-alert']")?.textContent).toContain("chuva intensa");
    expect(document.querySelector("[data-testid='flyia-weather-packing']")?.textContent).toContain("guarda-chuva compacto");
    const source = card?.querySelector<HTMLAnchorElement>("a");
    expect(source?.href).toBe("https://open-meteo.com/");
    expect(source?.rel).toContain("noopener");
  });

  it("não apresenta cartão visual em mensagens comuns", () => {
    mount([{ role: "assistant", content: "Seu próximo voo parte às 22:05." }]);
    expect(document.querySelector("[data-testid='flyia-weather-card']")).toBeNull();
  });
});
