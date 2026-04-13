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
  Plane,
  ChevronRight,
  Timer,
  Wifi,
  WifiOff,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Componente para botão de teste do próximo alerta
function TestNextAlertButton() {
  const [isLoading, setIsLoading] = useState(false);
  const sendNextAlertMutation = trpc.adminNotifications.sendNextAlert.useMutation({
    onSuccess: (result) => {
      toast.success(`Notificação enviada para ${result.sent} dispositivo(s)!`);
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar notificação.");
      setIsLoading(false);
    },
  });

  const handleTest = async () => {
    setIsLoading(true);
    await sendNextAlertMutation.mutateAsync();
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
      onClick={handleTest}
      disabled={isLoading}
    >
      <FlaskConical className="w-4 h-4" />
      {isLoading ? "Enviando..." : "Testar"}
    </Button>
  );
}

const AIRLINE_NAMES: Record<string, string> = {
  LA: "LATAM", la: "LATAM", latam: "LATAM", LATAM: "LATAM",
  G3: "Gol", g3: "Gol", gol: "Gol", GOL: "Gol",
  AD: "Azul", ad: "Azul", azul: "Azul", AZUL: "Azul",
};

function formatAirline(code: string): string {
  return AIRLINE_NAMES[code] ?? code;
}

function formatRelativeTime(isoString: string): string {
  const target = new Date(isoString);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < -60 * 24) {
    const days = Math.round(Math.abs(diffMin) / (60 * 24));
    return `há ${days} dia${days !== 1 ? "s" : ""}`;
  }
  if (diffMin < -60) {
    const hours = Math.round(Math.abs(diffMin) / 60);
    return `há ${hours}h`;
  }
  if (diffMin < 0) return `há ${Math.abs(diffMin)}min`;
  if (diffMin === 0) return "agora";
  if (diffMin < 60) return `em ${diffMin}min`;
  if (diffMin < 60 * 24) {
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `em ${hours}h ${mins}min` : `em ${hours}h`;
  }
  const days = Math.floor(diffMin / (60 * 24));
  const hours = Math.floor((diffMin % (60 * 24)) / 60);
  return hours > 0 ? `em ${days}d ${hours}h` : `em ${days}d`;
}

function formatDatetimeBRT(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

type AlertStatus = "pending" | "sent" | "past";

function StatusBadge({ status }: { status: AlertStatus }) {
  if (status === "sent") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Enviando
      </Badge>
    );
  }
  if (status === "past") {
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200 gap-1">
        <History className="w-3 h-3" /> Passado
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
      <Timer className="w-3 h-3" /> Aguardando
    </Badge>
  );
}

export default function AdminNotifications() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data, isLoading, error, refetch, isFetching } =
    trpc.adminNotifications.getStatus.useQuery(undefined, {
      refetchInterval: autoRefresh ? 60_000 : false,
    });

  const { data: logs, refetch: refetchLogs } =
    trpc.adminNotifications.getLogs.useQuery(
      { limit: 100 },
      { refetchInterval: autoRefresh ? 60_000 : false }
    );

  const sendTestMutation = trpc.push.sendTest.useMutation({
    onSuccess: (result) => {
      toast.success(`Notificação de teste enviada para ${result.sent} dispositivo(s).`);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar notificação de teste.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-gray-700 font-medium">Acesso negado</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingAlerts = data?.scheduledAlerts.filter(a => a.status === "pending") ?? [];
  const sentAlerts = data?.scheduledAlerts.filter(a => a.status === "sent") ?? [];
  const pastAlerts = data?.scheduledAlerts.filter(a => a.status === "past") ?? [];
  const nextAlert = pendingAlerts[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h1 className="font-semibold text-gray-800">Painel de Notificações</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
              className={`gap-2 text-sm ${autoRefresh ? "text-green-600" : "text-gray-500"}`}
            >
              {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{autoRefresh ? "Auto" : "Manual"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Voos Emitidos</p>
            <p className="text-2xl font-bold text-gray-800">{data?.totalIssuedFlights ?? 0}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Alertas Pendentes</p>
            <p className="text-2xl font-bold text-gray-800">{pendingAlerts.length}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dispositivos</p>
            <p className="text-2xl font-bold text-gray-800">{data?.totalSubscriptions ?? 0}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-gray-400">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avisos Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{data?.avisos.length ?? 0}</p>
          </Card>
        </div>

        {/* Próximo alerta */}
        {nextAlert && (
          <Card className="p-5 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-0.5">Próximo Alerta</p>
                  <p className="font-semibold text-gray-800">
                    Semana {nextAlert.weekNumber} — {nextAlert.direction === "ida" ? "✈️ Ida" : "🏠 Volta"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatAirline(nextAlert.airline)} {nextAlert.flightNumber} · {nextAlert.avisoLabel} ({nextAlert.avisoMinutes >= 60 ? `${nextAlert.avisoMinutes / 60}h` : `${nextAlert.avisoMinutes}min`} antes)
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-700">{formatRelativeTime(nextAlert.alertDatetime)}</p>
                  <p className="text-xs text-gray-500">{formatDatetimeBRT(nextAlert.alertDatetime)}</p>
                </div>
                <TestNextAlertButton />
              </div>
            </div>
          </Card>
        )}

        {/* Configurações ativas */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Configurações de Aviso</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {data?.avisos.map((aviso, i) => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Aviso {i + 1}</p>
                  <p className="text-sm text-gray-500">{aviso.label} antes do voo</p>
                </div>
                <Badge className="ml-auto bg-indigo-100 text-indigo-700 border-indigo-200">Ativo</Badge>
              </Card>
            ))}
            {(!data?.avisos || data.avisos.length === 0) && (
              <Card className="p-4 flex items-center gap-3 col-span-2">
                <BellOff className="w-5 h-5 text-gray-400" />
                <p className="text-gray-500 text-sm">Nenhum aviso configurado. Configure em Notificações.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Tabela de alertas agendados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Alertas Agendados ({data?.scheduledAlerts.length ?? 0})
            </h2>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Pendente</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Enviando</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Passado</span>
            </div>
          </div>

          <Card className="overflow-hidden">
            {data?.scheduledAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum alerta agendado.</p>
                <p className="text-gray-400 text-xs mt-1">Configure os avisos no popup de Notificações.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Pendentes primeiro */}
                {pendingAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Aguardando envio ({pendingAlerts.length})</p>
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
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Enviando agora ({sentAlerts.length})</p>
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
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Voos passados ({pastAlerts.length})</p>
                    </div>
                    {pastAlerts.map((alert, i) => (
                      <AlertRow key={`past-${i}`} alert={alert} />
                    ))}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Dispositivos registrados */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Dispositivos Registrados ({data?.totalSubscriptions ?? 0})
          </h2>
          <Card className="overflow-hidden">
            {(!data?.subscriptions || data.subscriptions.length === 0) ? (
              <div className="p-8 text-center">
                <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum dispositivo registrado.</p>
                <p className="text-gray-400 text-xs mt-1">Ative as notificações no botão "Notificações" do cabeçalho.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.subscriptions.map((sub, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 font-medium truncate">{sub.userAgent}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{sub.endpoint}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200 flex-shrink-0">Ativo</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Histórico Persistente de Envios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Histórico de Envios ({logs?.length ?? 0})
            </h2>
            <button
              onClick={() => refetchLogs()}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>
          <Card className="overflow-hidden">
            {(!logs || logs.length === 0) ? (
              <div className="p-8 text-center">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum envio registrado ainda.</p>
                <p className="text-gray-400 text-xs mt-1">Os próximos envios automáticos e testes aparecerão aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <span>Status</span>
                  <span>Voo</span>
                  <span className="text-right">Dispositivos</span>
                  <span className="text-right">Enviado em</span>
                </div>
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center px-4 py-3">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.isTest ? (
                          <span className="flex items-center gap-1 text-sm font-medium text-purple-700">
                            <FlaskConical className="w-3 h-3" /> Teste Manual
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-800">
                            Semana {log.weekNumber} — {log.direction === "ida" ? "✈️ Ida" : "🏠 Volta"}
                          </span>
                        )}
                        <Badge className="text-xs bg-indigo-50 text-indigo-600 border-indigo-100">{log.avisoLabel}</Badge>
                      </div>
                      {!log.isTest && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.airline ? formatAirline(log.airline) : ""}
                          {log.flightNumber ? ` ${log.flightNumber}` : ""}
                          {log.errorMessage ? ` · Erro: ${log.errorMessage}` : ""}
                        </p>
                      )}
                    </div>
                    {/* Dispositivos */}
                    <div className="text-right text-sm text-gray-600 flex-shrink-0">
                      <span className={log.devicesReached === 0 ? "text-red-400" : "text-green-600"}>
                        {log.devicesReached}
                      </span>
                      <span className="text-gray-400">/{log.totalDevices}</span>
                    </div>
                    {/* Timestamp */}
                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                      {formatDatetimeBRT(log.sentAt instanceof Date ? log.sentAt.toISOString() : String(log.sentAt))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Ações */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ações</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => sendTestMutation.mutate()}
              disabled={sendTestMutation.isPending || (data?.totalSubscriptions ?? 0) === 0}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4" />
              {sendTestMutation.isPending ? "Enviando..." : "Enviar Notificação de Teste"}
            </Button>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Plane className="w-4 h-4" />
                Ver Voos
              </Button>
            </Link>
          </div>
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
            Hora do servidor (UTC): {data?.serverTime ? new Date(data.serverTime).toLocaleString("pt-BR", { timeZone: "UTC" }) : "—"}
            {" · "}
            Hora de Brasília: {data?.serverTime ? new Date(data.serverTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente de linha de alerta
function AlertRow({ alert }: { alert: ReturnType<typeof getAlertType> }) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${alert.status === "past" ? "opacity-50" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        alert.direction === "ida" ? "bg-blue-100" : "bg-orange-100"
      }`}>
        <Plane className={`w-4 h-4 ${alert.direction === "ida" ? "text-blue-600" : "text-orange-500 rotate-180"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800 text-sm">Semana {alert.weekNumber}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-600 text-sm">{alert.direction === "ida" ? "Ida" : "Volta"}</span>
          {alert.airline && (
            <>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-gray-600 text-sm">{formatAirline(alert.airline)} {alert.flightNumber}</span>
            </>
          )}
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-xs text-indigo-600 font-medium">{alert.avisoLabel}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400">
            Alerta: {formatDatetimeBRT(alert.alertDatetime)}
          </span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-gray-400">
            Voo: {formatDatetimeBRT(alert.flightDatetime + (alert.flightDatetime.includes('T') && !alert.flightDatetime.includes('+') ? '-03:00' : ''))}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <StatusBadge status={alert.status} />
        {alert.status === "pending" && (
          <span className="text-xs text-gray-500">{formatRelativeTime(alert.alertDatetime)}</span>
        )}
      </div>
    </div>
  );
}

// Tipo auxiliar para o AlertRow
function getAlertType() {
  return {} as {
    weekNumber: number;
    direction: "ida" | "volta";
    avisoLabel: string;
    avisoMinutes: number;
    flightDatetime: string;
    alertDatetime: string;
    airline: string;
    flightNumber: string;
    status: "pending" | "sent" | "past";
    minutesUntilAlert: number;
  };
}
