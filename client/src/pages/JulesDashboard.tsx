import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Bot,
  Clock,
  GitCommit,
  BookOpen,
  Search,
  CheckCircle2,
  Shield,
  Zap,
  Palette as PaletteIcon,
  FlaskConical,
  Sparkles,
  FileCode,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type AgentFilter = "all" | "bolt" | "sentinel" | "palette" | "radar" | "janitor";
type ActiveTab = "overview" | "journals" | "commits" | "schedule";

const AGENT_BADGE_STYLES: Record<string, string> = {
  bolt: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  sentinel:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  palette:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  radar:
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  janitor:
    "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
};

export default function JulesDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<AgentFilter>("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = trpc.jules.getDashboardData.useQuery({
    agentFilter: selectedAgent,
  });

  const filteredEntries = useMemo(() => {
    const list = data?.entries ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      e =>
        e.title.toLowerCase().includes(q) ||
        e.learning.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.vulnerability && e.vulnerability.toLowerCase().includes(q)) ||
        e.date.toLowerCase().includes(q)
    );
  }, [data?.entries, searchQuery]);

  const filteredCommits = useMemo(() => {
    const list = data?.commits ?? [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      c =>
        c.subject.toLowerCase().includes(q) ||
        c.shortHash.toLowerCase().includes(q) ||
        c.date.toLowerCase().includes(q)
    );
  }, [data?.commits, searchQuery]);

  const chartData = useMemo(() => {
    if (!data?.agents) return [];
    return data.agents.map(a => ({
      name: `${a.emoji} ${a.name}`,
      aprendizados: a.entriesCount,
      commits: a.commitsCount,
      color: a.color,
    }));
  }, [data?.agents]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 text-white px-4 py-3 flex flex-wrap items-center gap-3 shadow-lg sticky top-0 z-10">
        <Link href="/">
          <button
            aria-label="Voltar para a página inicial"
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Bot className="w-5 h-5" aria-hidden="true" />
          <h1 className="text-base sm:text-lg font-bold tracking-wide">
            Esquadrão Google Jules — Dashboard de Execuções
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs bg-white/15 border border-white/25 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
          <span>
            Agendado:{" "}
            <strong>
              {data?.schedule.humanReadable ?? "Diariamente às 06:00 BRT"}
            </strong>
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* KPIs Principais */}
        <section
          aria-label="Indicadores principais dos agentes"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Agentes Ativos
                </p>
                <p className="text-2xl font-bold mt-1">
                  {data?.totals.agentsCount ?? 5} Especialistas
                </p>
                <p className="text-xs opacity-80 mt-1">
                  Performance, Segurança, UX, Testes, Clean Code
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <Bot className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Aprendizados em .Jules/
                </p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? "..." : (data?.totals.journalEntriesCount ?? 0)}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  Auditorias documentadas nos diários
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <BookOpen className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Entregas / PRs no Git
                </p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? "..." : (data?.totals.gitCommitsCount ?? 0)}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  Commits cirúrgicos rastreados
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <GitCommit className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Cadência & Automação
                </p>
                <p className="text-xl font-bold mt-1">06:00 BRT (Diário)</p>
                <p className="text-xs opacity-80 mt-1">
                  CRON_TZ=America/Sao_Paulo 0 6 * * *
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <Calendar className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* Filtro Rápido por Agente + Busca */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Filtrar execuções por agente"
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setSelectedAgent("all")}
              aria-pressed={selectedAgent === "all"}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedAgent === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Todos ({data?.totals.journalEntriesCount ?? 0})
            </button>
            {data?.agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                aria-pressed={selectedAgent === agent.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selectedAgent === agent.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <span aria-hidden="true">{agent.emoji}</span>
                <span>{agent.name}</span>
                <span className="opacity-75">({agent.entriesCount})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <label htmlFor="jules-search-input" className="sr-only">
              Buscar aprendizados ou commits dos agentes
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="jules-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar em diários ou commits..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </section>

        {/* Navegação de Abas */}
        <div
          role="tablist"
          aria-label="Seções do Dashboard de Agentes"
          className="flex flex-wrap gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full sm:w-fit"
        >
          {(
            [
              { id: "overview", label: "📊 Visão Geral & Agentes" },
              {
                id: "journals",
                label: `📜 Diários .Jules (${filteredEntries.length})`,
              },
              {
                id: "commits",
                label: `🔀 Commits & PRs (${filteredCommits.length})`,
              },
              { id: "schedule", label: "⚙️ Skills & Agendamento" },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA 1: VISÃO GERAL & CARTÕES DOS 5 AGENTES */}
        {activeTab === "overview" && (
          <div
            role="tabpanel"
            id="tabpanel-overview"
            aria-labelledby="tab-overview"
            className="space-y-6"
          >
            {/* Cards dos 5 Agentes Especialistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.agents.map(agent => (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                          aria-hidden="true"
                        >
                          {agent.emoji}
                        </span>
                        <div>
                          <h2 className="font-bold text-base">{agent.name}</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {agent.role}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          AGENT_BADGE_STYLES[agent.id] ?? ""
                        }`}
                      >
                        {agent.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                      <div>
                        <p className="text-xs text-slate-500">Aprendizados</p>
                        <p className="text-lg font-bold">{agent.entriesCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Commits/PRs</p>
                        <p className="text-lg font-bold">{agent.commitsCount}</p>
                      </div>
                    </div>

                    {agent.latestEntry && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Última auditoria ({agent.latestEntry.date}):
                        </p>
                        <p className="line-clamp-2">{agent.latestEntry.title}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setActiveTab("journals");
                    }}
                    className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Ver diário completo de {agent.name} →
                  </button>
                </div>
              ))}
            </div>

            {/* Gráfico Comparativo */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold mb-1">
                Distribuição de Execuções por Agente Especialista
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Comparativo entre entradas documentadas em .Jules/*.md e commits
                registrados no histórico do repositório
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="aprendizados"
                      name="Aprendizados (.Jules)"
                      radius={[6, 6, 0, 0]}
                    >
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: DIÁRIOS .JULES */}
        {activeTab === "journals" && (
          <div
            role="tabpanel"
            id="tabpanel-journals"
            aria-labelledby="tab-journals"
            className="space-y-4"
          >
            {filteredEntries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-500">
                Nenhum registro encontrado para os filtros aplicados.
              </div>
            ) : (
              filteredEntries.map(entry => (
                <article
                  key={entry.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          AGENT_BADGE_STYLES[entry.agentId] ?? ""
                        }`}
                      >
                        {entry.agentEmoji} {entry.agentName} ({entry.category})
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {entry.date}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {entry.title}
                  </h3>

                  {entry.vulnerability && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs">
                      <strong className="text-red-700 dark:text-red-300">
                        Vulnerabilidade Identificada:
                      </strong>{" "}
                      <span className="text-red-900 dark:text-red-200">
                        {entry.vulnerability}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm space-y-2">
                    <p>
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        Aprendizado (Learning):
                      </strong>{" "}
                      {entry.learning}
                    </p>
                    {entry.action && (
                      <p>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          Ação / Prevenção:
                        </strong>{" "}
                        {entry.action}
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* ABA 3: HISTÓRICO DE COMMITS & PRs */}
        {activeTab === "commits" && (
          <div
            role="tabpanel"
            id="tabpanel-commits"
            aria-labelledby="tab-commits"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800"
          >
            {filteredCommits.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhum commit encontrado para este filtro.
              </div>
            ) : (
              filteredCommits.map(commit => (
                <div
                  key={commit.hash}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                        AGENT_BADGE_STYLES[commit.agentId] ?? ""
                      }`}
                    >
                      {commit.agentEmoji} {commit.agentName}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {commit.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                    <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                      {commit.shortHash}
                    </code>
                    <span>{commit.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 4: SKILLS & AGENDAMENTO */}
        {activeTab === "schedule" && (
          <div
            role="tabpanel"
            id="tabpanel-schedule"
            aria-labelledby="tab-schedule"
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <h2>Automação Diária Configurada (Antigravity Sidecar)</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                O orquestrador{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  Daily Jules Code Squad
                </code>{" "}
                executa diariamente às <strong>06:00 BRT</strong> e aciona os 5
                agentes especialistas em sequência.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-500 block mb-1">
                    Expressão Cron:
                  </span>
                  <code className="font-mono font-semibold">
                    {data?.schedule.cron}
                  </code>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-500 block mb-1">
                    Skill Orquestradora:
                  </span>
                  <code className="font-mono font-semibold">
                    {data?.schedule.orchestratorSkill}
                  </code>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.agents.map(agent => (
                <div
                  key={agent.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                >
                  <FileCode
                    className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-sm">
                      {agent.emoji} {agent.name} — {agent.role}
                    </p>
                    <p className="text-slate-500">
                      Skill:{" "}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {agent.skillPath}
                      </code>
                    </p>
                    <p className="text-slate-500">
                      Diário:{" "}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {agent.journalPath}
                      </code>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
