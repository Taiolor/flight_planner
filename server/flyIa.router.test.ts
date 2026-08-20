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

  class GeminiBudgetExceededError extends Error {
    constructor() {
      super("O limite interno de orçamento do Fly.IA foi alcançado.");
    }
  }

  return {
    validateAuthSession: vi.fn(),
    buildFlyIaContext: vi.fn(),
    askFlyIa: vi.fn(),
    getDeterministicFlyIaAnswer: vi.fn(),
    consume: vi.fn(),
    getGeminiBudgetSnapshot: vi.fn(),
    recordGeminiUsage: vi.fn(),
    FlyIaRateLimitError,
    FlyIaProviderError,
    GeminiBudgetExceededError,
  };
});

vi.mock("./db", () => ({
  validateAuthSession: state.validateAuthSession,
}));

vi.mock("./flyIa", () => ({
  buildFlyIaContext: state.buildFlyIaContext,
  askFlyIa: state.askFlyIa,
  getDeterministicFlyIaAnswer: state.getDeterministicFlyIaAnswer,
  FLY_IA_MODEL: "gemini-3.6-flash",
  flyIaRateLimiter: { consume: state.consume },
  createFlyIaRateLimiter: () => ({ consume: state.consume }),
  FlyIaRateLimitError: state.FlyIaRateLimitError,
  FlyIaProviderError: state.FlyIaProviderError,
}));

vi.mock("./geminiBudget", () => ({
  GeminiBudgetExceededError: state.GeminiBudgetExceededError,
  getGeminiBudgetDashboard: vi.fn(),
  getGeminiBudgetSnapshot: state.getGeminiBudgetSnapshot,
  recordGeminiUsage: state.recordGeminiUsage,
  updateGeminiBudgetSettings: vi.fn(),
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
  state.getDeterministicFlyIaAnswer.mockReset();
  state.consume.mockReset();
  state.getGeminiBudgetSnapshot.mockReset();
  state.recordGeminiUsage.mockReset();
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
    state.getGeminiBudgetSnapshot.mockResolvedValue({ isAtLimit: false });
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("converte falhas inesperadas em indisponibilidade com código de diagnóstico", async () => {
    state.getGeminiBudgetSnapshot.mockRejectedValue(new Error("database unavailable"));
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: expect.stringContaining("Código:"),
    });
  });

  it("bloqueia novas perguntas quando o teto interno já foi atingido", async () => {
    state.getGeminiBudgetSnapshot.mockResolvedValue({ isAtLimit: true });
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(state.buildFlyIaContext).not.toHaveBeenCalled();
    expect(state.askFlyIa).not.toHaveBeenCalled();
  });

  it("devolve a resposta do Gemini para uma sessão autorizada", async () => {
    const context = { exercicio: 2026, voosEmitidos: [] };
    state.buildFlyIaContext.mockResolvedValue(context);
    state.getDeterministicFlyIaAnswer.mockResolvedValue(null);
    state.getGeminiBudgetSnapshot.mockResolvedValue({ isAtLimit: false });
    state.askFlyIa.mockResolvedValue({
      text: "Seu próximo voo está previsto para amanhã.",
      usage: { inputTokens: 100, outputTokens: 30, totalTokens: 130 },
    });
    state.recordGeminiUsage.mockResolvedValue(undefined);
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).resolves.toEqual({
      response: "Seu próximo voo está previsto para amanhã.",
    });
    expect(state.buildFlyIaContext).toHaveBeenCalledWith(2026);
    expect(state.askFlyIa).toHaveBeenCalledWith(context, input.messages);
    expect(state.recordGeminiUsage).toHaveBeenCalledWith("gemini-3.6-flash", {
      inputTokens: 100,
      outputTokens: 30,
      totalTokens: 130,
    });
  });

  it("responde o próximo voo completo a partir dos dados persistidos sem chamar Gemini", async () => {
    state.getDeterministicFlyIaAnswer.mockResolvedValue({
      text: "**Próximo voo — ida**\n- **Data e hora:** 26/04/2026 às 22:05",
    });
    const caller = createCaller(true);

    await expect(caller.flyIa.chat(input)).resolves.toEqual({
      response: "**Próximo voo — ida**\n- **Data e hora:** 26/04/2026 às 22:05",
    });
    expect(state.getGeminiBudgetSnapshot).not.toHaveBeenCalled();
    expect(state.askFlyIa).not.toHaveBeenCalled();
  });
});
