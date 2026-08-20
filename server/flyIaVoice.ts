import type { Request, Response } from "express";
import { getSessionFromCookie } from "./flightAuthMiddleware";
import { transcribeAudioBuffer } from "./_core/voiceTranscription";

const VOICE_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
]);

/**
 * Processa a gravação somente em memória e a encaminha ao Whisper. O buffer
 * é sobrescrito ao término da requisição, sem criar chave ou objeto no storage.
 */
export async function transcribeFlyIaVoice(req: Request, res: Response) {
  try {
    const session = await getSessionFromCookie(req);
    if (!session) {
      res.status(401).json({ error: "Faça login para usar a entrada por voz." });
      return;
    }

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
      res.status(result.code === "FILE_TOO_LARGE" ? 413 : 503).json({
        error: "Não foi possível transcrever o áudio agora. Tente novamente.",
      });
      return;
    }

    const text = result.text.trim().replace(/\s+/g, " ").slice(0, 1200);
    if (!text) {
      res.status(400).json({ error: "Não foi possível identificar uma pergunta no áudio." });
      return;
    }
    res.status(200).json({ text, language: result.language });
  } catch (error) {
    console.error("[Fly.IA Voice] Falha na transcrição em memória", error);
    res.status(500).json({ error: "Não foi possível transcrever o áudio agora. Tente novamente." });
  } finally {
    if (Buffer.isBuffer(req.body)) req.body.fill(0);
  }
}
