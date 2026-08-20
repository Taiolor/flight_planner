import { describe, expect, it } from "vitest";

const GEMINI_MODEL = "gemini-3.6-flash";

describe("Gemini API configuration", () => {
  it("authenticates the server credential and receives a text candidate from the selected model", async () => {
    const apiKey = process.env.GEMINI_API_KEY;

    expect(apiKey, "GEMINI_API_KEY deve estar configurada no ambiente do servidor").toBeTruthy();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Responda apenas: ok" }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 128, responseMimeType: "text/plain" },
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
  });
});
