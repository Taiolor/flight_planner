import { describe, expect, it } from "vitest";

const GEMINI_MODEL = "gemini-2.5-flash";

describe("Gemini API configuration", () => {
  it("authenticates the server credential against the selected model metadata", async () => {
    const apiKey = process.env.GEMINI_API_KEY;

    expect(apiKey, "GEMINI_API_KEY deve estar configurada no ambiente do servidor").toBeTruthy();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${encodeURIComponent(apiKey!)}`,
      { signal: AbortSignal.timeout(10_000) }
    );

    expect(response.status).toBe(200);

    const model = (await response.json()) as { name?: string };
    expect(model.name).toContain(GEMINI_MODEL);
  });
});
