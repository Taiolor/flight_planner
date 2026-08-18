import { LoginModal } from "@/components/auth/LoginModal";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { queryCachePolicies } from "@/lib/queryCache";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowLeft,
  Loader2,
  MapPinned,
  MousePointerClick,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";

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

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function UsageTelemetryMap() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hours, setHours] = useState(24);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;
  const mapQuery = trpc.usageTelemetry.getMapData.useQuery(
    { hours, limit: 200 },
    { enabled: isAuthenticated, ...queryCachePolicies.admin }
  );
  const summaryQuery = trpc.usageTelemetry.getSummary.useQuery(
    { hours },
    { enabled: isAuthenticated, ...queryCachePolicies.admin }
  );

  const totalEvents = useMemo(
    () => (summaryQuery.data ?? []).reduce((total, item) => total + Number(item.count), 0),
    [summaryQuery.data]
  );
  const locatedEvents = useMemo(
    () => (summaryQuery.data ?? []).reduce((total, item) => total + Number(item.located), 0),
    [summaryQuery.data]
  );

  const renderMarkers = useCallback(
    (map: google.maps.Map) => {
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];
      const events = mapQuery.data ?? [];
      if (events.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      markersRef.current = events.map(event => {
        const position = {
          lat: Number(event.latitudeE2) / 100,
          lng: Number(event.longitudeE2) / 100,
        };
        bounds.extend(position);
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position,
          title: `${EVENT_LABELS[event.eventType]} · ${event.route}`,
        });
        const markerElement = marker.element as HTMLElement | undefined;
        if (markerElement) {
          markerElement.style.setProperty("--gmpx-color", EVENT_COLORS[event.eventType]);
        }
        return marker;
      });

      if (events.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(7);
      } else {
        map.fitBounds(bounds, 56);
      }
    },
    [mapQuery.data]
  );

  useEffect(() => {
    if (mapRef.current && window.google?.maps?.marker) {
      renderMarkers(mapRef.current);
    }
  }, [renderMarkers]);

  if (authCheckQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <Card className="mx-auto max-w-lg border-slate-700 bg-slate-900 p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-blue-400" />
          <h1 className="mt-4 text-xl font-bold">Telemetria protegida</h1>
          <p className="mt-2 text-sm text-slate-300">
            Entre com a sessão interna para consultar o mapa administrativo de eventos consentidos.
          </p>
          <Button className="mt-5" onClick={() => setShowLoginModal(true)}>
            Entrar
          </Button>
        </Card>
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/notifications" className="inline-flex">
              <Button variant="ghost" size="icon" aria-label="Voltar ao painel administrativo">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">Administração</p>
              <h1 className="text-xl font-bold">Mapa de telemetria de uso</h1>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-slate-600 bg-slate-900"
            disabled={mapQuery.isFetching || summaryQuery.isFetching}
            onClick={() => {
              void mapQuery.refetch();
              void summaryQuery.refetch();
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${mapQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </header>

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

        <section className="flex flex-wrap items-center gap-2" aria-label="Período analisado">
          {[24, 72, 168].map(option => (
            <Button
              key={option}
              size="sm"
              variant={hours === option ? "default" : "outline"}
              onClick={() => setHours(option)}
            >
              Últimas {option === 24 ? "24h" : option === 72 ? "72h" : "7 dias"}
            </Button>
          ))}
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            até 200 pontos aproximados
          </Badge>
        </section>

        <Card className="overflow-hidden border-slate-800 bg-slate-900 p-0">
          {mapQuery.isLoading ? (
            <div className="flex h-[540px] items-center justify-center gap-3 text-slate-300">
              <Loader2 className="h-6 w-6 animate-spin" /> Carregando eventos consentidos...
            </div>
          ) : mapQuery.error ? (
            <div className="flex h-[540px] items-center justify-center px-6 text-center text-rose-300">
              Não foi possível carregar os dados administrativos desta sessão.
            </div>
          ) : (
            <MapView
              className="h-[540px]"
              initialCenter={{ lat: -14.235, lng: -51.9253 }}
              initialZoom={4}
              onMapReady={map => {
                mapRef.current = map;
                renderMarkers(map);
              }}
            />
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
