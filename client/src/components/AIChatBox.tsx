import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Cloud, CloudLightning, CloudRain, CloudSun, Droplets, ExternalLink, Loader2, Luggage, MapPinned, Mic, Send, Square, Sun, ThermometerSun, User, Wind, Sparkles } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  action?: {
    label: string;
    href: string;
    ariaLabel: string;
  };
  weather?: {
    destinationLabel: string;
    forecastDate: string;
    summary: string;
    temperatureMinC: number;
    temperatureMaxC: number;
    precipitationProbability: number;
    windSpeedKmh: number;
    uvIndexMax?: number;
    sourceLabel: string;
    sourceUrl: string;
    travelLeg?: "Ida" | "Volta";
    precipitationAlert?: string;
    weatherAlerts?: Array<{ type: "rain" | "wind" | "visibility"; label: string }>;
    packingGuidance?: string[];
  };
};

export type AIChatBoxProps = {
  /**
   * Messages array to display in the chat.
   * Should match the format used by invokeLLM on the server.
   */
  messages: Message[];

  /**
   * Callback when user sends a message.
   * Typically you'll call a tRPC mutation here to invoke the LLM.
   */
  onSendMessage: (content: string) => void;

  /**
   * Whether the AI is currently generating a response
   */
  isLoading?: boolean;

  /**
   * Placeholder text for the input field
   */
  placeholder?: string;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Height of the chat box (default: 600px)
   */
  height?: string | number;

  /**
   * Empty state message to display when no messages
   */
  emptyStateMessage?: string;

  /**
   * Suggested prompts to display in empty state
   * Click to send directly
   */
  suggestedPrompts?: string[];

  /**
   * Sugestões de continuidade exibidas após a última resposta do assistente.
   */
  followUpPrompts?: (message: Message) => string[];

  /** Registra somente o tema de uma sugestão selecionada no controle do chat. */
  onFollowUpPromptSelected?: (prompt: string) => void;

  /** Estado opcional de gravação e transcrição de voz. */
  voiceInput?: {
    state: "idle" | "recording" | "transcribing";
    transcript?: string | null;
    error?: string | null;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onTranscriptConsumed?: () => void;
  };
};

const PROCESSING_STAGES = [
  "Analisando sua pergunta…",
  "Consultando informações da viagem…",
  "Organizando uma resposta clara…",
];

function AssistantResponseSkeleton({ minHeight }: { minHeight: number }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStageIndex(current => (current + 1) % PROCESSING_STAGES.length);
    }, 2_400);
    return () => window.clearInterval(interval);
  }, []);

  const currentStage = PROCESSING_STAGES[stageIndex];
  return (
    <div
      className="flex items-start gap-3"
      style={minHeight > 0 ? { minHeight: `${minHeight}px` } : undefined}
      role="status"
      aria-live="polite"
      aria-label={`Fly.IA está processando a resposta. ${currentStage}`}
      data-testid="assistant-response-skeleton"
    >
      <div className="relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="absolute inset-0 rounded-full border border-primary/35 animate-ping motion-reduce:animate-none" aria-hidden="true" />
        <Sparkles className="relative size-4 animate-pulse text-primary motion-reduce:animate-none" aria-hidden="true" />
      </div>
      <div className="w-[min(80%,17rem)] rounded-lg bg-muted px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground" data-testid="assistant-processing-stage">
          <span>{currentStage}</span>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <i className="size-1 rounded-full bg-primary animate-bounce motion-reduce:animate-none" />
            <i className="size-1 rounded-full bg-primary animate-bounce [animation-delay:150ms] motion-reduce:animate-none" />
            <i className="size-1 rounded-full bg-primary animate-bounce [animation-delay:300ms] motion-reduce:animate-none" />
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Isso pode levar alguns segundos.</p>
        <div className="mt-3 space-y-2" aria-hidden="true">
        <Skeleton className="h-3 w-[92%] motion-reduce:animate-none" />
        <Skeleton className="h-3 w-[74%] motion-reduce:animate-none" />
        <Skeleton className="h-3 w-[48%] motion-reduce:animate-none" />
        </div>
      </div>
      <span className="sr-only">Fly.IA está processando a resposta. {currentStage}</span>
    </div>
  );
}

function isGoogleMapsDirectionsUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:"
      && url.hostname === "www.google.com"
      && url.pathname === "/maps/dir/"
      && url.searchParams.get("api") === "1";
  } catch {
    return false;
  }
}

function isFlightradarFlightUrl(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:"
      && url.hostname === "www.flightradar24.com"
      && /^\/data\/flights\/[a-z0-9]+$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function WeatherIcon({ summary }: { summary: string }) {
  const normalized = summary.toLocaleLowerCase("pt-BR");
  const className = "size-5 text-sky-700 dark:text-sky-300";
  if (/trovo/.test(normalized)) return <CloudLightning className={className} aria-hidden="true" />;
  if (/chuva|garoa|pancada/.test(normalized)) return <CloudRain className={className} aria-hidden="true" />;
  if (/nublado|neblina/.test(normalized)) return <Cloud className={className} aria-hidden="true" />;
  if (/limpo/.test(normalized)) return <Sun className={className} aria-hidden="true" />;
  return <CloudSun className={className} aria-hidden="true" />;
}

function WeatherResponseCard({ weather }: { weather: NonNullable<Message["weather"]> }) {
  const date = weather.forecastDate.split("-").reverse().join("/");
  const alerts = weather.weatherAlerts ?? (weather.precipitationAlert ? [{ type: "rain" as const, label: weather.precipitationAlert }] : []);
  return (
    <section
      className="mt-2 overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 text-slate-800 shadow-sm dark:border-sky-900/70 dark:from-sky-950/45 dark:to-cyan-950/20 dark:text-slate-100"
      aria-label={`Previsão no destino ${weather.destinationLabel}`}
      data-testid="flyia-weather-card"
    >
      <div className="flex items-center gap-2 border-b border-sky-200/80 px-3 py-2 dark:border-sky-900/70">
        <WeatherIcon summary={weather.summary} />
        <div className="min-w-0">
          <p className="text-xs font-bold">Clima em {weather.destinationLabel}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">{weather.travelLeg ? `${weather.travelLeg} · ` : ""}{date} · {weather.summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-sky-200/80 sm:grid-cols-4 sm:divide-y-0 dark:divide-sky-900/70">
        <div className="px-2.5 py-2" aria-label={`Temperatura entre ${weather.temperatureMinC} e ${weather.temperatureMaxC} graus Celsius`}>
          <ThermometerSun className="size-3.5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">Temperatura</p>
          <p className="text-xs font-semibold">{weather.temperatureMinC}–{weather.temperatureMaxC} °C</p>
        </div>
        <div className="px-2.5 py-2" aria-label={`Probabilidade de chuva de ${weather.precipitationProbability} por cento`}>
          <Droplets className="size-3.5 text-blue-600 dark:text-blue-300" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">Chuva</p>
          <p className="text-xs font-semibold">{weather.precipitationProbability}%</p>
        </div>
        <div className="px-2.5 py-2" aria-label={`Vento de até ${weather.windSpeedKmh} quilômetros por hora`}>
          <Wind className="size-3.5 text-teal-600 dark:text-teal-300" aria-hidden="true" />
          <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">Vento</p>
          <p className="text-xs font-semibold">{weather.windSpeedKmh} km/h</p>
        </div>
        {typeof weather.uvIndexMax === "number" && (
          <div className="px-2.5 py-2" aria-label={`Índice ultravioleta máximo de ${weather.uvIndexMax}`}>
            <Sun className="size-3.5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
            <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">Índice UV</p>
            <p className="text-xs font-semibold">{weather.uvIndexMax}</p>
          </div>
        )}
      </div>
      {alerts.map(alert => (
        <div key={`${alert.type}-${alert.label}`} className="mx-3 mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100" role="status" data-testid={`flyia-weather-alert-${alert.type}`}>
          {alert.type === "wind" ? <Wind className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />}
          <span>{alert.label}</span>
        </div>
      ))}
      {weather.packingGuidance && weather.packingGuidance.length > 0 && (
        <div className="mx-3 mt-2 flex items-start gap-1.5 rounded-lg bg-white/65 px-2.5 py-2 text-[11px] text-slate-700 dark:bg-slate-950/35 dark:text-slate-200" aria-label={`Bagagem sugerida: ${weather.packingGuidance.join(", ")}`} data-testid="flyia-weather-packing">
          <Luggage className="mt-0.5 size-3.5 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden="true" />
          <span><strong>Na mala:</strong> {weather.packingGuidance.join("; ")}.</span>
        </div>
      )}
      <a
        href={weather.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-2 text-[10px] font-semibold text-sky-800 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 dark:text-sky-200"
      >
        Fonte: {weather.sourceLabel}
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    </section>
  );
}

/**
 * A ready-to-use AI chat box component that integrates with the LLM system.
 *
 * Features:
 * - Matches server-side Message interface for seamless integration
 * - Markdown rendering with Streamdown
 * - Auto-scrolls to latest message
 * - Loading states
 * - Uses global theme colors from index.css
 *
 * @example
 * ```tsx
 * const ChatPage = () => {
 *   const [messages, setMessages] = useState<Message[]>([
 *     { role: "system", content: "You are a helpful assistant." }
 *   ]);
 *
 *   const chatMutation = trpc.ai.chat.useMutation({
 *     onSuccess: (response) => {
 *       // Assuming your tRPC endpoint returns the AI response as a string
 *       setMessages(prev => [...prev, {
 *         role: "assistant",
 *         content: response
 *       }]);
 *     },
 *     onError: (error) => {
 *       console.error("Chat error:", error);
 *       // Optionally show error message to user
 *     }
 *   });
 *
 *   const handleSend = (content: string) => {
 *     const newMessages = [...messages, { role: "user", content }];
 *     setMessages(newMessages);
 *     chatMutation.mutate({ messages: newMessages });
 *   };
 *
 *   return (
 *     <AIChatBox
 *       messages={messages}
 *       onSendMessage={handleSend}
 *       isLoading={chatMutation.isPending}
 *       suggestedPrompts={[
 *         "Explain quantum computing",
 *         "Write a hello world in Python"
 *       ]}
 *     />
 *   );
 * };
 * ```
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
  followUpPrompts,
  onFollowUpPromptSelected,
  voiceInput,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const transcript = voiceInput?.transcript?.trim();
    const onTranscriptConsumed = voiceInput?.onTranscriptConsumed;
    if (!transcript) return;
    setInput(current => current.trim() ? `${current.trim()} ${transcript}` : transcript);
    onTranscriptConsumed?.();
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [voiceInput?.transcript, voiceInput?.onTranscriptConsumed]);

  // Filter out system messages
  const displayMessages = messages.filter(msg => msg.role !== "system");

  // Calculate min-height for last assistant message to push user message to top
  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;

      // Reserve space for:
      // - padding (p-4 = 32px top+bottom)
      // - user message: 40px (item height) + 16px (margin-top from space-y-4) = 56px
      // Note: margin-bottom is not counted because it naturally pushes the assistant message down
      const userMessageReservedHeight = 56;
      const calculatedHeight =
        scrollAreaHeight - 32 - userMessageReservedHeight;

      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);

  // Scroll to bottom helper function with smooth animation
  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        if (typeof viewport.scrollTo === "function") {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth",
          });
          return;
        }
        viewport.scrollTop = viewport.scrollHeight;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");

    // Scroll immediately after sending
    scrollToBottom();

    // Keep focus on input
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const sendSuggestedPrompt = (prompt: string) => {
    if (isLoading) return;
    // Mantém o mesmo fluxo de envio manual: o texto é colocado no estado do
    // campo antes de ser despachado e o chat preserva o foco para a sequência.
    setInput(prompt);
    onFollowUpPromptSelected?.(prompt);
    onSendMessage(prompt);
    setInput("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm",
        className
      )}
      style={{ height }}
    >
      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-sm">{emptyStateMessage}</p>
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-4">
              {displayMessages.map((message, index) => {
                // Apply min-height to last message only if NOT loading (when loading, the loading indicator gets it)
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight
                        ? { minHeight: `${minHeightForLastMessage}px` }
                        : undefined
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                    )}

                    <div className="min-w-0 max-w-[80%]">
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2.5",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>
                        )}
                      </div>
                      {message.role === "assistant" && message.weather && (
                        <WeatherResponseCard weather={message.weather} />
                      )}
                      {message.role === "assistant" && message.action && isGoogleMapsDirectionsUrl(message.action.href) && (
                        <Button asChild variant="outline" size="sm" className="mt-2 h-8 gap-1.5 border-primary/30 bg-background text-primary hover:bg-primary/5">
                          <a
                            href={message.action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={message.action.ariaLabel}
                            data-testid="flyia-map-route-action"
                          >
                            <MapPinned className="size-3.5" aria-hidden="true" />
                            {message.action.label}
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        </Button>
                      )}
                      {message.role === "assistant" && message.action && isFlightradarFlightUrl(message.action.href) && (
                        <Button asChild variant="outline" size="sm" className="mt-2 h-8 gap-1.5 border-primary/30 bg-background text-primary hover:bg-primary/5">
                          <a
                            href={message.action.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={message.action.ariaLabel}
                            data-testid="flyia-flight-tracking-action"
                          >
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                            {message.action.label}
                          </a>
                        </Button>
                      )}
                      {message.role === "assistant" && isLastMessage && !isLoading && followUpPrompts && (
                        <div
                          className="mt-2 flex w-full flex-wrap gap-1.5"
                          aria-label="Sugestões de próximas perguntas"
                          data-testid="follow-up-prompts"
                        >
                          {followUpPrompts(message).map(prompt => (
                            <button
                              key={prompt}
                              type="button"
                              onClick={() => sendSuggestedPrompt(prompt)}
                              className="max-w-full rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isLoading}
                              aria-label={`Perguntar: ${prompt}`}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && <AssistantResponseSkeleton minHeight={minHeightForLastMessage} />}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background/50 items-end"
      >
        <div className="min-w-0 flex-1">
          {voiceInput && voiceInput.state !== "idle" && (
            <p className="mb-1 text-xs text-slate-500" role="status" aria-live="polite">
              {voiceInput.state === "recording" ? "Ouvindo… toque novamente para finalizar." : "Transcrevendo sua pergunta…"}
            </p>
          )}
          {voiceInput?.error && (
            <p className="mb-1 text-xs text-red-600 dark:text-red-400" role="alert">
              {voiceInput.error}
            </p>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceInput ? "Digite ou fale sua pergunta…" : placeholder}
            className="max-h-32 min-h-9 resize-none"
            rows={1}
          />
        </div>
        {voiceInput && (
          <Button
            type="button"
            variant={voiceInput.state === "recording" ? "destructive" : "outline"}
            size="icon"
            aria-label={voiceInput.state === "recording" ? "Parar gravação" : "Falar uma pergunta"}
            title={voiceInput.state === "recording" ? "Parar gravação" : "Falar uma pergunta"}
            disabled={isLoading || voiceInput.state === "transcribing"}
            onClick={voiceInput.state === "recording" ? voiceInput.onStopRecording : voiceInput.onStartRecording}
            className="h-[38px] w-[38px] shrink-0"
          >
            {voiceInput.state === "transcribing" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : voiceInput.state === "recording" ? (
              <Square className="size-3.5" fill="currentColor" />
            ) : (
              <Mic className="size-4" />
            )}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-[38px] w-[38px]"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
