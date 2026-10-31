import type { Request, Response } from "express";
import { getSessionFromCookie } from "./flightAuthMiddleware";
import { transcribeAudioBuffer } from "./_core/voiceTranscription";
import { recordFlyIaVoiceUsage, type FlyIaVoiceOutcome } from "./flyIaVoiceTelemetry";

const VOICE_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
]);

function readDurationMs(req: Request) {
  const value = Number(req.headers["x-flyia-audio-duration-ms"]);
  return Number.isFinite(value) ? Math.max(0, Math.min(60_000, Math.round(value))) : 0;
}

/**
 * Processa a gravação somente em memória e a encaminha ao Whisper. O buffer
 * é sobrescrito ao término da requisição, sem criar chave ou objeto no storage.
 */
export async function transcribeFlyIaVoice(req: Request, res: Response) {
  const startedAt = Date.now();
  const audioBytes = Buffer.isBuffer(req.body) ? req.body.length : 0;
  let shouldRecordUsage = false;
  let durationMs = readDurationMs(req);
  let outcome: FlyIaVoiceOutcome = "rejected";

  try {
    const session = await getSessionFromCookie(req);
    if (!session) {
      res.status(401).json({ error: "Faça login para usar a entrada por voz." });
      return;
    }
    shouldRecordUsage = true;

    const mimeType = String(req.headers["content-type"] ?? "").toLowerCase().split(";", 1)[0];
    if (!VOICE_MIME_TYPES.has(mimeType) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "Formato de áudio não suportado." });
      return;
    }

    const result = await transcribeAudioBuffer({
      audio: req.body,
      mimeType,
      language: "pt",
      prompt: "Transcreva em português do Brasil a pergunta curta do usuário sobre viagens. Retorne somente o texto falado.",
    });
    if ("error" in result) {
      outcome = result.code === "FILE_TOO_LARGE" ? "rejected" : "provider_error";
      res.status(result.code === "FILE_TOO_LARGE" ? 413 : 503).json({
        error: "Não foi possível transcrever o áudio agora. Tente novamente.",
      });
      return;
    }

    const providerDurationMs = Math.round(Number(result.duration) * 1000);
    if (Number.isFinite(providerDurationMs) && providerDurationMs > 0) {
      durationMs = Math.min(60_000, providerDurationMs);
    }

    const text = result.text.trim().replace(/\s+/g, " ").slice(0, 1200);
    if (!text) {
      outcome = "empty";
      res.status(400).json({ error: "Não foi possível identificar uma pergunta no áudio." });
      return;
    }

    outcome = "transcribed";
    res.status(200).json({ text, language: result.language });
  } catch (error) {
    outcome = "provider_error";
    console.error("[Fly.IA Voice] Falha na transcrição em memória", error);
    res.status(500).json({ error: "Não foi possível transcrever o áudio agora. Tente novamente." });
  } finally {
    if (shouldRecordUsage) {
      await recordFlyIaVoiceUsage({
        durationMs,
        audioBytes,
        latencyMs: Date.now() - startedAt,
        outcome,
      });
    }
    if (Buffer.isBuffer(req.body)) req.body.fill(0);
  }
}
