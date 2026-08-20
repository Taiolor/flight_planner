/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../../../server/routers";
import { createAuthSession, deleteAuthSession } from "../../../server/db";
import { ENV } from "../../../server/_core/env";

const state = vi.hoisted(() => ({
  options: null as any,
  completion: null as Promise<void> | null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightAuth: { check: { useQuery: () => ({ data: { authenticated: true } }) } },
    flyIa: {
      chat: {
        useMutation: (options: unknown) => ({
          isPending: false,
          mutate: (input: { year: number; messages: Array<{ role: "user" | "assistant"; content: string }> }) => {
            state.completion = (async () => {
              const token = await createAuthSession(ENV.authEmail!);
              try {
                const caller = appRouter.createCaller({
                  user: null,
                  req: { headers: { cookie: `flight_session=${token}` } },
                  res: {},
                } as never);
                const result = await caller.flyIa.chat(input);
                (options as { onSuccess: (result: { response: string }) => void }).onSuccess(result);
              } catch (error) {
                (options as { onError: (error: Error) => void }).onError(error as Error);
              } finally {
                await deleteAuthSession(token);
              }
            })();
          },
        }),
      },
    },
  },
}));

vi.mock("./AIChatBox", () => ({
  AIChatBox: ({ messages, onSendMessage }: { messages: Array<{ role: string; content: string }>; onSendMessage: (content: string) => void }) => (
    <div>
      <button type="button" onClick={() => onSendMessage("Qual é meu próximo voo?")}>Enviar pergunta real</button>
      <button type="button" onClick={() => onSendMessage("Quais são os detalhes?")}>Pedir detalhes reais</button>
      {messages.map((message, index) => <p key={index} data-role={message.role}>{message.content}</p>)}
    </div>
  ),
}));
vi.mock("@/contexts/YearContext", () => ({ useYear: () => ({ selectedYear: 2026 }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import FlyIA from "./FlyIA";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function expectCompleteFlightCard(response: string) {
  expect(response).toContain("Data e hora:");
  expect(response).toContain("Rota:");
  expect(response).toContain("Companhia:");
  expect(response).toContain("Voo:");
  expect(response).toContain("Terminal:");
  expect(response).toContain("Status:");
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  state.options = null;
  state.completion = null;
  document.body.replaceChildren();
});

describe("Fly.IA real authenticated flow", () => {
  it.runIf(Boolean(process.env.RUN_REAL_GEMINI_E2E))("renderiza detalhes completos do próximo voo e do seguimento por tRPC real", async () => {
    expect(ENV.authEmail).toBeTruthy();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root?.render(<FlyIA />);
    });
    await act(async () => {
      document.querySelector<HTMLButtonElement>('button[aria-label="Abrir Fly.IA"]')?.click();
    });
    await act(async () => {
      Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
        .find(button => button.textContent === "Enviar pergunta real")
        ?.click();
      await state.completion;
    });
    const firstAssistantResponse = document.querySelectorAll<HTMLElement>('[data-role="assistant"]');
    expect(firstAssistantResponse).toHaveLength(1);
    expectCompleteFlightCard(firstAssistantResponse[0]?.textContent ?? "");
    await act(async () => {
      Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
        .find(button => button.textContent === "Pedir detalhes reais")
        ?.click();
      await state.completion;
    });

    const text = document.body.textContent ?? "";
    expect(text).toContain("Qual é meu próximo voo?");
    expect(text).toContain("Quais são os detalhes?");
    expect(text).not.toContain("Não consegui responder agora.");
    const assistantResponses = document.querySelectorAll<HTMLElement>('[data-role="assistant"]');
    expect(assistantResponses).toHaveLength(2);
    assistantResponses.forEach(response => expectCompleteFlightCard(response.textContent ?? ""));
  }, 60_000);
});
