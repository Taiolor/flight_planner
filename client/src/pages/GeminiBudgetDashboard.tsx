import React, { useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContentReveal } from "@/components/ContentReveal";
import { Input } from "@/components/ui/input";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { queryCachePolicies } from "@/lib/queryCache";
import { trpc } from "@/lib/trpc";
import {
  BellRing,
  Bot,
  CircleAlert,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const GEMINI_BUDGET_BACK_ROUTE = "/";

type BudgetForm = {
  budgetReais: string;
  inputCost: string;
  outputCost: string;
  warning: string;
  critical: string;
  limit: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
};

function formatBrlMicrocents(microcents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(microcents / 100_000_000);
}

function formatBrl(cents: number) {
  return formatBrlMicrocents(cents * 1_000_000);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function buildForm(settings: {
  monthlyBudgetCents: number;
  inputCostCentsPerMillion: number;
  outputCostCentsPerMillion: number;
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  limitThresholdPercent: number;
  emailAlertsEnabled: number;
  pushAlertsEnabled: number;
}): BudgetForm {
  return {
    budgetReais: (settings.monthlyBudgetCents / 100).toFixed(2),
    inputCost: String(settings.inputCostCentsPerMillion),
    outputCost: String(settings.outputCostCentsPerMillion),
    warning: String(settings.warningThresholdPercent),
    critical: String(settings.criticalThresholdPercent),
    limit: String(settings.limitThresholdPercent),
    emailEnabled: settings.emailAlertsEnabled === 1,
    pushEnabled: settings.pushAlertsEnabled === 1,
  };
}

function numericValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function GeminiBudgetDashboard() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;
  const isAdmin = authCheckQuery.data?.isAdmin ?? false;

  if (authCheckQuery.isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <StandardPageHeader icon={Bot} title="Gemini · Orçamento" backHref={GEMINI_BUDGET_BACK_ROUTE} />
        <LoginRequiredScreen
          icon={ShieldCheck}
          title="Painel administrativo protegido"
          description="Entre com a sessão interna para consultar métricas de consumo e modificar os limites do Fly.IA."
          onLogin={() => setShowLoginModal(true)}
          resource="gemini-budget"
        />
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <StandardPageHeader icon={Bot} title="Gemini · Orçamento" backHref={GEMINI_BUDGET_BACK_ROUTE} />
        <div className="flex min-h-[calc(100vh-60px)] items-center px-4 py-16">
          <Card className="mx-auto max-w-lg border-slate-700 bg-slate-900 p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-cyan-300" />
            <h2 className="mt-4 text-xl font-bold">Painel administrativo protegido</h2>
            <p className="mt-2 text-sm text-slate-300">
              Somente administradores podem consultar métricas de consumo e modificar os limites internos do Fly.IA.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return <GeminiBudgetContent />;
}

function GeminiBudgetContent() {
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.geminiBudget.dashboard.useQuery(undefined, queryCachePolicies.admin);
  const memoryQuery = trpc.flyIaMemory.dashboard.useQuery(undefined, queryCachePolicies.admin);
  const voiceQuery = trpc.flyIaVoice.dashboard.useQuery(undefined, queryCachePolicies.admin);
  const updateSettings = trpc.geminiBudget.updateSettings.useMutation({
    onSuccess: async () => {
      await utils.geminiBudget.dashboard.invalidate();
      toast.success("Limites de orçamento atualizados.");
    },
    onError: error => toast.error(error.message || "Não foi possível salvar a configuração."),
  });
  const [form, setForm] = useState<BudgetForm | null>(null);

  useEffect(() => {
    if (dashboardQuery.data?.settings) {
      setForm(buildForm(dashboardQuery.data.settings));
    }
  }, [dashboardQuery.data?.settings]);

  const data = dashboardQuery.data;
  const snapshot = data?.snapshot;
  const isLoading = dashboardQuery.isLoading || !form;
  const barColor = useMemo(() => {
    if (!snapshot) return "bg-cyan-500";
    if (snapshot.isAtLimit) return "bg-rose-500";
    if (snapshot.usagePercent >= snapshot.settings.criticalThresholdPercent) return "bg-amber-400";
    return "bg-cyan-500";
  }, [snapshot]);

  const saveSettings = () => {
    if (!form) return;
    updateSettings.mutate({
      monthlyBudgetCents: Math.max(1, Math.round(numericValue(form.budgetReais) * 100)),
      inputCostCentsPerMillion: Math.max(0, Math.round(numericValue(form.inputCost))),
      outputCostCentsPerMillion: Math.max(0, Math.round(numericValue(form.outputCost))),
      warningThresholdPercent: Math.max(1, Math.round(numericValue(form.warning))),
      criticalThresholdPercent: Math.max(1, Math.round(numericValue(form.critical))),
      limitThresholdPercent: Math.max(1, Math.round(numericValue(form.limit))),
      emailAlertsEnabled: form.emailEnabled,
      pushAlertsEnabled: form.pushEnabled,
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 pb-12 text-white">
      <StandardPageHeader
        icon={Bot}
        title="Gemini · Orçamento"
        backHref={GEMINI_BUDGET_BACK_ROUTE}
        actions={
          <Button
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-cyan-700"
            onClick={() => void Promise.all([dashboardQuery.refetch(), memoryQuery.refetch(), voiceQuery.refetch()])}
            disabled={dashboardQuery.isFetching || memoryQuery.isFetching || voiceQuery.isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${dashboardQuery.isFetching || memoryQuery.isFetching || voiceQuery.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <div className="container space-y-5 py-6">
        <Card className="border-cyan-900/60 bg-cyan-950/30 p-4">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <p className="text-sm text-cyan-50">
              Os valores abaixo são estimativas internas calculadas pelos tokens registrados no SmartFly. Consulte o AI Studio para saldo e cobrança oficiais.
            </p>
          </div>
        </Card>

        {dashboardQuery.error ? (
          <Card className="border-rose-900 bg-rose-950/30 p-8 text-center text-rose-100">
            Não foi possível carregar o monitoramento administrativo nesta sessão.
          </Card>
        ) : isLoading || !snapshot ? (
          <PageLoading compact />
        ) : (
          <ContentReveal>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={<WalletCards />} label="Custo estimado" value={formatBrlMicrocents(snapshot.estimatedCostMicrocents)} note={`Ciclo ${snapshot.yearMonth} · precisão por token`} />
              <MetricCard icon={<Bot />} label="Orçamento interno" value={formatBrl(snapshot.monthlyBudgetCents)} note="Configurável pelo administrador" />
              <MetricCard icon={<Zap />} label="Uso do orçamento" value={`${snapshot.usagePercent.toLocaleString("pt-BR")}%`} note={snapshot.isAtLimit ? "Teto alcançado" : "Acompanhamento ativo"} />
              <MetricCard icon={<Send />} label="Consultas no mês" value={formatNumber(snapshot.requestsCount)} note={`${formatNumber(snapshot.totalTokens)} tokens totais`} />
            </section>

            <Card className="border-violet-900/60 bg-violet-950/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold"><Bot className="h-5 w-5 text-violet-300" />Memória de sessão · últimos 30 dias</h2>
                  <p className="mt-1 text-sm text-slate-400">Somente métricas são registradas: perguntas e respostas brutas não aparecem neste painel.</p>
                </div>
                <Badge variant="outline" className="border-violet-500/60 text-violet-100">
                  {memoryQuery.data?.retentionHours ?? 8}h de retenção
                </Badge>
              </div>
              {memoryQuery.error ? (
                <p className="mt-4 text-sm text-amber-200">A memória está ativa, mas os indicadores ainda não puderam ser carregados.</p>
              ) : (
                <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <MetricCard icon={<Bot />} label="Sessões ativas" value={formatNumber(memoryQuery.data?.activeSessions ?? 0)} note="Com resumo temporário" />
                  <MetricCard icon={<Send />} label="Conversas medidas" value={formatNumber(memoryQuery.data?.metrics.requests ?? 0)} note="Últimos 30 dias" />
                  <MetricCard icon={<Zap />} label="Contexto poupado" value={`${formatNumber(memoryQuery.data?.metrics.averageSavedChars ?? 0)} car.`} note="Média por conversa" />
                  <MetricCard icon={<Clock3 />} label="Latência média" value={`${formatNumber(memoryQuery.data?.metrics.averageLatencyMs ?? 0)} ms`} note="Respostas medidas" />
                  <MetricCard icon={<Send />} label="Tokens médios" value={formatNumber(memoryQuery.data?.metrics.averageTokens ?? 0)} note="Entrada e saída" />
                  <MetricCard icon={<CircleAlert />} label="Sem resposta" value={formatNumber(memoryQuery.data?.metrics.unanswered ?? 0)} note="Falhas do provedor" />
                </section>
              )}
            </Card>

            <Card className="border-sky-900/60 bg-sky-950/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold"><Clock3 className="h-5 w-5 text-sky-300" />Voz · últimos {voiceQuery.data?.periodDays ?? 30} dias</h2>
                  <p className="mt-1 text-sm text-slate-400">Somente duração, tamanho, resultado e latência. Áudio e texto transcrito não são armazenados.</p>
                </div>
                <Badge variant="outline" className="border-sky-500/60 text-sky-100">Telemetria privada</Badge>
              </div>
              {voiceQuery.error ? (
                <p className="mt-4 text-sm text-amber-200">As transcrições continuam disponíveis, mas os indicadores de voz não puderam ser carregados.</p>
              ) : (
                <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <MetricCard icon={<Send />} label="Tentativas" value={formatNumber(voiceQuery.data?.requests ?? 0)} note="Áudio recebido" />
                  <MetricCard icon={<Bot />} label="Transcritas" value={formatNumber(voiceQuery.data?.transcribed ?? 0)} note="Com texto utilizável" />
                  <MetricCard icon={<CircleAlert />} label="Sem resultado" value={formatNumber(voiceQuery.data?.failed ?? 0)} note="Falha, vazio ou rejeitado" />
                  <MetricCard icon={<Clock3 />} label="Áudio total" value={`${((voiceQuery.data?.totalDurationMs ?? 0) / 60_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min`} note="Duração estimada" />
                  <MetricCard icon={<Clock3 />} label="Duração média" value={`${((voiceQuery.data?.averageDurationMs ?? 0) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`} note="Por tentativa" />
                  <MetricCard icon={<Zap />} label="Latência média" value={`${formatNumber(voiceQuery.data?.averageLatencyMs ?? 0)} ms`} note="Transcrição e resposta" />
                </section>
              )}
            </Card>

            <Card className="border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Orçamento de {snapshot.yearMonth}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatBrlMicrocents(snapshot.estimatedCostMicrocents)} estimados de {formatBrl(snapshot.monthlyBudgetCents)}.
                  </p>
                </div>
                <Badge className={snapshot.isAtLimit ? "bg-rose-500 text-white" : "bg-cyan-600 text-white"}>
                  {snapshot.isAtLimit ? "Consultas bloqueadas" : "Acompanhamento ativo"}
                </Badge>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800" aria-label="Uso estimado do orçamento">
                <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, snapshot.usagePercent)}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Aviso: {snapshot.settings.warningThresholdPercent}%</span>
                <span>Crítico: {snapshot.settings.criticalThresholdPercent}%</span>
                <span>Teto: {snapshot.settings.limitThresholdPercent}%</span>
              </div>
            </Card>

            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2"><BellRing className="h-5 w-5 text-cyan-300" /><h2 className="font-semibold">Configurar alertas</h2></div>
                <p className="mt-1 text-sm text-slate-400">Cada faixa gera somente um e-mail e um push por ciclo mensal.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Orçamento mensal (R$)"><Input inputMode="decimal" value={form.budgetReais} onChange={event => setForm({ ...form, budgetReais: event.target.value })} /></Field>
                  <Field label="Aviso inicial (%)"><Input inputMode="numeric" value={form.warning} onChange={event => setForm({ ...form, warning: event.target.value })} /></Field>
                  <Field label="Alerta crítico (%)"><Input inputMode="numeric" value={form.critical} onChange={event => setForm({ ...form, critical: event.target.value })} /></Field>
                  <Field label="Teto de bloqueio (%)"><Input inputMode="numeric" value={form.limit} onChange={event => setForm({ ...form, limit: event.target.value })} /></Field>
                  <Field label="Entrada (centavos / 1M tokens)"><Input inputMode="numeric" value={form.inputCost} onChange={event => setForm({ ...form, inputCost: event.target.value })} /></Field>
                  <Field label="Saída (centavos / 1M tokens)"><Input inputMode="numeric" value={form.outputCost} onChange={event => setForm({ ...form, outputCost: event.target.value })} /></Field>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Toggle checked={form.emailEnabled} onChange={checked => setForm({ ...form, emailEnabled: checked })} icon={<Mail className="h-4 w-4" />} label="E-mail ao administrador" />
                  <Toggle checked={form.pushEnabled} onChange={checked => setForm({ ...form, pushEnabled: checked })} icon={<BellRing className="h-4 w-4" />} label="Push ao proprietário" />
                </div>
                <Button className="mt-5 w-full sm:w-auto" onClick={saveSettings} disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Salvar limites
                </Button>
              </Card>

              <Card className="border-slate-800 bg-slate-900 p-5">
                <h2 className="font-semibold">Alertas enviados</h2>
                <p className="mt-1 text-sm text-slate-400">Histórico de cruzamentos de faixa, sem conteúdo de conversas.</p>
                <div className="mt-4 space-y-3">
                  {data.alerts.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">Nenhum alerta de orçamento foi disparado ainda.</p>
                  ) : data.alerts.map(alert => (
                    <div key={alert.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center justify-between gap-3"><span className="font-medium">{alert.thresholdPercent}% · {alert.yearMonth}</span><Badge variant="outline" className="border-slate-600 text-slate-200">{alert.status}</Badge></div>
                      <p className="mt-1 text-sm text-slate-400">Estimativa: {formatBrlMicrocents(Number(alert.estimatedCostMicrocents ?? 0))} · e-mail {alert.emailSent ? "enviado" : "indisponível"} · push {alert.pushSent ? "enviado" : "indisponível"}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold">Evolução dos últimos seis ciclos</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {data.history.map(item => (
                  <div key={item.yearMonth} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-xs font-medium text-slate-400">{item.yearMonth}</p>
                    <p className="mt-2 text-lg font-semibold">{formatBrlMicrocents(Number(item.estimatedCostMicrocents ?? 0))}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatNumber(Number(item.requestsCount))} consultas · {formatNumber(Number(item.totalTokens))} tokens</p>
                  </div>
                ))}
              </div>
            </Card>
          </ContentReveal>
        )}
      </div>
    </main>
  );
}

function PageLoading({ compact = false }: { compact?: boolean }) {
  return <div className={`flex ${compact ? "min-h-[240px]" : "min-h-screen"} items-center justify-center bg-slate-950 text-slate-300`}><Loader2 className="mr-3 h-6 w-6 animate-spin text-cyan-300" />Carregando painel...</div>;
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Card className="border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-300"><span className="text-cyan-300">{icon}</span>{label}</div><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm text-slate-300"><span>{label}</span>{children}</label>;
}

function Toggle({ checked, onChange, icon, label }: { checked: boolean; onChange: (checked: boolean) => void; icon: React.ReactNode; label: string }) {
  return <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-200"><span className="flex items-center gap-2">{icon}{label}</span><input aria-label={label} type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-500" /></label>;
}
