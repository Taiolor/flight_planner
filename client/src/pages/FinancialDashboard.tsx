import { lazy, Suspense, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { useYear } from "@/contexts/YearContext";
import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { FinancialDashboardLoadingSkeleton } from "@/components/FinancialDashboardLoadingSkeleton";
import { TooltipLabel } from "@/components/ui/tooltip-label";
import { ContentReveal } from "@/components/ContentReveal";
import { MetricCard } from "@/components/MetricCard";
import { formatAirlineDisplayName } from "@/lib/airlinePresentation";
import { queryCachePolicies } from "@/lib/queryCache";
import {
  getLatestMonthlyKpiComparisons,
  type MonthlyKpiComparison,
} from "@/lib/monthlyKpiComparison";
import {
  buildMonthlyBudgetEnvelopes,
  getBudgetAlerts,
  getBudgetInsight,
} from "@/lib/financialBudget";
import type { FinancialChartProps } from "@/components/FinancialCharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Plane,
  Calendar,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

const FinancialChart = lazy(() => import("@/components/FinancialCharts"));

function DeferredFinancialChart(props: FinancialChartProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
          Carregando gráfico…
        </div>
      }
    >
      <FinancialChart {...props} />
    </Suspense>
  );
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "",
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MONTH_FULL_NAMES = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const AIRLINE_COLORS: Record<string, string> = {
  latam: "#E31837",
  gol: "#FF6600",
  azul: "#003DA5",
  onhappy: "#22C55E",
  desconhecida: "#94A3B8",
};

const AIRLINE_LABELS: Record<string, string> = {
  latam: "LATAM",
  gol: "GOL",
  azul: "AZUL",
  onhappy: "ONHAPPY",
  desconhecida: "OUTRA",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number, hidden = false): string {
  if (hidden) return "R$ ••••";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMiles(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value) + " pts";
}

function displayAirline(airline: string | null | undefined): string {
  const key = airline?.trim().toLowerCase() ?? "";
  return formatAirlineDisplayName(AIRLINE_LABELS[key] ?? airline);
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatBudgetInput(cents: number): string {
  return cents > 0 ? (cents / 100).toFixed(2) : "";
}

function toMonthlyKpiTrend(comparison: MonthlyKpiComparison | undefined) {
  if (!comparison) return undefined;

  return {
    value: comparison.value,
    label: `${MONTH_NAMES[comparison.currentMonth]}. vs. ${MONTH_NAMES[comparison.previousMonth]}.`,
  };
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const accentMap = {
    blue: "navy",
    green: "green",
    orange: "amber",
    purple: "violet",
    red: "rose",
  } as const;

  return <MetricCard title={title} value={value} subtitle={subtitle} icon={Icon} trend={trend} accent={accentMap[accent]} />;
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinancialDashboard() {
  const authCheckQuery = trpc.flightAuth.check.useQuery();
  const isAuthenticated = authCheckQuery.data?.authenticated ?? false;

  const [showLoginModal, setShowLoginModal] = useState(false);

  if (authCheckQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <LoginRequiredScreen
          icon={DollarSign}
          title="Financeiro protegido"
          description="Entre com a sessão interna para consultar investimentos, milhas e projeções do seu planejamento."
          loginLabel="Entrar para ver o Financeiro"
          onLogin={() => setShowLoginModal(true)}
          resource="financial"
        >
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao planejamento
            </Button>
          </Link>
        </LoginRequiredScreen>
        <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      </main>
    );
  }

  return <FinancialDashboardContent />;
}

function FinancialDashboardContent() {

  const { selectedYear, availableYears } = useYear();
  const [showValues, setShowValues] = useState(false);
  const [inflationRate, setInflationRate] = useState(5);
  const [tripsPerMonth, setTripsPerMonth] = useState(4);
  const [showProjections, setShowProjections] = useState(true);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [budgetFeedback, setBudgetFeedback] = useState("");
  const [copyAdjustmentPercent, setCopyAdjustmentPercent] = useState("0");
  const [copyConfirmationOpen, setCopyConfirmationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"cash" | "miles" | "comparison">(
    "cash"
  );

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: yearSummary, isLoading: loadingYear } =
    trpc.financial.getYearSummary.useQuery(
      { year: selectedYear },
      queryCachePolicies.financial
    );

  const { data: weeklyData, isLoading: loadingWeekly } =
    trpc.financial.getWeeklyData.useQuery(
      { year: selectedYear },
      queryCachePolicies.financial
    );

  const { data: monthlyBudgets = [], isLoading: loadingBudgets } =
    trpc.financial.getMonthlyBudgets.useQuery(
      { year: selectedYear },
      queryCachePolicies.financial
    );
  const utils = trpc.useUtils();
  const saveMonthlyBudget = trpc.financial.upsertMonthlyBudget.useMutation({
    onSuccess: (_, variables) => {
      setBudgetDrafts(current => {
        const next = { ...current };
        delete next[`${variables.year}-${variables.month}`];
        return next;
      });
      setBudgetFeedback(`Orçamento de ${MONTH_FULL_NAMES[variables.month]} atualizado.`);
      void utils.financial.getMonthlyBudgets.invalidate({ year: variables.year });
    },
    onError: () => {
      setBudgetFeedback("Não foi possível salvar o orçamento. Tente novamente.");
    },
  });
  const copyMonthlyBudgets = trpc.financial.copyMonthlyBudgets.useMutation({
    onSuccess: result => {
      setCopyConfirmationOpen(false);
      setBudgetFeedback(
        result.copiedCount > 0
          ? `${result.copiedCount} envelope(s) copiado(s) para ${result.targetYear}.`
          : `Não há envelopes configurados em ${selectedYear} para copiar.`
      );
      void utils.financial.getMonthlyBudgets.invalidate({
        year: result.targetYear,
      });
    },
    onError: () => {
      setBudgetFeedback("Não foi possível copiar os envelopes. Tente novamente.");
    },
  });

  const { data: projections, isLoading: loadingProjections } =
    trpc.financial.getProjections.useQuery(
      {
        baseYear: selectedYear,
        targetYear: selectedYear + 1,
        inflationRate: inflationRate / 100,
        tripsPerMonth,
      },
      {
        ...queryCachePolicies.financial,
        enabled: showProjections,
      }
    );

  // ─── Dados derivados ───────────────────────────────────────────────────────

  const monthlyChartData = useMemo(() => {
    if (!yearSummary?.byMonth) return [];
    return yearSummary.byMonth.map(m => ({
      month: MONTH_NAMES[m.month],
      monthFull: MONTH_FULL_NAMES[m.month],
      cashBRL: m.totalCashBRL,
      miles: m.totalMiles,
      trips: m.issuedCount,
      avgPrice: m.avgCashBRL,
      ...Object.fromEntries(
        Object.entries(m.byAirline).map(([k, v]) => [k + "_cash", v.cashBRL])
      ),
    }));
  }, [yearSummary]);

  const airlineChartData = useMemo(() => {
    if (!yearSummary?.byAirline) return [];
    return Object.entries(yearSummary.byAirline)
      .map(([airline, data]) => ({
        name: displayAirline(airline),
        airline,
        cashBRL: data.cashBRL,
        miles: data.miles,
        count: data.count,
        avgCash: data.count > 0 ? data.cashBRL / data.count : 0,
      }))
      .sort((a, b) => b.cashBRL - a.cashBRL);
  }, [yearSummary]);

  const weeklyTableData = useMemo(() => {
    if (!weeklyData) return [];
    const sorted = weeklyData
      .filter(w => w.isTicketIssued === 1)
      .sort((a, b) => a.weekNumber - b.weekNumber);

    // Calcular variação percentual entre semanas consecutivas
    return sorted.map((week, idx) => {
      let weekVariation = 0;
      if (idx > 0) {
        const prevPrice = sorted[idx - 1].paidPriceTotal ?? 0;
        const currPrice = week.paidPriceTotal ?? 0;
        if (prevPrice > 0) {
          weekVariation = ((currPrice - prevPrice) / prevPrice) * 100;
        }
      }
      return { ...week, weekVariation };
    });
  }, [weeklyData]);

  // ⚡ Bolt Optimization: Cache filtered miles data to avoid O(N) array allocation on every React render
  const milesTableData = useMemo(() => {
    return weeklyTableData.filter(w => (w.totalMiles ?? 0) > 0);
  }, [weeklyTableData]);

  // Tendência: comparar H1 vs H2
  const trendData = useMemo(() => {
    if (!yearSummary?.byMonth || yearSummary.byMonth.length < 2) return null;
    // ⚡ Bolt Optimization: Replace multiple array allocations (.filter, .reduce) with single-pass .reduce
    const { h1, h2 } = yearSummary.byMonth.reduce(
      (acc, m) => {
        if (m.month <= 6) acc.h1 += m.totalCashBRL;
        else acc.h2 += m.totalCashBRL;
        return acc;
      },
      { h1: 0, h2: 0 }
    );
    const trend = h1 > 0 ? ((h2 - h1) / h1) * 100 : 0;
    return { h1, h2, trend };
  }, [yearSummary]);

  const monthlyKpiComparisons = useMemo(
    () => getLatestMonthlyKpiComparisons(yearSummary?.byMonth ?? []),
    [yearSummary]
  );

  // Projeção por mês para gráfico
  const projectionChartData = useMemo(() => {
    if (!projections?.byMonth) return [];
    return projections.byMonth.map(m => ({
      month: MONTH_NAMES[m.month],
      projetado: m.projectedCashBRL,
      historico: m.historicCash,
      fator: m.seasonFactor,
    }));
  }, [projections]);

  const monthlyBudgetEnvelopes = useMemo(
    () => buildMonthlyBudgetEnvelopes(weeklyData ?? [], monthlyBudgets),
    [monthlyBudgets, weeklyData]
  );
  const budgetInsight = useMemo(
    () => getBudgetInsight(monthlyBudgetEnvelopes),
    [monthlyBudgetEnvelopes]
  );
  const budgetAlerts = useMemo(
    () => getBudgetAlerts(monthlyBudgetEnvelopes),
    [monthlyBudgetEnvelopes]
  );
  const nextPlanningYear =
    availableYears[availableYears.indexOf(selectedYear) + 1] ?? null;
  const budgetChartData = useMemo(
    () =>
      monthlyBudgetEnvelopes.map(envelope => ({
        month: MONTH_NAMES[envelope.month],
        budget: envelope.budgetCents / 100,
        realizado: envelope.realizedCents / 100,
        projetado: envelope.projectedCents / 100,
      })),
    [monthlyBudgetEnvelopes]
  );
  const saveBudgetForMonth = (month: number, fallbackCents: number) => {
    const key = `${selectedYear}-${month}`;
    const rawValue = budgetDrafts[key] ?? formatBudgetInput(fallbackCents);
    const normalized = rawValue.trim().replace(",", ".");
    const amount = normalized === "" ? 0 : Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) {
      setBudgetFeedback("Informe um orçamento válido, igual ou maior que zero.");
      return;
    }
    saveMonthlyBudget.mutate({
      year: selectedYear,
      month,
      budgetCents: Math.round(amount * 100),
    });
  };
  const copyBudgetsToNextYear = () => {
    if (!nextPlanningYear) return;
    const adjustmentPercent = Number(
      copyAdjustmentPercent.trim().replace(",", ".")
    );
    if (!Number.isFinite(adjustmentPercent)) {
      setBudgetFeedback("Informe um ajuste percentual válido.");
      return;
    }
    copyMonthlyBudgets.mutate({
      sourceYear: selectedYear,
      targetYear: nextPlanningYear,
      adjustmentPercent,
    });
  };

  const budgetNarrative =
    budgetInsight.status === "unconfigured"
      ? "Defina os envelopes mensais para acompanhar quanto pode ser comprometido em cada período."
      : budgetInsight.status === "exceeded"
        ? `A projeção ultrapassa o orçamento anual. ${budgetInsight.largestPressureMonth ? `${MONTH_FULL_NAMES[budgetInsight.largestPressureMonth]} concentra a maior pressão.` : ""}`
        : budgetInsight.status === "watch"
          ? "A projeção se aproxima do limite planejado; acompanhe os meses em amarelo antes de emitir novos bilhetes."
          : "A projeção atual permanece dentro do orçamento configurado para o exercício.";

  const isLoading = loadingYear || loadingWeekly || loadingBudgets;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#071a36] via-[#102f61] to-[#17427e] text-white px-4 py-3 flex items-center gap-3 flex-wrap shadow-lg sticky top-0 z-10">
        <Link href="/">
          <button
            aria-label="Voltar para a página inicial"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <DollarSign className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">
            Gestão Financeira {selectedYear}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <GlobalYearSelector compact className="border-white/30 bg-white/10 text-white hover:bg-white/20" />
          {/* Toggle mostrar/ocultar valores */}
          <TooltipLabel label={showValues ? "Ocultar valores financeiros" : "Mostrar valores financeiros"}>
            <button
              aria-label={
                showValues
                  ? "Ocultar valores financeiros"
                  : "Mostrar valores financeiros"
              }
              onClick={() => setShowValues(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {showValues ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {showValues ? "Ocultar" : "Mostrar"} valores
              </span>
            </button>
          </TooltipLabel>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-10">
        {isLoading ? (
          <FinancialDashboardLoadingSkeleton />
        ) : (
          <ContentReveal>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              title="Total Investido"
              value={formatBRL(yearSummary?.totalCashBRL ?? 0, !showValues)}
              subtitle={`${yearSummary?.issuedCount ?? 0} viagens emitidas`}
              icon={DollarSign}
              accent="blue"
              trend={toMonthlyKpiTrend(monthlyKpiComparisons.cash)}
            />
            <KpiCard
              title="Média por Viagem"
              value={formatBRL(yearSummary?.avgCashBRL ?? 0, !showValues)}
              subtitle="Passagens em dinheiro"
              icon={Plane}
              accent="green"
              trend={toMonthlyKpiTrend(monthlyKpiComparisons.averageCash)}
            />
            <KpiCard
              title="Milhas SMILES"
              value={formatMiles(yearSummary?.totalSmilesPoints ?? 0)}
              subtitle="Pontos gastos no ano"
              icon={Star}
              accent="orange"
              trend={toMonthlyKpiTrend(monthlyKpiComparisons.smiles)}
            />
            <KpiCard
              title="Milhas LATAM Pass"
              value={formatMiles(yearSummary?.totalLatamPassPoints ?? 0)}
              subtitle="Pontos gastos no ano"
              icon={Star}
              accent="purple"
              trend={toMonthlyKpiTrend(monthlyKpiComparisons.latamPass)}
            />
          </div>

          <section
            aria-labelledby="budget-envelope-title"
            className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm dark:border-violet-900/50 dark:bg-slate-900"
          >
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-4 dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-cyan-950/20 sm:p-6">
              <SectionHeader
                title="Orçamento, realizado e projetado"
                subtitle={`Envelope mensal de viagens para ${selectedYear}`}
                icon={WalletCards}
              />
              <div
                className={`rounded-xl border p-3 text-sm ${
                  budgetInsight.status === "exceeded"
                    ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                    : budgetInsight.status === "watch"
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                }`}
              >
                {budgetNarrative}
              </div>
              {budgetAlerts.length > 0 && (
                <div
                  role="alert"
                  className="mt-3 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    <strong>{budgetAlerts.length} envelope(s) em atenção.</strong>{" "}
                    {budgetAlerts
                      .slice(0, 2)
                      .map(alert => `${MONTH_FULL_NAMES[alert.month]}: ${alert.utilizationPercent}%`)
                      .join(" · ")}
                    {budgetAlerts.length > 2
                      ? " · Consulte os demais meses destacados abaixo."
                      : ""}
                  </p>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 xs:grid-cols-3">
                <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orçamento anual</p>
                  <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                    {formatBRL(budgetInsight.totalBudgetCents / 100, !showValues)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Realizado</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatBRL(budgetInsight.totalRealizedCents / 100, !showValues)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projetado</p>
                  <p className="mt-1 text-lg font-bold text-violet-700 dark:text-violet-400">
                    {formatBRL(budgetInsight.totalProjectedCents / 100, !showValues)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {budgetInsight.pendingWithoutQuoteCount > 0
                  ? `${budgetInsight.pendingWithoutQuoteCount} semana(s) pendente(s) ainda não possuem cotação e não entram na projeção.`
                  : "A projeção considera valores já emitidos e as melhores cotações registradas das semanas pendentes."}
              </p>
              {showValues && nextPlanningYear && (
                <div className="mt-4 rounded-xl border border-violet-200 bg-white/80 p-3 dark:border-violet-900/60 dark:bg-slate-800/80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Copiar envelopes para {nextPlanningYear}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Reaplica os envelopes configurados com um ajuste percentual opcional.
                      </p>
                    </div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor="budget-copy-adjustment">
                      Ajuste (%)
                      <input
                        id="budget-copy-adjustment"
                        type="number"
                        min="-50"
                        max="100"
                        step="0.5"
                        inputMode="decimal"
                        value={copyAdjustmentPercent}
                        onChange={event => setCopyAdjustmentPercent(event.target.value)}
                        className="mt-1 block w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={copyConfirmationOpen ? "default" : "outline"}
                        disabled={copyMonthlyBudgets.isPending}
                        onClick={() =>
                          copyConfirmationOpen
                            ? copyBudgetsToNextYear()
                            : setCopyConfirmationOpen(true)
                        }
                        className={copyConfirmationOpen ? "bg-violet-600 text-white hover:bg-violet-700" : "border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/40"}
                      >
                        {copyMonthlyBudgets.isPending
                          ? "Copiando"
                          : copyConfirmationOpen
                            ? "Confirmar cópia"
                            : "Copiar orçamento"}
                      </Button>
                      {copyConfirmationOpen && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setCopyConfirmationOpen(false)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                  {copyConfirmationOpen && (
                    <p className="mt-3 text-xs text-violet-800 dark:text-violet-200">
                      Confirme para substituir os envelopes existentes em {nextPlanningYear} pelos valores ajustados de {selectedYear}.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <DeferredFinancialChart
                kind="monthlyBudget"
                data={budgetChartData}
                hideValues={!showValues}
              />

              <div aria-live="polite" className="min-h-4 text-xs text-slate-500 dark:text-slate-400">
                {budgetFeedback}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {monthlyBudgetEnvelopes.map(envelope => {
                  const statusStyle =
                    envelope.status === "exceeded"
                      ? "border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20"
                      : envelope.status === "watch"
                        ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
                        : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30";
                  const draftKey = `${selectedYear}-${envelope.month}`;
                  const isSavingThisMonth =
                    saveMonthlyBudget.isPending &&
                    saveMonthlyBudget.variables?.month === envelope.month;

                  return (
                    <article key={envelope.month} className={`rounded-xl border p-3 ${statusStyle}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {MONTH_FULL_NAMES[envelope.month]}
                        </h3>
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                          {envelope.status === "unconfigured" ? "Definir" : envelope.status === "exceeded" ? "Acima" : envelope.status === "watch" ? "Atenção" : "Em linha"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="uppercase tracking-wide text-slate-400">Realizado</p>
                          <p className="mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatBRL(envelope.realizedCents / 100, !showValues)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="uppercase tracking-wide text-slate-400">Projetado</p>
                          <p className="mt-0.5 font-semibold text-violet-700 dark:text-violet-400">
                            {formatBRL(envelope.projectedCents / 100, !showValues)}
                          </p>
                        </div>
                      </div>
                      {showValues ? (
                        <>
                          <label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-slate-300" htmlFor={`budget-${selectedYear}-${envelope.month}`}>
                            Orçamento mensal (R$)
                          </label>
                          <div className="mt-1 flex gap-2">
                            <input
                              id={`budget-${selectedYear}-${envelope.month}`}
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={budgetDrafts[draftKey] ?? formatBudgetInput(envelope.budgetCents)}
                              onChange={event => setBudgetDrafts(current => ({ ...current, [draftKey]: event.target.value }))}
                              placeholder="0,00"
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSavingThisMonth}
                              onClick={() => saveBudgetForMonth(envelope.month, envelope.budgetCents)}
                              className="shrink-0 bg-violet-600 text-xs text-white hover:bg-violet-700"
                            >
                              {isSavingThisMonth ? "Salvando" : "Salvar"}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          Exiba os valores para configurar este orçamento.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

        {/* ── Tabs de análise ── */}
        <div>
          <div
            role="tablist"
            aria-label="Análise financeira"
            className="flex gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full sm:w-fit mb-4 sm:mb-6"
          >
            {(["cash", "miles", "comparison"] as const).map(tab => (
              <button
                key={tab}
                role="tab"
                id={`tab-${tab}`}
                aria-selected={activeTab === tab}
                aria-controls={`tabpanel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab === "cash" && "💰 Dinheiro"}
                {tab === "miles" && "✈️ Milhas"}
                {tab === "comparison" && "📊 Companhias"}
              </button>
            ))}
          </div>

          {/* ── Tab: Dinheiro ── */}
          {activeTab === "cash" && (
            <div role="tabpanel" id="tabpanel-cash" aria-labelledby="tab-cash" className="space-y-6">
              {/* Gráfico de barras mensal */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Gastos Mensais em Dinheiro"
                  subtitle={`Total por mês em ${selectedYear}`}
                  icon={DollarSign}
                />
                {monthlyChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Nenhum dado disponível para {selectedYear}
                  </div>
                ) : (
                  <DeferredFinancialChart
                    kind="monthlyCash"
                    data={monthlyChartData}
                    hideValues={!showValues}
                  />
                )}
              </div>

              {/* Gráfico de tendência (linha) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Tendência de Gastos"
                  subtitle="Evolução mensal e média acumulada"
                  icon={TrendingUp}
                />
                {monthlyChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Nenhum dado disponível
                  </div>
                ) : (
                  <DeferredFinancialChart
                    kind="cashTrend"
                    data={monthlyChartData}
                    hideValues={!showValues}
                  />
                )}
                {trendData && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        1º Semestre
                      </p>
                      <p className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 mt-1 break-all leading-tight">
                        {formatBRL(trendData.h1, !showValues)}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        2º Semestre
                      </p>
                      <p className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 mt-1 break-all leading-tight">
                        {formatBRL(trendData.h2, !showValues)}
                      </p>
                    </div>
                    <div
                      className={`rounded-xl p-3 text-center ${
                        trendData.trend >= 0
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "bg-green-50 dark:bg-green-900/20"
                      }`}
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Variação
                      </p>
                      <p
                        className={`text-base font-bold mt-1 ${
                          trendData.trend >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatPct(trendData.trend)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Milhas ── */}
          {activeTab === "miles" && (
            <div role="tabpanel" id="tabpanel-miles" aria-labelledby="tab-miles" className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Gastos em Milhas por Mês"
                  subtitle="SMILES + LATAM Pass (pontos)"
                  icon={Star}
                />
                {monthlyChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Nenhum dado de milhas disponível
                  </div>
                ) : (
                  <DeferredFinancialChart
                    kind="monthlyMiles"
                    data={monthlyChartData}
                    hideValues={!showValues}
                  />
                )}
              </div>

              {/* Tabela de milhas por semana */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Detalhe de Milhas por Semana"
                  subtitle="Semanas com passagens emitidas usando milhas"
                  icon={Calendar}
                />
                <div className="space-y-3 sm:hidden">
                  {milesTableData.map(w => (
                    <article
                      key={w.weekNumber}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Semana #{w.weekNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {w.departureDate}
                          </p>
                        </div>
                        {w.departureAirline && (
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                            style={{
                              backgroundColor:
                                AIRLINE_COLORS[w.departureAirline] ?? "#94A3B8",
                            }}
                          >
                            {displayAirline(w.departureAirline)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">SMILES</p>
                          <p className="mt-0.5 font-semibold text-orange-600 dark:text-orange-400">
                            {w.smilesPoints ? formatMiles(w.smilesPoints) : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-slate-400">LATAM Pass</p>
                          <p className="mt-0.5 font-semibold text-red-600 dark:text-red-400">
                            {w.latamPassPoints ? formatMiles(w.latamPassPoints) : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-slate-200 pt-2 text-right dark:border-slate-700">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total de milhas</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {w.totalMiles ? formatMiles(w.totalMiles) : "—"}
                        </p>
                      </div>
                    </article>
                  ))}
                  {milesTableData.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">
                      Nenhuma viagem com milhas registrada
                    </p>
                  )}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Semana
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Data Ida
                        </th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Companhia
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          SMILES
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          LATAM Pass
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Total Milhas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {milesTableData.map(w => (
                        <tr
                          key={w.weekNumber}
                          className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            #{w.weekNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {w.departureDate}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={{
                                backgroundColor:
                                  AIRLINE_COLORS[w.departureAirline ?? ""] ??
                                  "#94A3B8",
                              }}
                            >
                              {displayAirline(w.departureAirline)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-orange-600 dark:text-orange-400 font-medium">
                            {w.smilesPoints ? formatMiles(w.smilesPoints) : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-medium">
                            {w.latamPassPoints
                              ? formatMiles(w.latamPassPoints)
                              : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            {w.totalMiles ? formatMiles(w.totalMiles) : "—"}
                          </td>
                        </tr>
                      ))}
                      {milesTableData.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-slate-400 text-sm"
                          >
                            Nenhuma viagem com milhas registrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Comparativo por Companhia ── */}
          {activeTab === "comparison" && (
            <div role="tabpanel" id="tabpanel-comparison" aria-labelledby="tab-comparison" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pizza de gastos por companhia */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <SectionHeader
                    title="Distribuição por Companhia"
                    subtitle="% do total gasto em dinheiro"
                    icon={Plane}
                  />
                  {airlineChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Nenhum dado disponível
                    </div>
                  ) : (
                    <DeferredFinancialChart
                      kind="airlineDistribution"
                      data={airlineChartData}
                      hideValues={!showValues}
                    />
                  )}
                </div>

                {/* Barras comparativas por companhia */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                  <SectionHeader
                    title="Gasto Total por Companhia"
                    subtitle="Comparativo de valores absolutos"
                    icon={DollarSign}
                  />
                  {airlineChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Nenhum dado disponível
                    </div>
                  ) : (
                    <DeferredFinancialChart
                      kind="airlineComparison"
                      data={airlineChartData}
                      hideValues={!showValues}
                    />
                  )}
                </div>
              </div>

              {/* Tabela comparativa detalhada */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Comparativo Detalhado por Companhia"
                  subtitle="Viagens, gastos e médias"
                  icon={TrendingUp}
                />
                <div className="space-y-3 sm:hidden">
                  {airlineChartData.map(row => {
                    const totalCash = yearSummary?.totalCashBRL ?? 1;
                    const pct = totalCash > 0 ? (row.cashBRL / totalCash) * 100 : 0;
                    return (
                      <article
                        key={row.airline}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: AIRLINE_COLORS[row.airline] ?? "#94A3B8" }}
                            />
                            <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                              {row.name}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {row.count} viagens
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Total gasto</p>
                            <p className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
                              {formatBRL(row.cashBRL, !showValues)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Média/viagem</p>
                            <p className="mt-0.5 font-semibold text-slate-600 dark:text-slate-300">
                              {formatBRL(row.avgCash, !showValues)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                          <span className="text-orange-600 dark:text-orange-400">
                            {row.miles > 0 ? formatMiles(row.miles) : "Sem milhas"}
                          </span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {pct.toFixed(0)}% do total
                          </span>
                        </div>
                      </article>
                    );
                  })}
                  {airlineChartData.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-400">
                      Nenhuma companhia com dados financeiros
                    </p>
                  )}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Companhia
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Viagens
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Total Gasto
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Média/Viagem
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Milhas
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {airlineChartData.map(row => {
                        const totalCash = yearSummary?.totalCashBRL ?? 1;
                        const pct =
                          totalCash > 0 ? (row.cashBRL / totalCash) * 100 : 0;
                        return (
                          <tr
                            key={row.airline}
                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      AIRLINE_COLORS[row.airline] ?? "#94A3B8",
                                  }}
                                />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {row.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                              {row.count}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                              {formatBRL(row.cashBRL, !showValues)}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                              {formatBRL(row.avgCash, !showValues)}
                            </td>
                            <td className="py-3 px-3 text-right text-orange-600 dark:text-orange-400">
                              {row.miles > 0 ? formatMiles(row.miles) : "—"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor:
                                        AIRLINE_COLORS[row.airline] ??
                                        "#94A3B8",
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Tabela detalhada por semana ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <SectionHeader
            title="Detalhe por Semana"
            subtitle="Todas as viagens emitidas com dados financeiros"
            icon={Calendar}
          />
          {/* ── Vista Mobile: Cartões ── */}
          <div className="sm:hidden space-y-3">
            {weeklyTableData.length === 0 && !isLoading && (
              <p className="py-8 text-center text-slate-400 text-sm">
                Nenhuma viagem emitida em {selectedYear}
              </p>
            )}
            {weeklyTableData.map(w => (
              <div
                key={w.weekNumber}
                className={`rounded-xl border p-3 space-y-2.5 ${
                  w.departureRescheduled || w.returnRescheduled
                    ? "border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-900/10 opacity-80"
                    : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20"
                }`}
              >
                {/* Cabeçalho do cartão */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Semana #{w.weekNumber}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {MONTH_FULL_NAMES[w.month]}
                    </span>
                  </div>
                  {w.departureRescheduled || w.returnRescheduled ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Remarcado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Emitido
                    </span>
                  )}
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400 uppercase tracking-wide mb-0.5">
                      Ida
                    </p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {w.departureDate || "—"}
                    </p>
                    {w.departureAirline && (
                      <span
                        className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor:
                            AIRLINE_COLORS[w.departureAirline] ?? "#94A3B8",
                        }}
                      >
                        {displayAirline(w.departureAirline)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-slate-400 uppercase tracking-wide mb-0.5">
                      Volta
                    </p>
                    {w.ticketType === "oneway" ? (
                      <p className="italic text-slate-400">somente ida</p>
                    ) : (
                      <>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {w.returnDate || "—"}
                        </p>
                        {w.returnAirline && (
                          <span
                            className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                            style={{
                              backgroundColor:
                                AIRLINE_COLORS[w.returnAirline] ?? "#94A3B8",
                            }}
                          >
                            {displayAirline(w.returnAirline)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Preço e Milhas */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Preço Pago
                    </p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {w.paidPriceTotal !== null && w.paidPriceTotal > 0 ? (
                        formatBRL(w.paidPriceTotal, !showValues)
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">
                          sem preço
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {w.weekVariation !== undefined && w.weekVariation !== 0 && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          Math.abs(w.weekVariation) > 20
                            ? w.weekVariation > 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {w.weekVariation > 0 ? "+" : ""}
                        {w.weekVariation.toFixed(1)}%
                      </span>
                    )}
                    {(w.totalMiles ?? 0) > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {formatMiles(w.totalMiles!)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Rodapé total mobile */}
            {weeklyTableData.length > 0 && (
              <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Total ({weeklyTableData.length} viagens)
                </span>
                <span className="text-base font-bold text-blue-700 dark:text-blue-400">
                  {formatBRL(yearSummary?.totalCashBRL ?? 0, !showValues)}
                </span>
              </div>
            )}
          </div>

          {/* ── Vista Desktop: Tabela ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sem.
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Mês
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Data Ida
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Data Volta
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cia Ida
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cia Volta
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Preço Pago
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Variação
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Milhas
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {weeklyTableData.map(w => (
                  <tr
                    key={w.weekNumber}
                    className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      w.departureRescheduled || w.returnRescheduled
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      #{w.weekNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs">
                      {MONTH_NAMES[w.month]}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {w.departureDate}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {w.ticketType === "oneway" ? (
                        <span className="text-xs text-slate-400 italic">
                          somente ida
                        </span>
                      ) : (
                        w.returnDate
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {w.departureAirline ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor:
                              AIRLINE_COLORS[w.departureAirline] ?? "#94A3B8",
                          }}
                        >
                          {displayAirline(w.departureAirline)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {w.returnAirline && w.ticketType !== "oneway" ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{
                            backgroundColor:
                              AIRLINE_COLORS[w.returnAirline] ?? "#94A3B8",
                          }}
                        >
                          {displayAirline(w.returnAirline)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {w.paidPriceTotal !== null && w.paidPriceTotal > 0 ? (
                        formatBRL(w.paidPriceTotal, !showValues)
                      ) : (
                        <span className="text-slate-400 text-xs">
                          sem preço
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold text-xs rounded-lg ${
                        w.weekVariation !== undefined &&
                        Math.abs(w.weekVariation) > 20
                          ? w.weekVariation > 0
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {w.weekVariation !== undefined && w.weekVariation !== 0
                        ? `${w.weekVariation > 0 ? "+" : ""}${w.weekVariation.toFixed(1)}%`
                        : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-600 dark:text-orange-400">
                      {(w.totalMiles ?? 0) > 0
                        ? formatMiles(w.totalMiles!)
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {w.departureRescheduled || w.returnRescheduled ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Remarcado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Emitido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {weeklyTableData.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-10 text-center text-slate-400 text-sm"
                    >
                      Nenhuma viagem emitida em {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
              {weeklyTableData.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <td
                      colSpan={6}
                      className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-sm"
                    >
                      Total ({weeklyTableData.length} viagens)
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700 dark:text-blue-400 text-sm">
                      {formatBRL(yearSummary?.totalCashBRL ?? 0, !showValues)}
                    </td>
                    <td />
                    <td className="py-3 px-3 text-right font-bold text-orange-600 dark:text-orange-400 text-sm">
                      {(yearSummary?.totalMiles ?? 0) > 0
                        ? formatMiles(yearSummary!.totalMiles)
                        : "—"}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Seção de Projeções ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowProjections(v => !v)}
            aria-expanded={showProjections}
            aria-controls="projections-panel"
            className="w-full flex items-center justify-between p-3 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Projeções para {selectedYear + 1}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sazonalidade, inflação e frequência de viagens
                </p>
              </div>
            </div>
            {showProjections ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showProjections && (
            <div
              id="projections-panel"
              className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6 border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-5"
            >
              {/* Parâmetros de projeção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <label
                    htmlFor="inflation-rate"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2"
                  >
                    Inflação estimada (IPCA)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="inflation-rate"
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={inflationRate}
                      aria-label="Ajustar inflação estimada (IPCA)"
                      onChange={e => setInflationRate(Number(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="text-base font-bold text-purple-700 dark:text-purple-400 w-12 text-right">
                      {inflationRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <label
                    htmlFor="trips-per-month"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2"
                  >
                    Viagens por mês (frequência)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="trips-per-month"
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={tripsPerMonth}
                      aria-label="Ajustar número de viagens por mês"
                      onChange={e => setTripsPerMonth(Number(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="text-base font-bold text-purple-700 dark:text-purple-400 w-12 text-right">
                      {tripsPerMonth}/mês
                    </span>
                  </div>
                </div>
              </div>

              {/* KPIs de projeção */}
              {projections && (
                <>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Total Projetado
                      </p>
                      <p className="text-sm sm:text-xl font-bold text-purple-700 dark:text-purple-400 break-all leading-tight">
                        {formatBRL(projections.totalProjectedCash, !showValues)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Base {selectedYear}
                      </p>
                      <p className="text-sm sm:text-xl font-bold text-blue-700 dark:text-blue-400 break-all leading-tight">
                        {formatBRL(
                          projections.baseSummary.totalCashBRL,
                          !showValues
                        )}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Variação Estimada
                      </p>
                      <p
                        className={`text-sm sm:text-xl font-bold break-all leading-tight ${
                          projections.totalProjectedCash >
                          projections.baseSummary.totalCashBRL
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {projections.baseSummary.totalCashBRL > 0
                          ? formatPct(
                              ((projections.totalProjectedCash -
                                projections.baseSummary.totalCashBRL) /
                                projections.baseSummary.totalCashBRL) *
                                100
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Viagens Projetadas
                      </p>
                      <p className="text-sm sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                        {projections.totalProjectedTrips}
                      </p>
                    </div>
                  </div>

                  {/* Gráfico de projeção vs histórico */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Projeção {selectedYear + 1} vs Histórico {selectedYear}
                    </h3>
                    <DeferredFinancialChart
                      kind="projection"
                      data={projectionChartData}
                      hideValues={!showValues}
                      selectedYear={selectedYear}
                    />
                  </div>

                  {/* Tabela de projeção por mês */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Detalhe da Projeção por Mês
                    </h3>
                    <div className="space-y-3 sm:hidden">
                      {projections.byMonth.map(m => (
                        <article
                          key={m.month}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {MONTH_FULL_NAMES[m.month]}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Fator {m.seasonFactor.toFixed(2)}×
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">Viagens</p>
                              <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-300">
                                {m.projectedTrips}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-wide text-slate-400">Preço/viagem</p>
                              <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-300">
                                {formatBRL(m.avgPricePerTrip, !showValues)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">Projetado</p>
                              <p className="mt-0.5 font-bold text-purple-700 dark:text-purple-400">
                                {formatBRL(m.projectedCashBRL, !showValues)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-wide text-slate-400">Variação</p>
                              <p className={`mt-0.5 font-semibold ${m.variationVsHistoric !== null && m.variationVsHistoric > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                {m.variationVsHistoric !== null ? formatPct(m.variationVsHistoric) : "—"}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="hidden overflow-x-auto sm:block">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Mês
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Fator Sazon.
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Viagens
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Preço/Viagem
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Projetado
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Histórico
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Variação
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {projections.byMonth.map(m => (
                            <tr
                              key={m.month}
                              className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                {MONTH_FULL_NAMES[m.month]}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    m.seasonFactor > 1.1
                                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : m.seasonFactor < 0.95
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                  }`}
                                >
                                  {m.seasonFactor.toFixed(2)}×
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                                {m.projectedTrips}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                                {formatBRL(m.avgPricePerTrip, !showValues)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-purple-700 dark:text-purple-400">
                                {formatBRL(m.projectedCashBRL, !showValues)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                                {m.historicCash > 0
                                  ? formatBRL(m.historicCash, !showValues)
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {m.variationVsHistoric !== null ? (
                                  <span
                                    className={`text-xs font-semibold ${
                                      m.variationVsHistoric > 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {formatPct(m.variationVsHistoric)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <td
                              colSpan={4}
                              className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-sm"
                            >
                              Total {selectedYear + 1}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-purple-700 dark:text-purple-400 text-sm">
                              {formatBRL(
                                projections.totalProjectedCash,
                                !showValues
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-400 text-sm">
                              {formatBRL(
                                projections.baseSummary.totalCashBRL,
                                !showValues
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-sm">
                              {projections.baseSummary.totalCashBRL > 0 ? (
                                <span
                                  className={
                                    projections.totalProjectedCash >
                                    projections.baseSummary.totalCashBRL
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }
                                >
                                  {formatPct(
                                    ((projections.totalProjectedCash -
                                      projections.baseSummary.totalCashBRL) /
                                      projections.baseSummary.totalCashBRL) *
                                      100
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Nota metodológica */}
                  <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Metodologia:</strong> A projeção usa a média de
                      preço por viagem do ano base, corrigida pela inflação
                      estimada ({inflationRate}% a.a.) e pelo fator de
                      sazonalidade mensal (padrão histórico de passagens aéreas
                      no Brasil). O fator sazonalidade acima de 1,10× indica
                      alta temporada (preços mais altos); abaixo de 0,95× indica
                      baixa temporada.
                    </p>
                  </div>
                </>
              )}

              {loadingProjections && (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Calculando projeções...
                </div>
              )}
            </div>
          )}
        </div>
          </ContentReveal>
        )}
      </div>
    </div>
  );
}
