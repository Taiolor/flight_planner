import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getSessionFromCookie: vi.fn(),
  transcribeAudioBuffer: vi.fn(),
  recordFlyIaVoiceUsage: vi.fn(),
}));

vi.mock("./flightAuthMiddleware", () => ({ getSessionFromCookie: state.getSessionFromCookie }));
vi.mock("./_core/voiceTranscription", () => ({ transcribeAudioBuffer: state.transcribeAudioBuffer }));
vi.mock("./flyIaVoiceTelemetry", () => ({ recordFlyIaVoiceUsage: state.recordFlyIaVoiceUsage }));

import { transcribeFlyIaVoice } from "./flyIaVoice";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

afterEach(() => {
  state.getSessionFromCookie.mockReset();
  state.transcribeAudioBuffer.mockReset();
  state.recordFlyIaVoiceUsage.mockReset();
  state.recordFlyIaVoiceUsage.mockResolvedValue(true);
});

describe("transcribeFlyIaVoice", () => {
  it("requer a sessão interna antes de receber áudio", async () => {
    state.getSessionFromCookie.mockResolvedValue(null);
    const response = createResponse();

    await transcribeFlyIaVoice({ body: Buffer.from("audio"), headers: { "content-type": "audio/webm" } } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(state.transcribeAudioBuffer).not.toHaveBeenCalled();
  });

  it("recusa formato não permitido sem chamar Whisper", async () => {
    state.getSessionFromCookie.mockResolvedValue({ email: "piloto@smartfly.test" });
    const response = createResponse();

    await transcribeFlyIaVoice({ body: Buffer.from("audio"), headers: { "content-type": "text/plain" } } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(state.transcribeAudioBuffer).not.toHaveBeenCalled();
  });

  it("encaminha o buffer em memória ao Whisper e o sobrescreve após a resposta", async () => {
    state.getSessionFromCookie.mockResolvedValue({ email: "piloto@smartfly.test" });
    state.transcribeAudioBuffer.mockResolvedValue({ text: "  Qual é meu próximo voo?\n", language: "pt", duration: 1, segments: [] });
    const body = Buffer.from("audio-secreto");
    const response = createResponse();

    await transcribeFlyIaVoice({ body, headers: { "content-type": "audio/webm;codecs=opus", "x-flyia-audio-duration-ms": "1250" } } as any, response as any);

    expect(state.transcribeAudioBuffer).toHaveBeenCalledWith(expect.objectContaining({
      audio: body,
      mimeType: "audio/webm",
      language: "pt",
    }));
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ text: "Qual é meu próximo voo?", language: "pt" });
    expect(state.recordFlyIaVoiceUsage).toHaveBeenCalledWith(expect.objectContaining({
      durationMs: 1000,
      audioBytes: "audio-secreto".length,
      outcome: "transcribed",
    }));
    expect([...body]).toEqual(new Array(body.length).fill(0));
  });

  it("devolve falha segura e sobrescreve o buffer quando Whisper está indisponível", async () => {
    state.getSessionFromCookie.mockResolvedValue({ email: "piloto@smartfly.test" });
    state.transcribeAudioBuffer.mockResolvedValue({ error: "indisponível", code: "SERVICE_ERROR" });
    const body = Buffer.from("audio-secreto");
    const response = createResponse();

    await transcribeFlyIaVoice({ body, headers: { "content-type": "audio/ogg" } } as any, response as any);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({ error: "Não foi possível transcrever o áudio agora. Tente novamente." });
    expect(state.recordFlyIaVoiceUsage).toHaveBeenCalledWith(expect.objectContaining({
      audioBytes: "audio-secreto".length,
      outcome: "provider_error",
    }));
    expect([...body]).toEqual(new Array(body.length).fill(0));
  });
});
