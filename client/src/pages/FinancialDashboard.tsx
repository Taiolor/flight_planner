import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
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
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MONTH_FULL_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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
  azul: "Azul",
  onhappy: "OnHappy",
  desconhecida: "Outra",
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

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const colorMap = {
    blue: "from-blue-500 to-blue-700 text-white",
    green: "from-emerald-500 to-emerald-700 text-white",
    orange: "from-orange-500 to-orange-700 text-white",
    purple: "from-purple-500 to-purple-700 text-white",
    red: "from-red-500 to-red-700 text-white",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} p-3 sm:p-5 shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
            {title}
          </p>
          <p className="text-base sm:text-2xl font-bold truncate">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-75 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className="ml-3 p-2 rounded-xl bg-white/20">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend.value >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 opacity-80" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 opacity-80" />
          )}
          <span className="opacity-90">
            {formatPct(trend.value)} {trend.label}
          </span>
        </div>
      )}
    </div>
  );
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
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinancialDashboard() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showValues, setShowValues] = useState(false);
  const [inflationRate, setInflationRate] = useState(5);
  const [tripsPerMonth, setTripsPerMonth] = useState(4);
  const [showProjections, setShowProjections] = useState(true);
  const [activeTab, setActiveTab] = useState<"cash" | "miles" | "comparison">("cash");

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: yearSummary, isLoading: loadingYear } = trpc.financial.getYearSummary.useQuery(
    { year: selectedYear }
  );

  const { data: weeklyData, isLoading: loadingWeekly } = trpc.financial.getWeeklyData.useQuery(
    { year: selectedYear }
  );

  const { data: projections, isLoading: loadingProjections } =
    trpc.financial.getProjections.useQuery(
      {
        baseYear: selectedYear,
        targetYear: selectedYear + 1,
        inflationRate: inflationRate / 100,
        tripsPerMonth,
      },
      { enabled: showProjections }
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
        name: AIRLINE_LABELS[airline] ?? airline,
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



  const isLoading = loadingYear || loadingWeekly;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 rounded-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <DollarSign className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">
            Gestão Financeira
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
              {/* Seletor de ano */}
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y} className="bg-slate-800">
                    {y}
                  </option>
                ))}
              </select>
              {/* Toggle mostrar/ocultar valores */}
              <button
                onClick={() => setShowValues(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                {showValues ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{showValues ? "Ocultar" : "Mostrar"} valores</span>
              </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-10">
        {/* ── KPIs ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Total Investido"
              value={formatBRL(yearSummary?.totalCashBRL ?? 0, !showValues)}
              subtitle={`${yearSummary?.issuedCount ?? 0} viagens emitidas`}
              icon={DollarSign}
              color="blue"
              trend={
                trendData
                  ? { value: trendData.trend, label: "2º sem. vs 1º sem." }
                  : undefined
              }
            />
            <KpiCard
              title="Média por Viagem"
              value={formatBRL(yearSummary?.avgCashBRL ?? 0, !showValues)}
              subtitle="Passagens em dinheiro"
              icon={Plane}
              color="green"
            />
            <KpiCard
              title="Milhas SMILES"
              value={formatMiles(yearSummary?.totalSmilesPoints ?? 0)}
              subtitle="Pontos gastos no ano"
              icon={Star}
              color="orange"
            />
            <KpiCard
              title="Milhas LATAM Pass"
              value={formatMiles(yearSummary?.totalLatamPassPoints ?? 0)}
              subtitle="Pontos gastos no ano"
              icon={Star}
              color="purple"
            />
          </div>
        )}

        {/* ── Tabs de análise ── */}
        <div>
          <div className="flex gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full sm:w-fit mb-4 sm:mb-6">
            {(["cash", "miles", "comparison"] as const).map(tab => (
              <button
                key={tab}
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
            <div className="space-y-6">
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
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={v =>
                          showValues ? `R$${(v / 1000).toFixed(0)}k` : "R$ ••"
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          showValues ? [formatBRL(value), "Total"] : ["R$ ••••", "Total"]
                        }
                        labelFormatter={label => `Mês: ${label}`}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="cashBRL" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Gasto (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={v =>
                          showValues ? `R$${(v / 1000).toFixed(0)}k` : "R$ ••"
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (!showValues) return ["R$ ••••", name];
                          if (name === "cashBRL") return [formatBRL(value), "Gasto"];
                          if (name === "avgPrice") return [formatBRL(value), "Média/viagem"];
                          return [value, name];
                        }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cashBRL"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#cashGrad)"
                        name="cashBRL"
                      />
                      <Line
                        type="monotone"
                        dataKey="avgPrice"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="avgPrice"
                      />
                      <Legend
                        formatter={v =>
                          v === "cashBRL" ? "Total mensal" : "Média por viagem"
                        }
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                {trendData && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">1º Semestre</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {formatBRL(trendData.h1, !showValues)}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">2º Semestre</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">Variação</p>
                      <p
                        className={`text-base font-bold mt-1 ${
                          trendData.trend >= 0 ? "text-red-600" : "text-green-600"
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
            <div className="space-y-6">
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
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatMiles(value), "Milhas"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="miles" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Milhas (pts)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Tabela de milhas por semana */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <SectionHeader
                  title="Detalhe de Milhas por Semana"
                  subtitle="Semanas com passagens emitidas usando milhas"
                  icon={Calendar}
                />
                <div className="overflow-x-auto">
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
                      {milesTableData
                        .map(w => (
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
                                    AIRLINE_COLORS[w.departureAirline ?? ""] ?? "#94A3B8",
                                }}
                              >
                                {AIRLINE_LABELS[w.departureAirline ?? ""] ?? w.departureAirline}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-orange-600 dark:text-orange-400 font-medium">
                              {w.smilesPoints ? formatMiles(w.smilesPoints) : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right text-red-600 dark:text-red-400 font-medium">
                              {w.latamPassPoints ? formatMiles(w.latamPassPoints) : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                              {w.totalMiles ? formatMiles(w.totalMiles) : "—"}
                            </td>
                          </tr>
                        ))}
                      {milesTableData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
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
            <div className="space-y-6">
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
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={airlineChartData}
                          dataKey="cashBRL"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {airlineChartData.map((entry, index) => (
                            <Cell
                              key={entry.airline}
                              fill={AIRLINE_COLORS[entry.airline] ?? "#94A3B8"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            showValues ? [formatBRL(value), "Total"] : ["R$ ••••", "Total"]
                          }
                          contentStyle={{ borderRadius: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={airlineChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={v =>
                            showValues ? `R$${(v / 1000).toFixed(0)}k` : "R$ ••"
                          }
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) =>
                            showValues ? [formatBRL(value), "Total"] : ["R$ ••••", "Total"]
                          }
                          contentStyle={{ borderRadius: 12 }}
                        />
                        <Bar dataKey="cashBRL" radius={[0, 6, 6, 0]} name="Total (R$)">
                          {airlineChartData.map(entry => (
                            <Cell
                              key={entry.airline}
                              fill={AIRLINE_COLORS[entry.airline] ?? "#94A3B8"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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
                <div className="overflow-x-auto">
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
                        const pct = totalCash > 0 ? (row.cashBRL / totalCash) * 100 : 0;
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
                                        AIRLINE_COLORS[row.airline] ?? "#94A3B8",
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
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sem.</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Ida</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Data Volta</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cia Ida</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cia Volta</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço Pago</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Variação</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Milhas</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
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
                        <span className="text-xs text-slate-400 italic">somente ida</span>
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
                          {AIRLINE_LABELS[w.departureAirline] ?? w.departureAirline}
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
                          {AIRLINE_LABELS[w.returnAirline] ?? w.returnAirline}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {w.paidPriceTotal !== null && w.paidPriceTotal > 0
                        ? formatBRL(w.paidPriceTotal, !showValues)
                        : <span className="text-slate-400 text-xs">sem preço</span>}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold text-xs rounded-lg ${
                      w.weekVariation !== undefined && Math.abs(w.weekVariation) > 20
                        ? w.weekVariation > 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {w.weekVariation !== undefined && w.weekVariation !== 0
                        ? `${w.weekVariation > 0 ? "+" : ""}${w.weekVariation.toFixed(1)}%`
                        : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-600 dark:text-orange-400">
                      {(w.totalMiles ?? 0) > 0 ? formatMiles(w.totalMiles!) : "—"}
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
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-sm">
                      Nenhuma viagem emitida em {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
              {weeklyTableData.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <td colSpan={6} className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Total ({weeklyTableData.length} viagens)
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-700 dark:text-blue-400 text-sm">
                      {formatBRL(yearSummary?.totalCashBRL ?? 0, !showValues)}
                    </td>
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
            <div className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6 border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-5">
              {/* Parâmetros de projeção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Inflação estimada (IPCA)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={inflationRate}
                      onChange={e => setInflationRate(Number(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="text-base font-bold text-purple-700 dark:text-purple-400 w-12 text-right">
                      {inflationRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Viagens por mês (frequência)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={tripsPerMonth}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Total Projetado
                      </p>
                      <p className="text-sm sm:text-xl font-bold text-purple-700 dark:text-purple-400">
                        {formatBRL(projections.totalProjectedCash, !showValues)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Base {selectedYear}
                      </p>
                      <p className="text-sm sm:text-xl font-bold text-blue-700 dark:text-blue-400">
                        {formatBRL(projections.baseSummary.totalCashBRL, !showValues)}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Variação Estimada
                      </p>
                      <p
                        className={`text-sm sm:text-xl font-bold ${
                          projections.totalProjectedCash > projections.baseSummary.totalCashBRL
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
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={projectionChartData}
                        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={v =>
                            showValues ? `R$${(v / 1000).toFixed(0)}k` : "R$ ••"
                          }
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const label =
                              name === "projetado"
                                ? `Projetado ${selectedYear + 1}`
                                : `Histórico ${selectedYear}`;
                            return showValues
                              ? [formatBRL(value), label]
                              : ["R$ ••••", label];
                          }}
                          contentStyle={{ borderRadius: 12 }}
                        />
                        <Legend
                          formatter={v =>
                            v === "projetado"
                              ? `Projetado ${selectedYear + 1}`
                              : `Histórico ${selectedYear}`
                          }
                        />
                        <Bar dataKey="historico" fill="#94A3B8" radius={[4, 4, 0, 0]} name="historico" />
                        <Bar dataKey="projetado" fill="#A855F7" radius={[4, 4, 0, 0]} name="projetado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela de projeção por mês */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Detalhe da Projeção por Mês
                    </h3>
                    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fator Sazon.</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Viagens</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço/Viagem</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Projetado</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Histórico</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Variação</th>
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
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <td colSpan={4} className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-sm">
                              Total {selectedYear + 1}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-purple-700 dark:text-purple-400 text-sm">
                              {formatBRL(projections.totalProjectedCash, !showValues)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-400 text-sm">
                              {formatBRL(projections.baseSummary.totalCashBRL, !showValues)}
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
                      <strong>Metodologia:</strong> A projeção usa a média de preço por viagem do
                      ano base, corrigida pela inflação estimada ({inflationRate}% a.a.) e pelo
                      fator de sazonalidade mensal (padrão histórico de passagens aéreas no
                      Brasil). O fator sazonalidade acima de 1,10× indica alta temporada (preços
                      mais altos); abaixo de 0,95× indica baixa temporada.
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
      </div>
    </div>
  );
}
