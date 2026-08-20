import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { Button } from "@/components/ui/button";
import { useYear } from "@/contexts/YearContext";
import { CityBackgroundCarousel } from "@/components/CityBackgroundCarousel";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  CircleDot,
  Compass,
  Flag,
  ImagePlus,
  Loader2,
  MapPin,
  Milestone,
  Plane,
  Sparkles,
  Ticket,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Link } from "wouter";

const numberFormatter = new Intl.NumberFormat("pt-BR");

type MemorySegment = {
  direction: "ida" | "volta";
  origin: string;
  destination: string;
  flightDatetime: string;
  airline: string | null;
  flightNumber: string | null;
  distanceKm: number | null;
  status: "completed" | "future" | "cancelled";
};

type MemoryTrip = {
  year: number;
  weekNumber: number;
  departureDate: string;
  returnDate: string;
  segments: MemorySegment[];
  totalKm: number;
  completedKm: number;
  futureKm: number;
  memory: { media: MemoryMedia[] } | null;
  summary: MemorySummary | null;
};

type MemorySummary = {
  id: number;
  summary: string;
  model: string;
  generatedAt: Date | string;
};

type MemoryMedia = {
  id: number;
  storageUrl: string;
  mediaType: "image" | "video";
  fileName: string;
};

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

function formatKm(value: number) {
  return `${numberFormatter.format(value)} km`;
}

export default function Memories() {
  const { selectedYear } = useYear();
  const [loginOpen, setLoginOpen] = useState(false);
  const authQuery = trpc.flightAuth.check.useQuery(undefined, { retry: false });
  const isAuthenticated = Boolean(authQuery.data?.authenticated);
  const overviewQuery = trpc.memories.getOverview.useQuery(
    { year: selectedYear },
    { enabled: isAuthenticated, staleTime: 60_000 }
  );
  const utils = trpc.useUtils();
  const deleteMediaMutation = trpc.memories.deleteMedia.useMutation({
    onSuccess: () => {
      void utils.memories.getOverview.invalidate({ year: selectedYear });
    },
  });
  const [generatedSummaries, setGeneratedSummaries] = useState<Record<number, MemorySummary>>({});
  const [generatingWeek, setGeneratingWeek] = useState<number | null>(null);
  const generateSummaryMutation = trpc.memories.generateSummary.useMutation({
    onMutate: input => {
      setGeneratingWeek(input.weekNumber);
    },
    onSuccess: async (data, input) => {
      setGeneratedSummaries(current => ({ ...current, [input.weekNumber]: data.summary }));
      await utils.memories.getOverview.invalidate({ year: selectedYear });
      if (data.generated) toast.success("Resumo Fly.IA pronto para revisitar esta viagem.");
    },
    onError: error => {
      toast.error(error.message || "Não foi possível gerar o resumo da viagem.");
    },
    onSettled: () => {
      setGeneratingWeek(null);
    },
  });
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);

  const handleMediaUpload = async (
    weekNumber: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Escolha uma foto ou vídeo para esta memória.");
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      toast.error("Cada mídia pode ter no máximo 25 MB.");
      return;
    }

    setUploadingWeek(weekNumber);
    try {
      const params = new URLSearchParams({
        year: String(selectedYear),
        weekNumber: String(weekNumber),
        fileName: file.name,
      });
      const response = await fetch(`/api/memories/upload?${params.toString()}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Não foi possível enviar a mídia.");
      }
      await utils.memories.getOverview.invalidate({ year: selectedYear });
      toast.success("Mídia adicionada à memória da passagem.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mídia.");
    } finally {
      setUploadingWeek(null);
    }
  };

  if (authQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <LoginRequiredScreen
          icon={Compass}
          title="Memórias de voo"
          description="Entre para acompanhar seus quilômetros, revisitar trajetos e guardar os momentos de cada passagem."
          loginLabel="Entrar para ver memórias"
          onLogin={() => setLoginOpen(true)}
          resource="memories"
        >
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao planejamento
            </Button>
          </Link>
        </LoginRequiredScreen>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  const summary = overviewQuery.data?.summary;
  const trips = overviewQuery.data?.trips ?? [];

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-transparent text-slate-950">
      <CityBackgroundCarousel />
      <header className="relative z-10 overflow-hidden border-b border-white/10 bg-[#0e1b39]/45 text-white backdrop-blur-[2px]">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_15%_20%,rgba(244,114,182,.32),transparent_20%),radial-gradient(circle_at_85%_15%,rgba(96,165,250,.30),transparent_18%),radial-gradient(circle_at_60%_110%,rgba(250,204,21,.20),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Planejamento
            </Link>
            <GlobalYearSelector />
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-fuchsia-100">
                <Sparkles className="h-3.5 w-3.5" /> Diário de Bordo
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                Cada trecho guarda uma história.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Acompanhe sua jornada entre aeroportos e transforme cada passagem emitida em uma memória para revisitar.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950/25 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-300">
                <span>Rota do ano</span>
                <Plane className="h-5 w-5 rotate-45 text-fuchsia-300" />
              </div>
              <div className="mt-7 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#0e1b39] font-black">GRU</div>
                <div className="h-px flex-1 border-t-2 border-dashed border-fuchsia-300/80" />
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-fuchsia-400 text-slate-950 font-black">NVT</div>
              </div>
              <p className="mt-5 text-sm text-slate-200">Quilometragem estimada pela distância geodésica entre aeroportos.</p>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Milestone />} label="Total da jornada" value={formatKm(summary?.totalKm ?? 0)} tone="indigo" />
          <MetricCard icon={<Flag />} label="Já percorridos" value={formatKm(summary?.completedKm ?? 0)} tone="emerald" />
          <MetricCard icon={<Plane />} label="Próximos voos" value={formatKm(summary?.futureKm ?? 0)} tone="amber" />
          <MetricCard icon={<Ticket />} label="Passagens emitidas" value={String(summary?.issuedTrips ?? 0)} tone="fuchsia" />
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-fuchsia-600">Linha do tempo</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow-sm">Memórias de {selectedYear}</h2>
            </div>
            <p className="rounded-full bg-slate-950/45 px-3 py-1.5 text-sm text-slate-100 shadow-sm backdrop-blur-sm">As mídias são privadas e vinculadas à passagem.</p>
          </div>

          {overviewQuery.isLoading ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {[0, 1, 2, 3].map(item => <div key={item} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}
            </div>
          ) : trips.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <Compass className="mx-auto h-10 w-10 text-fuchsia-500" />
              <h3 className="mt-4 text-xl font-black">Sua próxima história começa com uma passagem</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Quando uma ida ou volta for marcada como emitida, ela aparecerá aqui com a distância e um espaço para suas mídias.</p>
              <Link href={`/?ano=${selectedYear}`}>
                <Button className="mt-6">Ir ao planejamento</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {trips.map(trip => (
                <MemoryTripCard
                  key={trip.weekNumber}
                  trip={{ ...trip, summary: generatedSummaries[trip.weekNumber] ?? trip.summary }}
                  isUploading={uploadingWeek === trip.weekNumber}
                  isGeneratingSummary={generatingWeek === trip.weekNumber}
                  onUpload={event => handleMediaUpload(trip.weekNumber, event)}
                  onGenerateSummary={force =>
                    generateSummaryMutation.mutate({
                      year: selectedYear,
                      weekNumber: trip.weekNumber,
                      force,
                    })
                  }
                  onDeleteMedia={mediaId =>
                    deleteMediaMutation.mutate({ year: selectedYear, mediaId })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "indigo" | "emerald" | "amber" | "fuchsia" }) {
  const colors = {
    indigo: "bg-indigo-600 text-indigo-50",
    emerald: "bg-emerald-500 text-emerald-50",
    amber: "bg-amber-400 text-amber-950",
    fuchsia: "bg-fuchsia-500 text-fuchsia-50",
  };
  return <article className={`rounded-3xl p-5 shadow-xl shadow-slate-950/10 ${colors[tone]}`}>
    <div className="flex items-center justify-between"><span className="text-sm font-bold opacity-85">{label}</span><span className="rounded-xl bg-black/10 p-2">{icon}</span></div>
    <p className="mt-7 text-3xl font-black tracking-tight">{value}</p>
  </article>;
}

function MemoryTripCard({
  trip,
  isUploading,
  isGeneratingSummary,
  onUpload,
  onGenerateSummary,
  onDeleteMedia,
}: {
  trip: MemoryTrip;
  isUploading: boolean;
  isGeneratingSummary: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerateSummary: (force: boolean) => void;
  onDeleteMedia: (mediaId: number) => void;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const requestedAutomatically = useRef(false);
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    requestedAutomatically.current = false;
  }, [trip.weekNumber, trip.year]);

  const requestInitialSummary = useCallback(() => {
    if (trip.summary || requestedAutomatically.current) return;
    requestedAutomatically.current = true;
    onGenerateSummary(false);
  }, [onGenerateSummary, trip.summary]);

  useEffect(() => {
    if (trip.summary || requestedAutomatically.current) return;
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") {
      requestInitialSummary();
      return;
    }

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        requestInitialSummary();
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [requestInitialSummary, trip.summary]);

  useEffect(() => {
    if (summaryOpen) requestInitialSummary();
  }, [requestInitialSummary, summaryOpen]);

  return (
    <article ref={cardRef} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-lg shadow-slate-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[5rem] bg-fuchsia-50" />
      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-slate-400">Semana {trip.weekNumber}</p>
          <h3 className="mt-2 break-words text-lg font-black sm:text-xl">{trip.departureDate} → {trip.returnDate}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white sm:px-3 sm:text-sm">{formatKm(trip.totalKm)}</span>
      </div>

      <div className="relative mt-6 space-y-3">
        {trip.segments.map(segment => (
          <div key={`${segment.direction}-${segment.flightDatetime}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className={`grid h-9 w-9 place-items-center rounded-xl ${segment.status === "completed" ? "bg-emerald-100 text-emerald-700" : segment.status === "future" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}>
              {segment.status === "completed" ? <CircleDot className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1"><p className="font-black text-slate-800">{segment.origin} <span className="text-fuchsia-500">→</span> {segment.destination}</p><p className="truncate text-xs text-slate-500">{segment.airline || "Companhia a confirmar"} {segment.flightNumber ? `• ${segment.flightNumber}` : ""}</p></div>
            <span className="text-sm font-black text-slate-700">{segment.distanceKm ? formatKm(segment.distanceKm) : "—"}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-6 border-t border-slate-100 pt-5">
        <div className="mb-5 rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-fuchsia-500 text-white"><Sparkles className="h-4 w-4" /></span>
              Resumo Fly.IA
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSummaryOpen(current => !current)}
              aria-expanded={summaryOpen}
              className="border-fuchsia-200 bg-white/80 text-fuchsia-800 hover:bg-fuchsia-100"
            >
              {summaryOpen ? "Ocultar resumo" : trip.summary ? "Ver resumo" : "Abrir resumo"}
            </Button>
          </div>
          {summaryOpen && (
            <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm leading-6 text-slate-700">
              {isGeneratingSummary ? (
                <p className="flex items-center gap-2 font-medium text-fuchsia-800"><Loader2 className="h-4 w-4 animate-spin" /> Fly.IA está preparando este resumo...</p>
              ) : trip.summary ? (
                <>
                  <p>{trip.summary.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>Gerado em {new Date(trip.summary.generatedAt).toLocaleDateString("pt-BR")}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => onGenerateSummary(true)} className="h-7 px-2 text-fuchsia-700 hover:bg-fuchsia-100 hover:text-fuchsia-800">
                      Atualizar resumo
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-slate-600">O resumo será criado automaticamente para esta viagem.</p>
              )}
            </div>
          )}
        </div>
        {trip.memory?.media.length ? (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
            {trip.memory.media.map(media => (
              <div key={media.id} className="group/media relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {media.mediaType === "image" ? (
                  <img src={media.storageUrl} alt={media.fileName} className="h-full w-full object-cover" />
                ) : (
                  <video src={media.storageUrl} controls preload="metadata" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => onDeleteMedia(media.id)}
                  className="absolute right-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-bold text-white opacity-100 transition sm:opacity-0 sm:group-hover/media:opacity-100 focus:opacity-100"
                  aria-label={`Remover ${media.fileName}`}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Reserve este espaço para fotos e vídeos do momento.</p>
        )}
        <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-700 sm:w-auto">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {isUploading ? "Enviando mídia..." : "Adicionar foto ou vídeo"}
          <Video className="h-4 w-4" />
          <input type="file" accept="image/*,video/*" onChange={onUpload} disabled={isUploading} className="sr-only" />
        </label>
        <p className="mt-2 text-xs text-slate-400">Fotos e vídeos de até 25 MB.</p>
      </div>
    </article>
  );
}
