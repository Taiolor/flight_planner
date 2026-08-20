import { AIChatBox } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginRequiredMessageBox } from "@/components/auth/LoginRequiredMessageBox";
import { useYear } from "@/contexts/YearContext";
import { trpc } from "@/lib/trpc";
import {
  clearFlyIaSuggestionTopic,
  FLY_IA_SUGGESTION_TOPIC_LABELS,
  getFlyIaDominantSuggestionTopic,
  getFlyIaFollowUpPrompts,
  recordFlyIaSuggestionPreference,
  type FlyIaSuggestionMode,
  type FlyIaSuggestionPreferences,
} from "@/lib/flyIaSuggestions";
import { Bot, Compass, Info, MessageCircle, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Qual é meu próximo voo?",
  "Há algum voo cancelado?",
  "Quanto já foi gasto em passagens?",
  "Quais cidades estão no planejamento?",
];

type FlyIaClientMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_VOICE_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_VOICE_RECORDING_MS = 60_000;

function chooseAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
    .find(mimeType => MediaRecorder.isTypeSupported(mimeType));
}

export default function FlyIA() {
  const { selectedYear } = useYear();
  const [open, setOpen] = useState(false);
  const [showLoginRequiredMessage, setShowLoginRequiredMessage] = useState(false);
  const [messages, setMessages] = useState<FlyIaClientMessage[]>([]);
  const [suggestionPreferences, setSuggestionPreferences] = useState<FlyIaSuggestionPreferences>({});
  const [personalizedSuggestionsEnabled, setPersonalizedSuggestionsEnabled] = useState(true);
  const [suggestionCount, setSuggestionCount] = useState<2 | 3>(3);
  const [suggestionMode, setSuggestionMode] = useState<FlyIaSuggestionMode>("affinity");
  const [showSuggestionHelp, setShowSuggestionHelp] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const internalSessionQuery = trpc.flightAuth.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const chatMutation = trpc.flyIa.chat.useMutation({
    onSuccess: result => {
      setMessages(current => [
        ...current,
        { role: "assistant", content: result.response },
      ]);
    },
    onError: error => {
      const message = error.message || "Não foi possível consultar o Fly.IA.";
      setMessages(current => [
        ...current,
        {
          role: "assistant",
          content: `Não consegui responder agora. ${message}`,
        },
      ]);
      toast.error(message);
    },
  });

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    clearRecordingTimer();
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }, [clearRecordingTimer]);

  const startVoiceRecording = useCallback(async () => {
    setVoiceError(null);
    setVoiceTranscript(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("A gravação por microfone não é compatível com este navegador. Digite sua pergunta.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = chooseAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        setVoiceState("idle");
        setVoiceError("A gravação de voz foi interrompida. Tente novamente.");
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
        const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (audio.size === 0) {
          setVoiceState("idle");
          setVoiceError("Não foi possível capturar áudio. Tente novamente.");
          return;
        }
        if (audio.size > MAX_VOICE_AUDIO_BYTES) {
          setVoiceState("idle");
          setVoiceError("O áudio excede o limite de 5 MB. Faça uma pergunta mais curta.");
          return;
        }

        setVoiceState("transcribing");
        try {
          const transcriptionResponse = await fetch("/api/flyia/voice-transcribe", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": audio.type || "audio/webm" },
            body: audio,
          });
          const transcription = await transcriptionResponse.json().catch(() => ({}));
          if (!transcriptionResponse.ok || typeof transcription.text !== "string") {
            throw new Error(transcription.error || "Não foi possível transcrever o áudio agora.");
          }
          setVoiceTranscript(transcription.text);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Não foi possível transcrever o áudio agora.";
          setVoiceError(message);
          toast.error(message);
        } finally {
          setVoiceState("idle");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setVoiceState("recording");
      recordingTimerRef.current = window.setTimeout(() => {
        setVoiceError("A gravação foi limitada a 60 segundos.");
        stopVoiceRecording();
      }, MAX_VOICE_RECORDING_MS);
    } catch (error) {
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      setVoiceError(denied ? "Permita o uso do microfone para falar sua pergunta." : "Não foi possível acessar o microfone. Tente novamente.");
      setVoiceState("idle");
    }
  }, [stopVoiceRecording]);

  useEffect(() => () => {
    clearRecordingTimer();
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }, [clearRecordingTimer]);

  useEffect(() => {
    setMessages([]);
    setSuggestionPreferences({});
    setSuggestionCount(3);
    setSuggestionMode("affinity");
    setShowSuggestionHelp(false);
    setVoiceTranscript(null);
    setVoiceError(null);
  }, [selectedYear]);

  const sendMessage = useCallback(
    (content: string) => {
      const userMessage: FlyIaClientMessage = { role: "user", content };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      chatMutation.mutate({ year: selectedYear, messages: nextMessages });
    },
    [chatMutation, messages, selectedYear]
  );

  const isInternalSessionAuthenticated =
    internalSessionQuery.data?.authenticated ?? false;
  const dominantSuggestionTopic = useMemo(
    () => getFlyIaDominantSuggestionTopic(suggestionPreferences),
    [suggestionPreferences]
  );
  const suggestionsAreAdapted = personalizedSuggestionsEnabled && dominantSuggestionTopic !== null;

  const openFlyIa = () => {
    if (!isInternalSessionAuthenticated) {
      setShowLoginRequiredMessage(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={openFlyIa}
        className="fixed bottom-4 right-4 z-40 h-11 rounded-full bg-slate-900 px-3.5 text-white shadow-lg shadow-slate-900/20 transition-transform duration-150 hover:bg-slate-800 active:scale-[0.97] dark:bg-blue-600 dark:hover:bg-blue-500"
        aria-label="Abrir Fly.IA"
        title="Abrir Fly.IA"
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        <span className="ml-2 text-sm font-semibold">Fly.IA</span>
      </Button>

      {isInternalSessionAuthenticated && <DialogContent
        showCloseButton={false}
        className="fixed bottom-20 left-3 right-3 top-auto z-50 h-[min(660px,calc(100dvh-6.5rem))] w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl data-[state=open]:slide-in-from-bottom-4 sm:left-auto sm:right-5 sm:w-[430px] dark:border-slate-700"
      >
        <DialogHeader className="flex-row items-start gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 pr-2 text-left dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base text-slate-950 dark:text-slate-50">
              Fly.IA
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Assistente do planejamento de {selectedYear}
            </DialogDescription>
            <div className="mt-1 flex flex-wrap items-center gap-1.5" data-testid="flyia-suggestion-controls">
              {suggestionsAreAdapted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300" data-testid="flyia-adapted-suggestions-indicator">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Sugestões adaptadas: {FLY_IA_SUGGESTION_TOPIC_LABELS[dominantSuggestionTopic]}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => setPersonalizedSuggestionsEnabled(current => !current)}
                aria-pressed={personalizedSuggestionsEnabled}
                aria-label={personalizedSuggestionsEnabled ? "Desativar sugestões personalizadas" : "Ativar sugestões personalizadas"}
                title={personalizedSuggestionsEnabled ? "Desativar sugestões personalizadas" : "Ativar sugestões personalizadas"}
              >
                <SlidersHorizontal className="mr-1 h-3 w-3" aria-hidden="true" />
                {personalizedSuggestionsEnabled ? "Personalizar" : "Personalização pausada"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => setSuggestionMode(current => current === "affinity" ? "explore" : "affinity")}
                aria-pressed={suggestionMode === "explore"}
                aria-label={suggestionMode === "explore" ? "Ativar modo afinidade" : "Ativar modo explorar"}
                title={suggestionMode === "explore" ? "Voltar ao modo afinidade" : "Explorar temas variados"}
              >
                <Compass className="mr-1 h-3 w-3" aria-hidden="true" />
                {suggestionMode === "explore" ? "Explorar" : "Afinidade"}
              </Button>
              <label className="inline-flex h-6 items-center gap-1 px-1 text-[10px] text-slate-500" htmlFor="flyia-suggestion-count">
                Mostrar
                <select
                  id="flyia-suggestion-count"
                  aria-label="Quantidade de sugestões"
                  className="h-5 rounded border border-slate-200 bg-white px-1 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  value={suggestionCount}
                  onChange={event => setSuggestionCount(Number(event.target.value) as 2 | 3)}
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => setShowSuggestionHelp(current => !current)}
                aria-expanded={showSuggestionHelp}
                aria-controls="flyia-suggestion-help"
                aria-label="Como funcionam as sugestões"
                title="Como funcionam as sugestões"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              {dominantSuggestionTopic && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  onClick={() => setSuggestionPreferences(current => clearFlyIaSuggestionTopic(current, dominantSuggestionTopic))}
                  aria-label={`Redefinir tema preferido: ${FLY_IA_SUGGESTION_TOPIC_LABELS[dominantSuggestionTopic]}`}
                  title={`Redefinir tema: ${FLY_IA_SUGGESTION_TOPIC_LABELS[dominantSuggestionTopic]}`}
                >
                  <RotateCcw className="mr-1 h-3 w-3" aria-hidden="true" />
                  Tema
                </Button>
              )}
              {dominantSuggestionTopic && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  onClick={() => setSuggestionPreferences({})}
                  aria-label="Redefinir todas as sugestões personalizadas"
                  title="Redefinir todas as sugestões personalizadas"
                >
                  Limpar sugestões
                </Button>
              )}
            </div>
            {showSuggestionHelp && (
              <p id="flyia-suggestion-help" className="mt-1 max-w-sm text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                A afinidade prioriza os temas que você escolhe nesta sessão. O modo explorar alterna temas para ampliar as opções. Nada é salvo após limpar a conversa ou trocar de exercício.
              </p>
            )}
          </div>
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-500"
              onClick={() => {
                setMessages([]);
                setSuggestionPreferences({});
              }}
              aria-label="Limpar conversa"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-500"
              aria-label="Fechar Fly.IA"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <AIChatBox
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={chatMutation.isPending}
            height="100%"
            className="h-full rounded-none border-0 shadow-none"
            placeholder="Pergunte sobre voos, compras ou cidades..."
            emptyStateMessage="Olá, eu sou a Fly.IA. Como posso ajudar com seu planejamento?"
            suggestedPrompts={SUGGESTED_PROMPTS}
            followUpPrompts={message =>
              getFlyIaFollowUpPrompts(
                message.content,
                personalizedSuggestionsEnabled ? suggestionPreferences : {},
                suggestionMode,
                suggestionCount
              )
            }
            onFollowUpPromptSelected={prompt =>
              setSuggestionPreferences(current =>
                personalizedSuggestionsEnabled
                  ? recordFlyIaSuggestionPreference(current, prompt)
                  : current
              )
            }
            voiceInput={{
              state: voiceState,
              transcript: voiceTranscript,
              error: voiceError,
              onStartRecording: startVoiceRecording,
              onStopRecording: stopVoiceRecording,
              onTranscriptConsumed: () => setVoiceTranscript(null),
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-100 bg-white px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Respostas baseadas nos dados do exercício selecionado.
        </div>
      </DialogContent>}
      </Dialog>
      <LoginRequiredMessageBox
        open={showLoginRequiredMessage}
        onOpenChange={setShowLoginRequiredMessage}
        onLogin={() => window.dispatchEvent(new Event("flight:require-login"))}
        title="Planejamento protegido"
        description="Entre para consultar o seu planejamento com o Fly.IA. Suas perguntas usam apenas os dados do exercício selecionado."
        loginLabel="Entrar para usar o Fly.IA"
        resource="fly-ia"
      />
    </>
  );
}
