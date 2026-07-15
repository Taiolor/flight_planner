import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribeAudio } from "../voiceTranscription";

describe("voiceTranscription", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle unexpected errors during transcription correctly", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiUrl: "https://mock-forge-api.com",
        forgeApiKey: "mock-key",
      },
    }));

    const { transcribeAudio } = await import("../voiceTranscription");

    // The fetch in step 2 correctly fetches the audio, then step 4 fails on FormData due to some unexpected issue
    // Wait, the only way to hit the outer catch block is if fetch doesn't throw but something else does, OR we stub FormData
    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('audio.mp3')) {
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
          headers: new Map([['content-type', 'audio/mpeg']]),
        };
      }
      return Promise.reject(new Error("Simulated unexpected network error"));
    });

    const result = await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
    });

    expect(result).toEqual({
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: "Simulated unexpected network error",
    });
  });

  it("should handle unexpected non-Error throws correctly", async () => {
    vi.doMock("../env", () => ({
      ENV: {
        forgeApiUrl: "https://mock-forge-api.com",
        forgeApiKey: "mock-key",
      },
    }));

    const { transcribeAudio } = await import("../voiceTranscription");

    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('audio.mp3')) {
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
          headers: new Map([['content-type', 'audio/mpeg']]),
        };
      }
      return Promise.reject("String error");
    });

    const result = await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
    });

    expect(result).toEqual({
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: "An unexpected error occurred",
    });
  });
});
