import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  class FlyIaRateLimitError extends Error {
    constructor() {
      super("Muitas perguntas em pouco tempo. Aguarde um minuto e tente novamente.");
    }
  }

  class FlyIaProviderError extends Error {
    constructor() {
      super("O Fly.IA está indisponível no momento. Tente novamente em instantes.");
    }
  }

  return {
    validateAuthSession: vi.fn(),
    buildFlyIaContext: vi.fn(),
    askFlyIa: vi.fn(),
    consume: vi.fn(),
    FlyIaRateLimitError,
    FlyIaProviderError,
  };
});

vi.mock("./db", () => ({
  validateAuthSession: state.validateAuthSession,
}));

vi.mock("./flyIa", () => ({
  buildFlyIaContext: state.buildFlyIaContext,
  askFlyIa: state.askFlyIa,
  flyIaRateLimiter: { consume: state.consume },
  FlyIaRateLimitError: state.FlyIaRateLimitError,
  FlyIaProviderError: state.FlyIaProviderError,
}));

import { appRouter } from "./routers";

function createCaller(authenticated = true) {
  state.validateAuthSession.mockResolvedValue(
    authenticated ? { email: "piloto@smartfly.test", role: "user" } : null
  );

  return appRouter.createCaller({
    user: null,
    req: {
      headers: authenticated ? { cookie: "flight_session=valid-session" } : {},
    },
    res: {},
  } as any);
}

const input = {
  year: 2026,
  messages: [{ role: "user" as const, content: "Qual é meu próximo voo?" }],
};

afterEach(() => {
  state.validateAuthSession.mockReset();
  state.buildFlyIaContext.mockReset();
  state.askFlyIa.mockReset();
  state.consume.mockReset();
});

describe("flyIa.chat", () => {
  it("rejeita visitantes sem sessão interna", async () => {
    const caller = createCaller(false);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(state.buildFlyIaContext).not.toHaveBeenCalled();
  });

  it("mapeia o rate limit para TOO_MANY_REQUESTS", async () => {
    state.consume.mockImplementation(() => {
      throw new state.FlyIaRateLimitError();
    });
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(state.consume).toHaveBeenCalledWith("piloto@smartfly.test");
  });

  it("mapeia indisponibilidade do Gemini para SERVICE_UNAVAILABLE", async () => {
    state.buildFlyIaContext.mockResolvedValue({ exercicio: 2026 });
    state.askFlyIa.mockRejectedValue(new state.FlyIaProviderError());
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("devolve a resposta do Gemini para uma sessão autorizada", async () => {
    const context = { exercicio: 2026, voosEmitidos: [] };
    state.buildFlyIaContext.mockResolvedValue(context);
    state.askFlyIa.mockResolvedValue("Seu próximo voo está previsto para amanhã.");
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).resolves.toEqual({
      response: "Seu próximo voo está previsto para amanhã.",
    });
    expect(state.buildFlyIaContext).toHaveBeenCalledWith(2026);
    expect(state.askFlyIa).toHaveBeenCalledWith(context, input.messages);
  });
});
