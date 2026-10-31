import { describe, expect, it } from "vitest";
import { createAuthSession, deleteAuthSession } from "./db";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

const GEMINI_MODEL = "gemini-3.6-flash";
const runLiveGeminiTest = process.env.RUN_LIVE_GEMINI_TESTS === "true" ? it : it.skip;

describe("Gemini API configuration", () => {
  runLiveGeminiTest("authenticates the server credential and receives a text candidate from the selected model", async () => {
    const apiKey = process.env.GEMINI_API_KEY;

    expect(apiKey, "GEMINI_API_KEY deve estar configurada no ambiente do servidor").toBeTruthy();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Responda apenas: ok" }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 64,
            responseMimeType: "text/plain",
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    expect(response.status).toBe(200);

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      modelVersion?: string;
    };
    expect(result.modelVersion).toContain(GEMINI_MODEL);
    expect(result.candidates?.[0]?.content?.parts?.[0]?.text?.trim()).toBeTruthy();
  }, 30_000);

  it("conclui uma pergunta autenticada do Fly.IA pela mutation tRPC", async () => {
    expect(ENV.authEmail, "AUTH_EMAIL deve estar configurado para a reprodução autenticada").toBeTruthy();
    const token = await createAuthSession(ENV.authEmail!);

    try {
      const caller = appRouter.createCaller({
        user: null,
        req: { headers: { cookie: `flight_session=${token}` } },
        res: {},
      } as never);
      const result = await caller.flyIa.chat({
        year: 2026,
        messages: [{ role: "user", content: "Qual é meu próximo voo?" }],
      });

      expect(result.response.trim()).toBeTruthy();
    } finally {
      await deleteAuthSession(token);
    }
  }, 60_000);
});
