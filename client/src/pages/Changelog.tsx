import { useState } from "react";
import {
  ChevronDown,
  Sparkles,
  Bug,
  Zap,
  Shield,
  Accessibility,
  Calendar,
  Plane,
  TrendingUp,
  Rocket,
  Code,
  Database,
  Gauge,
  Eye,
  Mail,
  Trash2,
  Share2,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface Release {
  version: string;
  date: string;
  month: string;
  status: "released" | "milestone" | "planned";
  highlights: string;
  features: Array<{
    icon: React.ReactNode;
    category: string;
    items: string[];
  }>;
}

const releases: Release[] = [
  // Julho 2026 (Semana 3)
  {
    version: "v1.5.0",
    date: "28/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights:
      "Segurança Aprimorada, Correção de Autenticação e Atualização de Dependências",
    features: [
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Melhorias de Segurança",
        items: [
          "Rate limiting no endpoint de login (máx 5 tentativas/15min)",
          "Proteção contra brute force com exponential backoff",
          "Proteção IDOR nos endpoints financeiros (requer autenticação)",
          "Prevenção de command injection no Google Calendar MCP",
          "Comparação timing-safe para credenciais (SHA-256)",
        ],
      },
      {
        icon: <Zap className="w-5 h-5" />,
        category: "Correção de Erros de Autenticação",
        items: [
          "Corrigido erro 'Faça login para acessar' na homepage",
          "Corrigido erro de autenticação na página Financeiro",
          "Adicionado gating de autenticação em queries protegidas",
          "Melhorado tratamento de erro em ShareByEmailButton",
          "Implementado enabled: isAuthenticated em FinancialDashboard",
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: "Atualização de Dependências",
        items: [
          "lucide-react: 0.453.0 → 1.27.0 (major update)",
          "react-day-picker: 9.11.1 → 10.0.1 (major update)",
          "react-resizable-panels: 3.0.6 → 4.12.2 (major update)",
          "vite: 7.1.9 → 7.3.5 (minor update)",
          "pnpm: 10.18.1 → 10.34.4 (minor update)",
          "esbuild: 0.25.10 → 0.28.1 (minor update)",
          "@vitest/coverage-v8: 2.1.9 → 4.1.10 (major update)",
          "streamdown: 1.4.0 → 2.5.0 (major update)",
        ],
      },
      {
        icon: <Code className="w-5 h-5" />,
        category: "Refatoração de Componentes",
        items: [
          "Atualizado resizable.tsx para nova API (PanelGroup → Group)",
          "Corrigido ComponentShowcase.tsx (direction → orientation)",
          "Melhorado tratamento de erro em ShareByEmailButton",
          "Adicionado verificação de autenticação em FinancialDashboard",
        ],
      },
      {
        icon: <Gauge className="w-5 h-5" />,
        category: "Qualidade e Testes",
        items: [
          "214 testes passando (sem regressões)",
          "0 erros TypeScript",
          "Todos os PRs de segurança mergeados com sucesso",
          "Compatibilidade total com dependências atualizadas",
        ],
      },
    ],
  },
  // Julho 2026
  {
    version: "v1.4.0",
    date: "21/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights: "Multi-Ano, Accordion, Otimizações e Testes Expandidos",
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Suporte Multi-Ano",
        items: [
          "Suporte para múltiplos anos (2026-2030)",
          "Seletor de ano no cabeçalho com dropdown",
          "Feriados atualizados para todos os anos",
          "YearContext para sincronização entre páginas",
        ],
      },
      {
        icon: <ChevronDown className="w-5 h-5" />,
        category: "Accordion de Semanas",
        items: [
          "Modelo sanfona para cada semana",
          "Semanas passadas fechadas, futuras abertas",
          "Botão Expandir/Recolher Tudo",
          "Indicador visual para semana atual (borda + badge)",
          "Animação suave de transição",
        ],
      },
      {
        icon: <Zap className="w-5 h-5" />,
        category: "Otimizações de Performance",
        items: [
          "Lazy load para ExportPdfButton",
          "Skeleton screens para Resumo e Filtros",
          "Eliminação de alocações redundantes de arrays",
          "pnpm dedupe: 5 dependências removidas (23.1 MB liberados)",
          "Build otimizado com minificação agressiva",
        ],
      },
      {
        icon: <Mail className="w-5 h-5" />,
        category: "Notificações por Email",
        items: [
          "Templates com dados de milhas (SMILES e LATAM PASS)",
          "Seção visual Pagamento por Milhas",
          "Formatação com cores diferenciadas",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Segurança de Tipos e Testes",
        items: [
          "Remoção de type assertions 'any' em Home.tsx",
          "Extração de componente WeekFlightCard",
          "213 testes (49 novos adicionados)",
          "Cobertura completa do useAuth hook",
          "Testes para integração Google Calendar",
        ],
      },
      {
        icon: <Bug className="w-5 h-5" />,
        category: "Correções de Bugs",
        items: [
          "Erro de autenticação tRPC na homepage",
          "Localizadores/números de voos não exibidos (semana 20+)",
          "Sincronização estado local vs servidor",
          "Invalidação de query getWeeks após login",
        ],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "17/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights: "CI/CD e Seção de Novidades",
    features: [
      {
        icon: <Code className="w-5 h-5" />,
        category: "CI/CD Pipeline",
        items: [
          "GitHub Actions: workflow test.yml para testes automáticos",
          "GitHub Actions: workflow deploy.yml para deploy automático",
          "GitHub Actions: workflow quality.yml para análise de qualidade",
          "Testes agendados diariamente às 2:00 AM UTC",
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Seção de Novidades",
        items: [
          "Página Changelog.tsx com histórico completo desde fevereiro/2026",
          "20+ releases organizadas por mês em ordem decrescente",
          "Timeline visual com expansão/colapso por release",
          "Estatísticas do projeto (releases, testes, commits, cobertura)",
          'Botão "Novidades" integrado no header da Home',
        ],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "15/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights: "Botões Limpar e Calendário Dinâmico",
    features: [
      {
        icon: <Trash2 className="w-5 h-5" />,
        category: "Funcionalidades",
        items: [
          'Botões "Limpar" em cada card de Ida e Volta',
          "Limpeza de: aeroporto, companhia, data/hora, número do voo, localizador",
          "Calendário da Copa reduzido com efeito sanfona discreto",
          "Ícone ChevronDown animado no botão da Copa",
        ],
      },
      {
        icon: <Eye className="w-5 h-5" />,
        category: "Persistência",
        items: [
          "localStorage para preferência de visualização da Copa",
          "Calendário lembra se estava aberto ou fechado ao recarregar",
          "Finais de semana prolongados: apenas feriado + sábado/domingo",
        ],
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "10/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights: "Melhorias de PR e Correção de Bugs",
    features: [
      {
        icon: <Bug className="w-5 h-5" />,
        category: "Bug Fixes",
        items: [
          "Corrigido erro de JSON inválido em hibernação de sandbox",
          "Retry automático para erros transitórios de HTML",
          "Corrigido security headers (X-Frame-Options para dev)",
          "Resolvidos conflitos de merge de 11 PRs",
        ],
      },
      {
        icon: <Code className="w-5 h-5" />,
        category: "Otimizações",
        items: [
          "Paralelização de data fetches em sendNextAlert",
          "Cache em memória para getTicketNotificationEmails",
          "Single-pass array operations em BrazilWorldCupPanel",
          "Redução de O(7N) → O(N) em cálculos de estatísticas",
        ],
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "01/07/2026",
    month: "Julho 2026",
    status: "released",
    highlights: "Release 1.0.0 - Versão Estável",
    features: [
      {
        icon: <Rocket className="w-5 h-5" />,
        category: "Estabilidade",
        items: [
          "Todas as features principais estáveis e testadas",
          "Testes unitários e de integração implementados",
          "Documentação completa do projeto",
          "Publicação em produção: flightplan-hq655wm9.manus.space",
        ],
      },
    ],
  },
  // Junho 2026
  {
    version: "v0.9.0",
    date: "25/06/2026",
    month: "Junho 2026",
    status: "released",
    highlights: "Performance e Segurança - Fase 1",
    features: [
      {
        icon: <Zap className="w-5 h-5" />,
        category: "Performance",
        items: [
          "Code Splitting com React.lazy e Suspense",
          "Lazy loading de componentes pesados (AdminNotifications)",
          "Tree-shaking de dependências não utilizadas",
          "Minify com esbuild (redução de 54% no chunk principal)",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Segurança",
        items: [
          "Express-rate-limit nas rotas de API",
          "Helmet para Security Headers",
          "Autenticação no endpoint initWeeks",
          "Crypto.timingSafeEqual no login",
        ],
      },
    ],
  },
  {
    version: "v0.8.0",
    date: "15/06/2026",
    month: "Junho 2026",
    status: "released",
    highlights: "Notificações por E-Mail e Melhorias de UX",
    features: [
      {
        icon: <Mail className="w-5 h-5" />,
        category: "Notificações por E-Mail",
        items: [
          "Tabela ticket_notification_emails para gerenciar destinatários",
          "Procedures tRPC para CRUD de destinatários",
          "Integração com Resend para envio de e-mails",
          'Disparo automático de e-mail ao marcar bilhete como "Emitido"',
          "Template HTML com dados completos do bilhete",
        ],
      },
      {
        icon: <Accessibility className="w-5 h-5" />,
        category: "UX/Acessibilidade",
        items: [
          "Botões de cópia: copiar companhia aérea e localizador da ida para volta",
          'Seletor "Ida e Volta" / "Somente Ida" no card de bilhete',
          "Botão de ocultar/exibir valores monetários",
          "Toast notifications com Sonner",
        ],
      },
    ],
  },
  {
    version: "v0.7.0",
    date: "05/06/2026",
    month: "Junho 2026",
    status: "released",
    highlights: "Copa 2026 e Calendário Anual",
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Copa do Mundo 2026",
        items: [
          "Painel Copa 2026 na semana vigente com próximos jogos do Brasil",
          "Fases eliminatórias (oitavas, quartas, semifinais, final)",
          "Painel Copa por semana com jogos que coincidem com intervalo de viagem",
          "Calendário dinâmico com foco na seleção brasileira",
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Calendário Anual",
        items: [
          "Página CalendarView com grade anual (12 meses em página única)",
          "Marcação de dias de voo emitidos (verde=futuro/presente, cinza=passado)",
          "Popup flutuante com dados do bilhete ao clicar em dia com voo",
          "Sinalização visual de feriados nacionais, estaduais e municipais",
        ],
      },
    ],
  },
  // Maio 2026
  {
    version: "v0.6.0",
    date: "25/05/2026",
    month: "Maio 2026",
    status: "released",
    highlights: "Módulo de Cotações e Compartilhamento",
    features: [
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: "Cotações (Sky Scrapper API)",
        items: [
          "Integração com Sky Scrapper API para cotações de voos",
          "Tabelas flight_quotes e api_usage_tracker no banco",
          "Página FlightQuotes.tsx com cards por semana",
          "Botões para buscar via API e Kayak",
        ],
      },
      {
        icon: <Share2 className="w-5 h-5" />,
        category: "Compartilhamento",
        items: [
          "Botão de compartilhamento WhatsApp com texto criativo",
          "Botão de compartilhamento por E-Mail",
          "Integração com lista de e-mails cadastrados",
        ],
      },
    ],
  },
  {
    version: "v0.5.0",
    date: "15/05/2026",
    month: "Maio 2026",
    status: "released",
    highlights: "Gerenciador de Notificações e Integração com Calendário",
    features: [
      {
        icon: <Bell className="w-5 h-5" />,
        category: "Gerenciador de Notificações",
        items: [
          "Painel admin de notificações com próximos alertas agendados",
          "Histórico de envios e dispositivos registrados",
          "Tabela notification_log no banco de dados",
          "Rotina automática para limpar logs com mais de 90 dias",
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Integração com Calendário",
        items: [
          'Botão "Adicionar à Agenda" (Google Calendar, Outlook, .ics)',
          "Evento 2h antes do voo com lembrete configurável",
          "Endereço completo dos aeroportos nos eventos",
          "Links de rastreamento de voo nas observações",
        ],
      },
    ],
  },
  {
    version: "v0.4.0",
    date: "01/05/2026",
    month: "Maio 2026",
    status: "released",
    highlights: "PWA, Notificações Push e Exportação PDF",
    features: [
      {
        icon: <Rocket className="w-5 h-5" />,
        category: "Progressive Web App",
        items: [
          "Manifesto PWA (manifest.json) com ícone, nome e cores do app",
          "Meta tags iOS (apple-touch-icon, status bar, viewport)",
          "Service Worker para cache offline",
          "Otimização layout responsivo mobile-first",
        ],
      },
      {
        icon: <Mail className="w-5 h-5" />,
        category: "Notificações",
        items: [
          "Instalação web-push com geração de chaves VAPID",
          "Endpoints tRPC para salvar/remover subscriptions push",
          "Job agendado no servidor para enviar notificação 24h antes do voo",
          "Service Worker para receber e exibir notificações push",
        ],
      },
      {
        icon: <Plane className="w-5 h-5" />,
        category: "Exportação",
        items: [
          "Botão de exportação para PDF no cabeçalho",
          "Layout visual colorido A4 com quebra de páginas por mês",
        ],
      },
    ],
  },
  // Abril 2026
  {
    version: "v0.3.0",
    date: "10/04/2026",
    month: "Abril 2026",
    status: "released",
    highlights: "Rastreamento de Bilhetes e Gráficos",
    features: [
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: "Análise de Dados",
        items: [
          "Gráfico de variação de preços com filtros por companhia",
          "Resumo anual com KPIs (bilhetes emitidos, total investido, média por viagem)",
          "Rastreamento de emissão de bilhetes (companhia, aeroporto, data/hora, localizador)",
        ],
      },
      {
        icon: <Gauge className="w-5 h-5" />,
        category: "Filtros e Controles",
        items: [
          "Filtros por faixa de preço, status de bilhete e mês",
          "Filtros de horário de ida e volta",
          "Filtro de companhia aérea com logotipos",
        ],
      },
    ],
  },
  // Março 2026
  {
    version: "v0.2.0",
    date: "15/03/2026",
    month: "Março 2026",
    status: "released",
    highlights: "Layout Moderno Travel Dashboard",
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Interface Principal",
        items: [
          "Layout moderno Travel Dashboard com paleta azul + verde + laranja",
          "Todas as 44 semanas de 2026 com datas de ida (domingos) e retorno (quinta/sexta)",
          "Comparação de preços em 5 plataformas (Kayak, LATAM, Gol, Azul, Onhappy)",
          "Seletor de aeroporto de saída (GRU ou CGH)",
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Calendário",
        items: [
          "Indicadores de feriados nacionais e pontos facultativos",
          "Agrupamento por mês com accordion (mês atual expandido por padrão)",
        ],
      },
    ],
  },
  // Fevereiro 2026
  {
    version: "v0.1.0",
    date: "25/02/2026",
    month: "Fevereiro 2026",
    status: "released",
    highlights: "Bootstrap Inicial - Planejador de Passagens Aéreas",
    features: [
      {
        icon: <Rocket className="w-5 h-5" />,
        category: "Projeto Iniciado",
        items: [
          "Primeiro commit do repositório (25/02/2026)",
          "Setup inicial do projeto com React 19 + Tailwind 4",
          "Configuração do banco de dados MySQL",
          "Autenticação por e-mail/senha",
        ],
      },
    ],
  },
];

const monthOrder: Record<string, number> = {
  Janeiro: 1,
  Fevereiro: 2,
  Março: 3,
  Abril: 4,
  Maio: 5,
  Junho: 6,
  Julho: 7,
  Agosto: 8,
  Setembro: 9,
  Outubro: 10,
  Novembro: 11,
  Dezembro: 12,
};

const releasesByMonth: Record<string, Release[]> = releases.reduce(
  (byMonth, release) => {
    (byMonth[release.month] ??= []).push(release);
    return byMonth;
  },
  {} as Record<string, Release[]>
);

// ⚡ Bolt Optimization: Pre-calculate Date times before sorting to avoid redundant O(N log N) object allocations
Object.keys(releasesByMonth).forEach(month => {
  const monthReleases = releasesByMonth[month];
  const mapped = monthReleases.map(release => ({
    release,
    time: new Date(release.date.split("/").reverse().join("-")).getTime(),
  }));
  mapped.sort((a, b) => b.time - a.time);
  releasesByMonth[month] = mapped.map(item => item.release);
});

const sortedMonths = Object.keys(releasesByMonth)
  .map(month => {
    const [monthName, year] = month.split(" ");
    return {
      month,
      time: new Date(Number(year), (monthOrder[monthName] ?? 1) - 1).getTime(),
    };
  })
  .sort((a, b) => b.time - a.time)
  .map(item => item.month);

export default function Changelog() {
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(
    new Set(["v1.3.0"])
  );

  const toggleRelease = (version: string) => {
    const newExpanded = new Set(expandedReleases);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedReleases(newExpanded);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10">
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
          <Sparkles className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-wide">Novidades</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Novidades
            </h1>
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {releases.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Releases
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">159</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Testes
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">50+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Commits
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">~85%</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Cobertura
            </div>
          </Card>
        </div>

        {/* Timeline by Month */}
        <div className="space-y-8">
          {sortedMonths.map(month => (
            <div key={month}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {month}
              </h2>
              <div className="space-y-4 ml-4">
                {releasesByMonth[month].map((release, index) => (
                  <div key={release.version} className="relative">
                    {/* Release Card */}
                    <Card
                      className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                        expandedReleases.has(release.version)
                          ? "bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-900"
                          : "bg-white dark:bg-slate-800"
                      }`}
                      onClick={() => toggleRelease(release.version)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                              {release.version}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {release.date}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {release.highlights}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-6 h-6 text-slate-400 transition-transform ${
                            expandedReleases.has(release.version)
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </div>

                      {/* Expanded Content */}
                      {expandedReleases.has(release.version) && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                          {release.features.map((feature, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-slate-600 dark:text-slate-400">
                                  {feature.icon}
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {feature.category}
                                </h4>
                              </div>
                              <ul className="space-y-1 ml-8">
                                {feature.items.map((item, itemIdx) => (
                                  <li
                                    key={itemIdx}
                                    className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                                  >
                                    <span className="text-blue-600 mt-1">
                                      •
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-8 -ml-8 w-4 h-4 bg-blue-600 rounded-full border-4 border-slate-50 dark:border-slate-950" />
                    {index < releasesByMonth[month].length - 1 && (
                      <div className="absolute left-0 top-12 -ml-7 w-0.5 h-12 bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
