import { afterEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ geminiApiKey: "test-key" }));
vi.mock("./_core/env", () => ({ ENV: env }));

import {
  buildFlightMemorySummaryPayload,
  generateFlightMemorySummary,
  getFlightMemorySummaryFingerprint,
  projectFlightMemorySummaryContext,
} from "./memorySummaries";

const trip = {
  year: 2026,
  weekNumber: 12,
  departureDate: "2026-03-16",
  returnDate: "2026-03-20",
  totalKm: 1_024,
  completedKm: 512,
  futureKm: 512,
  memory: null,
  summary: null,
  segments: [
    {
      direction: "ida" as const,
      origin: "GRU",
      destination: "NVT",
      flightDatetime: "2026-03-16T08:00:00.000Z",
      airline: "Azul",
      flightNumber: "AD 1234",
      distanceKm: 512,
      status: "completed" as const,
    },
    {
      direction: "volta" as const,
      origin: "NVT",
      destination: "GRU",
      flightDatetime: "2026-03-20T18:00:00.000Z",
      airline: "Azul",
      flightNumber: "AD 1235",
      distanceKm: 512,
      status: "future" as const,
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("memory summaries", () => {
  it("projeta somente dados factuais necessários e calcula fingerprint estável", () => {
    const context = projectFlightMemorySummaryContext(trip);
    const serialized = JSON.stringify(context);

    expect(context.segments[0]).toMatchObject({
      origin: { code: "GRU" },
      destination: { code: "NVT" },
      status: "completed",
    });
    expect(serialized).not.toContain("AD 1234");
    expect(serialized).not.toContain("localizador");
    expect(getFlightMemorySummaryFingerprint(context)).toHaveLength(64);
    expect(getFlightMemorySummaryFingerprint(context)).toBe(
      getFlightMemorySummaryFingerprint(context)
    );
  });

  it("instrui o Gemini a devolver um resumo factual sem identificadores", () => {
    const payload = buildFlightMemorySummaryPayload(projectFlightMemorySummaryContext(trip));
    const instruction = payload.systemInstruction.parts[0].text;

    expect(instruction).toContain("Não invente acontecimentos");
    expect(instruction).toContain("localizadores");
    expect(payload.generationConfig.maxOutputTokens).toBe(260);
  });

  it("interpreta o texto e os metadados de uso devolvidos pelo Gemini", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Uma viagem entre Guarulhos e Navegantes." }] } }],
        usageMetadata: { promptTokenCount: 90, candidatesTokenCount: 20, totalTokenCount: 110 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateFlightMemorySummary(projectFlightMemorySummaryContext(trip))
    ).resolves.toEqual({
      text: "Uma viagem entre Guarulhos e Navegantes.",
      usage: { inputTokens: 90, outputTokens: 20, totalTokens: 110 },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("gemini-3.6-flash");
  });
});
