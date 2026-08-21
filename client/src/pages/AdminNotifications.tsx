/**
 * AdminNotifications.tsx
 * Painel de administrador para monitorar o status de todas as notificações push agendadas.
 * Exibe: próximos alertas, configurações ativas, dispositivos registrados e resumo geral.
 */

import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentReveal } from "@/components/ContentReveal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Clock,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  RefreshCw,
  Wifi,
  WifiOff,
  FlaskConical,
  Plane,
  ChevronDown,
  Loader2,
  Activity,
  MapPinned,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TestNextAlertButton } from "@/components/admin-notifications/TestNextAlertButton";
import {
  formatAirline,
  formatDatetimeBRT,
  formatRelativeTime,
} from "@/components/admin-notifications/utils";
import { AlertRow } from "@/components/admin-notifications/AlertRow";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { useYear } from "@/contexts/YearContext";
import { queryCachePolicies } from "@/lib/queryCache";

export type AdminAccessState = "checking" | "login-required" | "authorized";

export type AdminFormAction = {
  label: string;
  timestamp: string;
  status: "success" | "error";
};

export type AdminActionTimelineEntry = AdminFormAction & {
  id: string;
  source: "push" | "recipients" | "test-email";
};

const ADMIN_ACTION_TIMELINE_KEY = "viagens.admin.action-timeline";
const MAX_ADMIN_ACTION_TIMELINE_ENTRIES = 30;

export function readAdminFormAction(key: string): AdminFormAction | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<AdminFormAction>;
    if (
      typeof parsed.label !== "string" ||
      typeof parsed.timestamp !== "string" ||
      (parsed.status !== "success" && parsed.status !== "error")
    ) {
      return null;
    }
    return parsed as AdminFormAction;
  } catch {
    return null;
  }
}

export function saveAdminFormAction(key: string, action: AdminFormAction) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(action));
  }
}

export function clearAdminFormAction(key: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key);
  }
}

export function readAdminActionTimeline(): AdminActionTimelineEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(ADMIN_ACTION_TIMELINE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AdminActionTimelineEntry>[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          entry =>
            typeof entry.id === "string" &&
            typeof entry.label === "string" &&
            typeof entry.timestamp === "string" &&
            (entry.status === "success" || entry.status === "error") &&
            (entry.source === "push" ||
              entry.source === "recipients" ||
              entry.source === "test-email")
        )
        .map(entry => entry as AdminActionTimelineEntry)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, MAX_ADMIN_ACTION_TIMELINE_ENTRIES);
    }

    const legacyEntries = [
      ["push", readAdminFormAction("viagens.admin.last-push-action")],
      ["recipients", readAdminFormAction("viagens.admin.last-recipient-action")],
      ["test-email", readAdminFormAction("viagens.admin.last-test-email-action")],
    ] as const;
    return legacyEntries
      .filter(([, action]) => action !== null)
      .map(([source, action]) => ({
        ...action!,
        id: `${source}-${action!.timestamp}`,
        source,
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export function appendAdminActionTimeline(
  source: AdminActionTimelineEntry["source"],
  action: AdminFormAction
): AdminActionTimelineEntry[] {
  const entry: AdminActionTimelineEntry = {
    ...action,
    source,
    id: `${source}-${action.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const entries = [entry, ...readAdminActionTimeline()]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, MAX_ADMIN_ACTION_TIMELINE_ENTRIES);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_ACTION_TIMELINE_KEY, JSON.stringify(entries));
  }
  return entries;
}

export function clearAdminActionTimeline() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_ACTION_TIMELINE_KEY, "[]");
  }
}

function LastAdminFormAction({
  action,
  onClear,
}: {
  action: AdminFormAction | null;
  onClear: () => void;
}) {
  if (!action) {
    return (
      <p className="mt-3 text-xs text-slate-400">
        Nenhuma ação registrada neste navegador.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p
        className={`flex items-center gap-1.5 text-xs ${
          action.status === "success" ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Última ação: {action.label} em {new Date(action.timestamp).toLocaleString("pt-BR")}
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 self-start px-2 text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900 sm:self-auto"
            aria-label="Limpar registro local da última ação"
          >
            Limpar registro
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar registro local?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove apenas a data e a hora exibidas neste navegador. O histórico persistido de notificações não será alterado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onClear}>
              Limpar registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function getAdminAccessState({
  isCheckingAuthentication,
  isAuthenticated,
}: {
  isCheckingAuthentication: boolean;
  isAuthenticated: boolean;
}): AdminAccessState {
  if (isCheckingAuthentication) return "checking";
  return isAuthenticated ? "authorized" : "login-required";
}

export default function AdminNotifications() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;

  if (authCheckQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardPageHeader icon={Bell} title="Admin · Notificações" />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Carregando painel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardPageHeader icon={Bell} title="Admin · Notificações" />
        <LoginRequiredScreen
          icon={Bell}
          title="Acesso a notificações"
          description="Entre com sua conta para acompanhar alertas e notificações de voo."
          onLogin={() => setShowLoginModal(true)}
          resource="admin-notifications"
        >
          <Link href="/">
            <Button variant="ghost" aria-label="Voltar para a página inicial" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        </LoginRequiredScreen>
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </div>
    );
  }

  return <AdminNotificationsContent />;
}

function AdminNotificationsContent() {
  const { selectedYear } = useYear();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastPushAction, setLastPushAction] = useState<AdminFormAction | null>(
    () => readAdminFormAction("viagens.admin.last-push-action")
  );
  const [actionTimeline, setActionTimeline] = useState<AdminActionTimelineEntry[]>(
    () => readAdminActionTimeline()
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [testFeedback, setTestFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const registerPushAction = (
    label: string,
    status: AdminFormAction["status"]
  ) => {
    const action = { label, status, timestamp: new Date().toISOString() };
    setLastPushAction(action);
    saveAdminFormAction("viagens.admin.last-push-action", action);
    setActionTimeline(appendAdminActionTimeline("push", action));
  };
  const clearPushAction = () => {
    clearAdminFormAction("viagens.admin.last-push-action");
    setLastPushAction(null);
    toast.success("Registro local de teste de notificação limpo.");
  };
  const registerTimelineAction = (
    source: AdminActionTimelineEntry["source"],
    action: AdminFormAction
  ) => {
    setActionTimeline(appendAdminActionTimeline(source, action));
  };
  const clearTimeline = () => {
    clearAdminActionTimeline();
    setActionTimeline([]);
    toast.success("Linha do tempo local limpa.");
  };

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const { data, isLoading, error, refetch, isFetching } =
    trpc.adminNotifications.getStatus.useQuery({ year: selectedYear }, {
      enabled: true,
      ...queryCachePolicies.admin,
      refetchInterval: autoRefresh ? 60_000 : false,
    });

  const logsQuery = trpc.adminNotifications.getLogs.useInfiniteQuery(
    { year: selectedYear, limit: 25 },
    {
      enabled: true,
      ...queryCachePolicies.admin,
      refetchInterval: autoRefresh ? 60_000 : false,
      getNextPageParam: lastPage => lastPage.nextCursor,
    }
  );
  const logs = useMemo(
    () => logsQuery.data?.pages.flatMap(page => page.items) ?? [],
    [logsQuery.data]
  );
  const performanceSummaryQuery = trpc.performanceMetrics.getSummary.useQuery(
    { hours: 24 },
    {
      enabled: true,
      ...queryCachePolicies.admin,
    }
  );
  const performanceByMetric = useMemo(
    () =>
      new Map(
        (performanceSummaryQuery.data ?? []).map(summary => [
          summary.metric,
          summary,
        ])
      ),
    [performanceSummaryQuery.data]
  );

  const sendTestMutation = trpc.push.sendTest.useMutation({
    onSuccess: result => {
      const message = `Notificação de teste enviada para ${result.sent} dispositivo(s).`;
      setTestFeedback({ kind: "success", message });
      registerPushAction("Teste de notificação enviado", "success");
      toast.success(message);
    },
    onError: err => {
      const message = err.message || "Erro ao enviar notificação de teste.";
      setTestFeedback({ kind: "error", message });
      registerPushAction("Tentativa de teste de notificação", "error");
      toast.error(message);
    },
  });

  // Este Hook deve ser executado em todos os estados de autenticação. Mantê-lo
  // antes dos retornos condicionais evita alterar a ordem de Hooks após o
  // carregamento da sessão e dos dados do painel.
  const { pendingAlerts, sentAlerts, pastAlerts } = useMemo(() => {
    type AlertArray = NonNullable<typeof data>["scheduledAlerts"];
    const pending: AlertArray = [];
    const sent: AlertArray = [];
    const past: AlertArray = [];

    if (data?.scheduledAlerts) {
      for (const alert of data.scheduledAlerts) {
        if (alert.status === "pending") pending.push(alert);
        else if (alert.status === "sent") sent.push(alert);
        else if (alert.status === "past") past.push(alert);
      }
    }

    return { pendingAlerts: pending, sentAlerts: sent, pastAlerts: past };
  }, [data?.scheduledAlerts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardPageHeader
          icon={Bell}
          title={`Admin · Notificações · ${selectedYear}`}
        />
          <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <div className="space-y-2 animate-pulse">
                <div className="mx-auto h-3 w-32 rounded bg-slate-200" />
                <div className="mx-auto h-3 w-48 rounded bg-slate-100" />
              </div>
              <p className="text-sm text-gray-500">Carregando painel e histórico...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardPageHeader
          icon={Bell}
          title={`Admin · Notificações · ${selectedYear}`}
        />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <div className="max-w-sm space-y-4 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <p className="font-medium text-gray-700">
              Não foi possível carregar o painel
            </p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const nextAlert = pendingAlerts[0];

  return (
    <ContentReveal className="min-h-screen bg-gray-50">
      <StandardPageHeader
        icon={Bell}
        title={`Admin · Notificações · ${selectedYear}`}
        actions={
          <>
            <GlobalYearSelector
              compact
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            />
            <Link href="/admin/telemetria">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white hover:text-blue-700"
                aria-label="Abrir mapa de telemetria de uso"
              >
                <MapPinned className="w-4 h-4" />
                <span className="hidden md:inline">Locais</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
              aria-label={
                autoRefresh
                  ? "Desativar atualização automática"
                  : "Ativar atualização automática"
              }
              className={`gap-2 text-sm text-white hover:bg-white/10 hover:text-white ${autoRefresh ? "text-emerald-200" : "text-white/80"}`}
            >
              {autoRefresh ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {autoRefresh ? "Auto" : "Manual"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar"
              className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white hover:text-blue-700"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Voos Emitidos
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {data?.totalIssuedFlights ?? 0}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Alertas Pendentes
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {pendingAlerts.length}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Dispositivos
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {data?.totalSubscriptions ?? 0}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-l-gray-400">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Avisos Ativos
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {data?.avisos.length ?? 0}
            </p>
          </Card>
        </div>

        {/* Próximo alerta */}
        {nextAlert && (
          <Card className="p-4 sm:p-5 bg-[#f4f7fb] border-[#c8d6e9]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#102f61] flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#102f61] font-medium uppercase tracking-wide mb-0.5">
                    Próximo Alerta
                  </p>
                  <p className="font-semibold text-gray-800">
                    Semana {nextAlert.weekNumber} —{" "}
                    {nextAlert.direction === "ida" ? "✈️ Ida" : "🏠 Volta"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatAirline(nextAlert.airline)} {nextAlert.flightNumber}{" "}
                    · {nextAlert.avisoLabel} (
                    {nextAlert.avisoMinutes >= 60
                      ? `${nextAlert.avisoMinutes / 60}h`
                      : `${nextAlert.avisoMinutes}min`}{" "}
                    antes)
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-end justify-between gap-3 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0b2349]">
                    {formatRelativeTime(nextAlert.alertDatetime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDatetimeBRT(nextAlert.alertDatetime)}
                  </p>
                </div>
                <TestNextAlertButton year={selectedYear} />
              </div>
            </div>
          </Card>
        )}

        {/* Telemetria de performance */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Desempenho anônimo
                </p>
                <p className="text-xs text-gray-500">
                  Médias das últimas 24 horas, sem dados pessoais.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => performanceSummaryQuery.refetch()}
              disabled={performanceSummaryQuery.isFetching}
              className="text-xs text-gray-500 gap-1"
            >
              <RefreshCw
                className={`w-3 h-3 ${performanceSummaryQuery.isFetching ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {["FCP", "LCP", "INP", "CLS", "TRPC"].map(metric => {
              const summary = performanceByMetric.get(metric);
              const value = summary
                ? metric === "CLS"
                  ? (summary.average / 1000).toFixed(3)
                  : `${summary.average} ms`
                : "Sem dados";
              return (
                <div key={metric} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{metric}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
                  {summary && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {summary.count} amostra{summary.count === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Configurações ativas */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Configurações de Aviso
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {data?.avisos.map((aviso, i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Aviso {i + 1}</p>
                  <p className="text-sm text-gray-500">
                    {aviso.label} antes do voo
                  </p>
                </div>
                <Badge className="ml-auto bg-indigo-100 text-indigo-700 border-indigo-200">
                  Ativo
                </Badge>
              </Card>
            ))}
            {(!data?.avisos || data.avisos.length === 0) && (
              <Card className="p-4 flex items-center gap-3 sm:col-span-2">
                <BellOff className="w-5 h-5 text-gray-400" />
                <p className="text-gray-500 text-sm">
                  Nenhum aviso configurado. Configure em Notificações.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Tabela de alertas agendados */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("alerts")}
            className="w-full flex items-start justify-between p-4 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={expandedSections.has("alerts")}
            aria-controls="section-alerts"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Alertas Agendados ({data?.scheduledAlerts.length ?? 0})
              </h2>
              <div className="hidden gap-2 text-xs text-gray-400 sm:flex">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{" "}
                  Pendente
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{" "}
                  Enviando
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{" "}
                  Passado
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                expandedSections.has("alerts") ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.has("alerts") && (
            <Card id="section-alerts" className="overflow-hidden mt-3">
              {data?.scheduledAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum alerta agendado.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Configure os avisos no popup de Notificações.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Pendentes primeiro */}
                  {pendingAlerts.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-blue-50">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Aguardando envio ({pendingAlerts.length})
                        </p>
                      </div>
                      {pendingAlerts.map((alert, i) => (
                        <AlertRow key={`pending-${i}`} alert={alert} />
                      ))}
                    </>
                  )}

                  {/* Enviando agora */}
                  {sentAlerts.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-green-50">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                          Enviando agora ({sentAlerts.length})
                        </p>
                      </div>
                      {sentAlerts.map((alert, i) => (
                        <AlertRow key={`sent-${i}`} alert={alert} />
                      ))}
                    </>
                  )}

                  {/* Passados */}
                  {pastAlerts.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Voos passados ({pastAlerts.length})
                        </p>
                      </div>
                      {pastAlerts.map((alert, i) => (
                        <AlertRow key={`past-${i}`} alert={alert} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Dispositivos registrados */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("devices")}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={expandedSections.has("devices")}
            aria-controls="section-devices"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Dispositivos Registrados ({data?.totalSubscriptions ?? 0})
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                expandedSections.has("devices") ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.has("devices") && (
            <Card id="section-devices" className="overflow-hidden mt-3">
              {!data?.subscriptions || data.subscriptions.length === 0 ? (
                <div className="p-8 text-center">
                  <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum dispositivo registrado.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Ative as notificações no botão "Notificações" do cabeçalho.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.subscriptions.map((sub, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {sub.userAgent}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {sub.endpoint}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 flex-shrink-0">
                        Ativo
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Linha do tempo local de ações administrativas */}
        <div>
          <div className="w-full flex items-center gap-2 p-4 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection("local-timeline")}
              className="min-w-0 flex flex-1 items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
              aria-expanded={expandedSections.has("local-timeline")}
              aria-controls="section-local-timeline"
            >
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Ações administrativas recentes ({actionTimeline.length})
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Histórico local deste navegador, organizado da ação mais recente à mais antiga.
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                  expandedSections.has("local-timeline") ? "rotate-180" : ""
                }`}
              />
            </button>
            {actionTimeline.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Limpar todas as ações administrativas locais"
                  >
                    Limpar tudo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar a linha do tempo local?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação remove todas as ações administrativas salvas neste navegador. O histórico persistido de notificações não será alterado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={clearTimeline}>
                      Limpar tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {expandedSections.has("local-timeline") && (
            <Card id="section-local-timeline" className="mt-3 overflow-hidden">
              {actionTimeline.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Nenhuma ação administrativa local registrada ainda.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {actionTimeline.map(entry => {
                    const sourceLabel =
                      entry.source === "push"
                        ? "Notificação push"
                        : entry.source === "recipients"
                          ? "Destinatários"
                          : "E-mail de teste";
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 px-4 py-3 sm:items-center"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:mt-0 ${
                            entry.status === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {entry.status === "success" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {entry.label}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {sourceLabel}
                          </p>
                        </div>
                        <time
                          dateTime={entry.timestamp}
                          className="max-w-28 shrink-0 text-right text-xs text-slate-400"
                        >
                          {new Date(entry.timestamp).toLocaleString("pt-BR")}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Histórico Persistente de Envios */}
        <div>
          <div className="w-full flex items-center gap-2 p-4 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection("history")}
              className="min-w-0 flex flex-1 items-center justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
              aria-expanded={expandedSections.has("history")}
              aria-controls="section-history"
            >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Histórico de Envios ({logs.length})
            </h2>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                  expandedSections.has("history") ? "rotate-180" : ""
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => logsQuery.refetch()}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-label="Atualizar histórico de envios"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>

          {expandedSections.has("history") && (
            <Card id="section-history" className="overflow-hidden mt-3">
              {logs.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum envio registrado ainda.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Os próximos envios automáticos e testes aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="hidden grid-cols-[auto_1fr_auto_auto] gap-x-3 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid">
                    <span>Status</span>
                    <span>Voo</span>
                    <span className="text-right">Dispositivos</span>
                    <span className="text-right">Enviado em</span>
                  </div>
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-3 sm:grid sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
                    >
                      {/* Status */}
                      <div className="flex-shrink-0">
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : log.status === "partial" ? (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      {/* Descrição */}
                      <div className="min-w-[10rem] flex-1 sm:min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {log.isTest ? (
                            <span className="flex items-center gap-1 text-sm font-medium text-purple-700">
                              <FlaskConical className="w-3 h-3" /> Teste Manual
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-800">
                              Semana {log.weekNumber} —{" "}
                              {log.direction === "ida" ? "✈️ Ida" : "🏠 Volta"}
                            </span>
                          )}
                          <Badge className="text-xs bg-indigo-50 text-indigo-600 border-indigo-100">
                            {log.avisoLabel}
                          </Badge>
                        </div>
                        {!log.isTest && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {log.airline ? formatAirline(log.airline) : ""}
                            {log.flightNumber ? ` ${log.flightNumber}` : ""}
                            {log.errorMessage
                              ? ` · Erro: ${log.errorMessage}`
                              : ""}
                          </p>
                        )}
                      </div>
                      {/* Dispositivos */}
                      <div className="ml-auto text-right text-sm text-gray-600 sm:ml-0">
                        <span
                          className={
                            log.devicesReached === 0
                              ? "text-red-400"
                              : "text-green-600"
                          }
                        >
                          {log.devicesReached}
                        </span>
                        <span className="text-gray-400">
                          /{log.totalDevices}
                        </span>
                      </div>
                      {/* Timestamp */}
                      <div className="basis-full text-left text-xs text-gray-400 sm:basis-auto sm:text-right">
                        {formatDatetimeBRT(
                          log.sentAt instanceof Date
                            ? log.sentAt.toISOString()
                            : String(log.sentAt)
                        )}
                      </div>
                    </div>
                  ))}
                  {logsQuery.hasNextPage && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logsQuery.fetchNextPage()}
                        disabled={logsQuery.isFetchingNextPage}
                        className="gap-2"
                      >
                        {logsQuery.isFetchingNextPage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          "Carregar mais"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Resumo */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ações
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              onClick={() => sendTestMutation.mutate({ year: selectedYear })}
              disabled={
                sendTestMutation.isPending ||
                (data?.totalSubscriptions ?? 0) === 0
              }
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto"
            >
              {sendTestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Enviar Notificação de Teste
                </>
              )}
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Plane className="w-4 h-4" />
                Ver Voos
              </Button>
            </Link>
          </div>
          {testFeedback && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${
                testFeedback.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {testFeedback.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{testFeedback.message}</span>
            </div>
          )}
          <LastAdminFormAction action={lastPushAction} onClear={clearPushAction} />
          {(data?.totalSubscriptions ?? 0) === 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Nenhum dispositivo registrado. Ative as notificações primeiro.
            </p>
          )}
        </div>

        {/* Rodapé com hora do servidor */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">
            Hora do servidor (UTC):{" "}
            {data?.serverTime
              ? new Date(data.serverTime).toLocaleString("pt-BR", {
                  timeZone: "UTC",
                })
              : "—"}
            {" · "}
            Hora de Brasília:{" "}
            {data?.serverTime
              ? new Date(data.serverTime).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Seção: Notificações por E-mail de Bilhetes */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                Notificações por E-mail
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Gerenciar destinatários de alertas de alteração de bilhetes
              </p>
            </div>
          </div>
        </div>
          <TicketNotificationEmailsSection onRecordAction={registerTimelineAction} />
        </div>
    </ContentReveal>
  );
}

/**
 * Seção de gerenciamento de e-mails de notificação de bilhetes
 */
function TicketNotificationEmailsSection({
  onRecordAction,
}: {
  onRecordAction: (
    source: AdminActionTimelineEntry["source"],
    action: AdminFormAction
  ) => void;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [showTestForm, setShowTestForm] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [lastRecipientsAction, setLastRecipientsAction] =
    useState<AdminFormAction | null>(() =>
      readAdminFormAction("viagens.admin.last-recipient-action")
    );
  const [lastTestEmailAction, setLastTestEmailAction] =
    useState<AdminFormAction | null>(() =>
      readAdminFormAction("viagens.admin.last-test-email-action")
    );

  const registerRecipientsAction = (
    label: string,
    status: AdminFormAction["status"]
  ) => {
    const action = { label, status, timestamp: new Date().toISOString() };
    setLastRecipientsAction(action);
    saveAdminFormAction("viagens.admin.last-recipient-action", action);
    onRecordAction("recipients", action);
  };
  const registerTestEmailAction = (
    label: string,
    status: AdminFormAction["status"]
  ) => {
    const action = { label, status, timestamp: new Date().toISOString() };
    setLastTestEmailAction(action);
    saveAdminFormAction("viagens.admin.last-test-email-action", action);
    onRecordAction("test-email", action);
  };
  const clearRecipientsAction = () => {
    clearAdminFormAction("viagens.admin.last-recipient-action");
    setLastRecipientsAction(null);
    toast.success("Registro local de destinatários limpo.");
  };
  const clearTestEmailAction = () => {
    clearAdminFormAction("viagens.admin.last-test-email-action");
    setLastTestEmailAction(null);
    toast.success("Registro local de e-mail de teste limpo.");
  };

  const { data: recipients, refetch } =
    trpc.ticketNotifications.getRecipients.useQuery();

  const addRecipientMutation =
    trpc.ticketNotifications.addRecipient.useMutation({
      onSuccess: () => {
        const message = "Destinatário adicionado com sucesso.";
        setEmailFeedback({ kind: "success", message });
        registerRecipientsAction("Destinatário adicionado", "success");
        toast.success(message);
        setNewEmail("");
        setNewName("");
        refetch();
      },
      onError: err => {
        const message = err.message || "Erro ao adicionar e-mail.";
        setEmailFeedback({ kind: "error", message });
        registerRecipientsAction("Tentativa de adicionar destinatário", "error");
        toast.error(message);
      },
    });

  const removeRecipientMutation =
    trpc.ticketNotifications.removeRecipient.useMutation({
      onSuccess: () => {
        const message = "Destinatário removido com sucesso.";
        setEmailFeedback({ kind: "success", message });
        registerRecipientsAction("Destinatário removido", "success");
        toast.success(message);
        refetch();
      },
      onError: err => {
        const message = err.message || "Erro ao remover e-mail.";
        setEmailFeedback({ kind: "error", message });
        registerRecipientsAction("Tentativa de remover destinatário", "error");
        toast.error(message);
      },
    });

  const sendTestEmailMutation =
    trpc.ticketNotifications.sendTestEmail.useMutation({
      onSuccess: () => {
        const message = "E-mail de teste enviado com sucesso.";
        setEmailFeedback({ kind: "success", message });
        registerTestEmailAction("E-mail de teste enviado", "success");
        toast.success(message);
        setTestEmail("");
        setShowTestForm(false);
      },
      onError: err => {
        const message = err.message || "Erro ao enviar e-mail de teste.";
        setEmailFeedback({ kind: "error", message });
        registerTestEmailAction("Tentativa de envio de e-mail de teste", "error");
        toast.error(message);
      },
    });

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Digite um e-mail válido.");
      return;
    }
    addRecipientMutation.mutate({
      email: newEmail,
      name: newName || undefined,
    });
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      toast.error("Digite um e-mail válido.");
      return;
    }
    sendTestEmailMutation.mutate({ testEmail });
  };

  return (
    <div className="space-y-5 p-4 sm:p-5">
      {emailFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200 ${
            emailFeedback.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {emailFeedback.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{emailFeedback.message}</span>
        </div>
      )}
      {/* Formulário para adicionar novo e-mail */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-gray-800 mb-3 text-sm">
          Adicionar Novo Destinatário
        </h3>
        <form onSubmit={handleAddRecipient} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="new-recipient-email" className="sr-only">
                E-mail
              </label>
              <input
                id="new-recipient-email"
                type="email"
                placeholder="E-mail"
                aria-label="E-mail do novo destinatário"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="new-recipient-name" className="sr-only">
                Nome (opcional)
              </label>
              <input
                id="new-recipient-name"
                type="text"
                placeholder="Nome (opcional)"
                aria-label="Nome do novo destinatário (opcional)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <Button
              type="submit"
              disabled={addRecipientMutation.isPending}
              className="w-full bg-purple-600 text-white gap-2 hover:bg-purple-700 sm:w-auto"
            >
              {addRecipientMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>+</span>
              )}
              {addRecipientMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
        <LastAdminFormAction
          action={lastRecipientsAction}
          onClear={clearRecipientsAction}
        />
      </div>

      {/* Lista de destinatários */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3 text-sm">
          Destinatários Cadastrados ({recipients?.length ?? 0})
        </h3>
        {recipients && recipients.length > 0 ? (
          <div className="space-y-2">
            {recipients.map(recipient => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {recipient.email}
                  </p>
                  {recipient.name && (
                    <p className="text-xs text-gray-500 truncate">
                      {recipient.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    removeRecipientMutation.mutate({ emailId: recipient.id })
                  }
                  disabled={removeRecipientMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                  aria-label="Remover destinatário"
                  title="Remover destinatário"
                >
                  {removeRecipientMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            <p>Nenhum destinatário cadastrado.</p>
            <p className="text-xs mt-1">
              Adicione e-mails acima para receber notificações.
            </p>
          </div>
        )}
      </div>

      {/* Botão para enviar e-mail de teste */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowTestForm(!showTestForm)}
          className="w-full gap-2 sm:w-auto"
        >
          <FlaskConical className="w-4 h-4" />
          {showTestForm ? "Cancelar" : "Enviar E-mail de Teste"}
        </Button>
      </div>
      <LastAdminFormAction
        action={lastTestEmailAction}
        onClear={clearTestEmailAction}
      />

      {/* Formulário para enviar e-mail de teste */}
      {showTestForm && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-gray-800 mb-3 text-sm">
            Enviar E-mail de Teste
          </h3>
          <form onSubmit={handleSendTestEmail} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="test-email" className="sr-only">
                E-mail para teste
              </label>
              <input
                id="test-email"
                type="email"
                placeholder="E-mail para teste"
                aria-label="E-mail para envio de teste"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button
                type="submit"
                disabled={sendTestEmailMutation.isPending}
                className="w-full bg-blue-600 text-white gap-2 hover:bg-blue-700 sm:w-auto"
              >
                {sendTestEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Isso enviará um e-mail de teste para verificar se a configuração
              SMTP está funcionando corretamente.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
