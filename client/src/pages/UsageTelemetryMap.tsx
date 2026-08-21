import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { OpenStreetMap, type OpenStreetMapPoint } from "@/components/OpenStreetMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContentReveal } from "@/components/ContentReveal";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { queryCachePolicies } from "@/lib/queryCache";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Loader2,
  MapPinned,
  MousePointerClick,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useMemo, useState } from "react";

const EVENT_LABELS = {
  route: "Navegação",
  interaction: "Interação",
  query: "Consulta",
  mutation: "Alteração",
} as const;

const EVENT_COLORS = {
  route: "#2563eb",
  interaction: "#7c3aed",
  query: "#0891b2",
  mutation: "#dc2626",
} as const;

type EventType = keyof typeof EVENT_LABELS;

export const LOCATIONS_BACK_ROUTE = "/";

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function UsageTelemetryMap() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;

  if (authCheckQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <StandardPageHeader icon={MapPinned} title="Locais · Telemetria" />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <StandardPageHeader icon={MapPinned} title="Locais · Telemetria" />
        <LoginRequiredScreen
          icon={ShieldCheck}
          title="Telemetria protegida"
          description="Entre com a sessão interna para consultar o mapa administrativo de eventos consentidos."
          onLogin={() => setShowLoginModal(true)}
          resource="admin-telemetry"
        />
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </div>
    );
  }

  return <UsageTelemetryMapContent />;
}

function UsageTelemetryMapContent() {
  const [hours, setHours] = useState(24);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const telemetryFilters = useMemo(
    () => ({
      hours,
      eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
    }),
    [eventTypes, hours]
  );
  const mapQuery = trpc.usageTelemetry.getMapData.useQuery(
    { ...telemetryFilters, limit: 200 },
    { enabled: true, ...queryCachePolicies.admin }
  );
  const summaryQuery = trpc.usageTelemetry.getSummary.useQuery(
    telemetryFilters,
    { enabled: true, ...queryCachePolicies.admin }
  );

  const totalEvents = useMemo(
    () => (summaryQuery.data ?? []).reduce((total, item) => total + Number(item.count), 0),
    [summaryQuery.data]
  );
  const locatedEvents = useMemo(
    () => (summaryQuery.data ?? []).reduce((total, item) => total + Number(item.located), 0),
    [summaryQuery.data]
  );
  const mapPoints = useMemo<OpenStreetMapPoint[]>(
    () =>
      (mapQuery.data ?? []).map(event => ({
        id: event.id,
        position: {
          lat: Number(event.latitudeE2) / 100,
          lng: Number(event.longitudeE2) / 100,
        },
        color: EVENT_COLORS[event.eventType],
        label: `${EVENT_LABELS[event.eventType]} · ${event.route}`,
      })),
    [mapQuery.data]
  );
  const toggleEventType = (eventType: EventType) => {
    setEventTypes(current =>
      current.includes(eventType)
        ? current.filter(type => type !== eventType)
        : [...current, eventType]
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <StandardPageHeader
        icon={MapPinned}
        title="Locais · Telemetria"
        backHref={LOCATIONS_BACK_ROUTE}
        actions={
          <Button
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-blue-700"
            disabled={mapQuery.isFetching || summaryQuery.isFetching}
            onClick={() => {
              void mapQuery.refetch();
              void summaryQuery.refetch();
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${mapQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <div className="container space-y-5 py-6">
        <Card className="border-emerald-900/60 bg-emerald-950/30 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <p className="text-sm text-emerald-50">
              Exibe somente eventos consentidos, com localização aproximada e sem identidade, IP, texto digitado, parâmetros ou posição GPS exata. A retenção é limitada a 30 dias.
            </p>
          </div>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Activity />} label="Eventos" value={formatCount(totalEvents)} />
          <MetricCard icon={<MapPinned />} label="Pontos no mapa" value={formatCount(mapQuery.data?.length ?? 0)} />
          <MetricCard icon={<Waypoints />} label="Eventos com localização" value={formatCount(locatedEvents)} />
          <MetricCard icon={<Search />} label="Janela" value={`${hours}h`} />
        </section>

        <section className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center" aria-label="Filtros de telemetria">
          {[24, 72, 168, 720].map(option => (
            <Button
              key={option}
              size="sm"
              className="w-full"
              variant={hours === option ? "default" : "outline"}
              onClick={() => setHours(option)}
            >
              Últimas {option === 24 ? "24h" : option === 72 ? "72h" : option === 168 ? "7 dias" : "30 dias"}
            </Button>
          ))}
          <Badge variant="outline" className="col-span-2 justify-center border-slate-600 text-slate-300 sm:col-auto">
            até 200 pontos aproximados
          </Badge>
        </section>

        <section className="flex flex-wrap items-center gap-2" aria-label="Tipos de evento">
          <span className="w-full text-xs font-semibold uppercase tracking-wide text-slate-400 sm:w-auto">
            Tipo
          </span>
          <Button
            size="sm"
            variant={eventTypes.length === 0 ? "default" : "outline"}
            aria-pressed={eventTypes.length === 0}
            onClick={() => setEventTypes([])}
          >
            Todos
          </Button>
          {(Object.keys(EVENT_LABELS) as EventType[]).map(eventType => (
            <Button
              key={eventType}
              size="sm"
              variant={eventTypes.includes(eventType) ? "default" : "outline"}
              aria-pressed={eventTypes.includes(eventType)}
              onClick={() => toggleEventType(eventType)}
            >
              {EVENT_LABELS[eventType]}
            </Button>
          ))}
        </section>

        <Card className="overflow-hidden border-slate-800 bg-slate-900 p-0">
          {mapQuery.isLoading ? (
            <div className="flex h-[360px] items-center justify-center gap-3 text-slate-300 sm:h-[540px]">
              <Loader2 className="h-6 w-6 animate-spin" /> Carregando eventos consentidos...
            </div>
          ) : mapQuery.error ? (
            <div className="flex h-[360px] items-center justify-center px-6 text-center text-rose-300 sm:h-[540px]">
              Não foi possível carregar os dados administrativos desta sessão.
            </div>
          ) : (
            <ContentReveal>
              <OpenStreetMap
                className="h-[360px] sm:h-[540px]"
                initialCenter={{ lat: -14.235, lng: -51.9253 }}
                initialZoom={4}
                points={mapPoints}
              />
            </ContentReveal>
          )}
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(summaryQuery.data ?? []).map(item => (
            <Card key={item.eventType} className="border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">{EVENT_LABELS[item.eventType]}</span>
                <MousePointerClick className="h-4 w-4 text-blue-300" />
              </div>
              <p className="mt-2 text-2xl font-bold">{formatCount(Number(item.count))}</p>
              <p className="mt-1 text-xs text-slate-400">{formatCount(Number(item.located))} com localização aproximada</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-blue-300">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
