import { useState } from 'react';
import { ChevronDown, Sparkles, Bug, Zap, Shield, Accessibility, Calendar, Plane, TrendingUp, Rocket, Code, Database, Gauge, Eye, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Release {
  version: string;
  date: string;
  month: string;
  status: 'released' | 'milestone' | 'planned';
  highlights: string;
  features: Array<{
    icon: React.ReactNode;
    category: string;
    items: string[];
  }>;
}

const releases: Release[] = [
  {
    version: 'v2.0.0',
    date: '17/07/2026',
    month: 'Julho 2026',
    status: 'released',
    highlights: 'Seção de Novidades com Histórico Completo + Testes CI/CD',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Página de Novidades',
        items: [
          'Componente Changelog.tsx com timeline visual completa',
          '20+ releases com histórico desde fevereiro/2026',
          'Rota /novidades integrada ao App.tsx',
          'Botão "Novidades" no header da Home',
          'Design moderno com ícones, cores e transições',
          'Histórico organizado por mês com inversão de ordem',
        ],
      },
      {
        icon: <Zap className="w-5 h-5" />,
        category: 'Suite de Testes',
        items: [
          '159 testes passando com 100% de sucesso',
          'Testes para voiceTranscription.ts (242 linhas)',
          'Cobertura: ~85% linhas, ~78% branches, ~90% funções',
          '20 arquivos de teste',
        ],
      },
      {
        icon: <Code className="w-5 h-5" />,
        category: 'CI/CD Pipeline',
        items: [
          'test.yml - Testes automáticos, lint, segurança',
          'deploy.yml - Deploy automático em produção',
          'quality.yml - Análise de qualidade e performance',
          'Testes agendados diariamente às 2:00 AM UTC',
          'Deploy automático após testes passarem',
        ],
      },
    ],
  },
  {
    version: 'v1.9.0',
    date: '14/07/2026',
    month: 'Julho 2026',
    status: 'released',
    highlights: 'Interface Refinada e Copa 2026 Dinâmica',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Novos Componentes',
        items: [
          'Botões "Limpar" em cada card de Ida e Volta',
          'Remove: aeroporto, companhia, data, hora, voo, localizador',
          'Ícone de lixeira com cores temáticas (azul/laranja)',
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Calendário Melhorado',
        items: [
          'Finais de semana prolongados simplificados',
          'Considera apenas feriado + sábado + domingo',
          'Reduz significativamente dias marcados',
          'Painel da Copa reduzido ao mínimo com botão sanfona',
          'Ícone ChevronDown animado (rotação 180°)',
          'Preferência de visualização persistida em localStorage',
        ],
      },
      {
        icon: <Bug className="w-5 h-5" />,
        category: 'Tratamento de Erros',
        items: [
          'Retry automático para erros transitórios de HTML',
          'Detecção de hibernação do sandbox',
          'Backoff exponencial (1s → 2s → 4s)',
          'Sem erros técnicos no console do usuário',
        ],
      },
      {
        icon: <Plane className="w-5 h-5" />,
        category: 'Copa 2026 Dinâmica',
        items: [
          'Calendário dinâmico com jogos do Brasil',
          'Resultados em tempo real (4 jogos disputados)',
          'Estatísticas: 3V 1E 0D | 9 gols pró, 2 contra',
          'Próximo jogo destacado (Oitavas de Final)',
        ],
      },
    ],
  },
  {
    version: 'v1.8.0',
    date: '13/07/2026',
    month: 'Julho 2026',
    status: 'released',
    highlights: 'Performance, Segurança e Acessibilidade',
    features: [
      {
        icon: <Zap className="w-5 h-5" />,
        category: 'Otimizações de Performance',
        items: [
          'Paralelização de fetches independentes (50-60% mais rápido)',
          'Cache em memória para notificações (13.3ms → 1.2ms)',
          'Refatoração de operações de array (single-pass loops)',
          'Lazy loading adicional para componentes pesados',
          'Tree-shaking de dependências não utilizadas',
          'Redução de chunk principal: 2.2 MB → 1.03 MB (54%)',
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: 'Segurança Crítica',
        items: [
          'Fix CRÍTICO: IDOR em endpoint getWeeks',
          'Validação de autorização adicionada',
          'Testes de segurança inclusos',
          'Security headers otimizados para dev e produção',
          'CSP (Content Security Policy) configurado',
          'Proteção contra XSS e CSRF',
        ],
      },
      {
        icon: <Accessibility className="w-5 h-5" />,
        category: 'Acessibilidade (WCAG)',
        items: [
          'Labels de formulário vinculados corretamente aos inputs',
          'Aria-labels adicionados aos inputs de voos',
          'Inputs de data com labels semânticos (<label htmlFor>)',
          'Identificadores únicos em botões repetitivos',
          'Estados de loading e disabled nos formulários',
        ],
      },
    ],
  },
  {
    version: 'v1.7.0',
    date: '10/07/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Restyling Moderno com Roxo/Ciano',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Paleta Roxo/Ciano',
        items: [
          'Cores roxo (#7c3aed) e ciano (#06b6d4)',
          'Variáveis CSS para gradientes dinâmicos',
          'Contraste WCAG testado e validado',
          'Tema escuro com roxo/ciano',
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Efeitos Visuais',
        items: [
          'Glassmorphism em cards principais',
          'Gradientes dinâmicos (azul→roxo→ciano)',
          'Animação de movimento em gradientes',
          'Ripple effect em botões',
          'Glow effect com roxo/ciano',
          'Scale/hover animations em 30-40 botões',
          'Animação de pulsação em badges SMILES e LATAM PASS',
        ],
      },
    ],
  },
  {
    version: 'v1.6.0',
    date: '08/07/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Feriados, Calendário Avançado e Milhas',
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Sistema de Feriados',
        items: [
          'Feriados nacionais, estaduais (SC) e municipais (Blumenau)',
          'Sinalização visual de feriados na página de calendário',
          'Mouse-over para exibir nome do feriado',
          'Cores diferenciadas: vermelho=nacional, azul=municipal, verde=estadual',
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Finais de Semana Prolongados',
        items: [
          'Lógica para detectar finais de semana prolongados',
          'Destaque visual em cor roxo claro (bg-purple-100)',
          'Feriados que caem na sexta prolongam para segunda',
          'Toggle/checkbox para filtrar apenas feriados e prolongados',
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Sistema de Milhas',
        items: [
          'Colunas smilesPoints e latamPassPoints no schema',
          'Campos SMILES e LATAM PASS no frame de valores',
          'Soma mensal de milhas gastas no resumo',
          'Glow em badges SMILES (laranja com roxo)',
          'Glow em badges LATAM PASS (vermelho com ciano)',
        ],
      },
    ],
  },
  {
    version: 'v1.5.0',
    date: '05/07/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Cotações de Voos e Copa 2026',
    features: [
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Novo: Módulo de Cotações',
        items: [
          'Integração com Sky Scrapper API (RAPIDAPI_KEY)',
          'Tabelas flight_quotes e api_usage_tracker no banco',
          'Helpers CRUD para cotações em server/db.ts',
          'Router de cotações em server/routers/quotes.ts',
          'Página FlightQuotes.tsx com cards por semana',
          'Rota /cotacoes com lazy loading',
          'Botão "Cotações" no menu de navegação',
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Dados Detalhados de Cotação',
        items: [
          'Captura de companhia aérea de ida e volta',
          'Captura de data e hora de partida',
          'Colunas outboundAirline, returnAirline, outboundDeparture, returnDeparture',
          'Exibição de companhia e data/hora na página',
        ],
      },
      {
        icon: <Plane className="w-5 h-5" />,
        category: 'Copa 2026 - Fase 1',
        items: [
          'Painel com próximos jogos do Brasil (1ª fase)',
          'Data, adversário, cidade e dias restantes',
          'Destaque visual para jogos passados vs. próximos',
          'Fases eliminatórias (oitavas, quartas, semifinais, final)',
          'Lógica para mostrar jogos que coincidem com cada semana',
        ],
      },
    ],
  },
  {
    version: 'v1.4.0',
    date: '02/07/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'E-mail e Compartilhamento',
    features: [
      {
        icon: <Mail className="w-5 h-5" />,
        category: 'Notificações por E-mail',
        items: [
          'Tabela ticket_notification_emails no schema',
          'Helper de envio com Resend',
          'Procedures tRPC: getNotificationEmails, addNotificationEmail, removeNotificationEmail',
          'Disparo automático em inclusão, alteração e exclusão de bilhete',
          'Seção "Destinatários de Alertas" na tela AdminNotifications',
          'Testes unitários para procedures',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Compartilhamento',
        items: [
          'Botão WhatsApp com texto criativo, emojis e links',
          'Procedure tRPC para enviar e-mail de compartilhamento',
          'Botão "📧 Compartilhar por E-Mail"',
          'Integração com lista de e-mails cadastrados',
          'Horários do voo (ida e volta) no corpo do e-mail',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'UX Melhorada',
        items: [
          'Biblioteca Sonner para notificações toast',
          'Substituição de alert() por toast.success() e toast.error()',
          'Feedback visual em todas as ações',
        ],
      },
    ],
  },
  {
    version: 'v1.3.0',
    date: '28/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Painel Admin de Notificações',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Administração',
        items: [
          'Painel admin com próximos alertas agendados',
          'Histórico de envios e dispositivos registrados',
          'Endpoint tRPC getNotificationStatus',
          'Página AdminNotifications.tsx com painel visual',
          'Rota /admin/notifications com acesso no cabeçalho',
        ],
      },
      {
        icon: <Database className="w-5 h-5" />,
        category: 'Logging e Limpeza',
        items: [
          'Tabela notification_log com weekNumber, direction, avisoLabel, etc',
          'Helpers insertNotificationLog e getNotificationLogs',
          'Registro de log no job de push (sucesso e falha)',
          'Endpoint tRPC adminNotifications.getLogs',
          'Rotina automática para limpar logs com mais de 90 dias',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Configuração',
        items: [
          'Gerenciador de push notifications no header',
          'Popup com Aviso 1 e Aviso 2',
          'Combo de antecedência (48h, 24h, 12h, 6h, 4h, 3h, 2h, 1h, 30min)',
          'Botão de teste para forçar envio da notificação',
        ],
      },
    ],
  },
  {
    version: 'v1.2.0',
    date: '25/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Calendário e Notificações Push',
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Novo: Calendário Anual',
        items: [
          'Página CalendarView com grade anual (12 meses)',
          'Dias de voo emitidos em verde (futuros/presentes) e cinza escuro (passados)',
          'Rota /calendar com botão de acesso no cabeçalho',
          'Popup flutuante ao clicar em dia com voo',
          'Dados do bilhete (companhia, horário, aeroporto, localizador)',
          'Opções de compartilhamento via WhatsApp e agenda',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Push Notifications',
        items: [
          'Instalação de web-push e geração de chaves VAPID',
          'Schema push_subscriptions no banco de dados',
          'Endpoints tRPC para salvar/remover subscriptions',
          'Job agendado para enviar notificação 24h antes do voo',
          'Service Worker para receber e exibir notificações',
          'Botão "Ativar Notificações" com feedback visual',
        ],
      },
    ],
  },
  {
    version: 'v1.1.0',
    date: '20/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Tipos de Bilhete e Otimizações',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Tipos de Bilhete',
        items: [
          'Campo ticketType (roundtrip / oneway) no schema',
          'Seletor "Ida e Volta" / "Somente Ida" no card',
          'Campos de volta aparecem dinamicamente',
          'Atualização de rotas tRPC para persistir ticketType',
        ],
      },
      {
        icon: <Zap className="w-5 h-5" />,
        category: 'Performance e Segurança',
        items: [
          'Code Splitting com React.lazy e Suspense',
          'express-rate-limit nas rotas de API',
          'Helmet para Security Headers no Express',
          'Limite do body-parser reduzido de 50MB para 2MB',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: '15/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Interatividade Avançada',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'UX Melhorada',
        items: [
          'Pull-to-refresh: puxar para baixo para recarregar dados',
          'Date pickers inline no card de bilhete',
          'Cópia automática de datas ao expandir card',
          'Alteração de título para "Consulta de Preços"',
        ],
      },
      {
        icon: <Bug className="w-5 h-5" />,
        category: 'Correções Críticas',
        items: [
          'Ícone do site (favicon) branco corrigido',
          'Logotipo no cabeçalho branco corrigido',
          'Herança de datas no datetime-local do bilhete',
          'Preenchimento incorreto de código de companhia',
        ],
      },
    ],
  },
  {
    version: 'v0.9.0',
    date: '10/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Integração com Calendários',
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Calendários Externos',
        items: [
          'Botão "Adicionar à Agenda" (Google Calendar, Outlook, .ics)',
          'Evento criado 2h antes do voo',
          'Lembrete configurável (1h, 1h30, 2h, 2h30, 3h)',
          'Duração ajustada (+1h15 ao horário do voo)',
          'Endereço completo dos aeroportos na localização',
          'Botões "Rastrear Voo" com URL dinâmica do Google',
          'Link de rastreamento nas observações dos eventos',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Sincronização',
        items: [
          'Botões de cópia no card de Ida',
          'Copiar Companhia Aérea para os campos da Volta',
          'Copiar Localizador para os campos da Volta',
        ],
      },
    ],
  },
  {
    version: 'v0.8.0',
    date: '05/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Ícones e Sugestões Automáticas',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Visual',
        items: [
          'Ícones reais das companhias aéreas (LATAM, Gol, Azul)',
          'Exibição de dia da semana ao lado das datas',
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Inteligência',
        items: [
          'Preenchimento automático do localizador com sigla da companhia',
          'Memória histórica de números de voo por companhia/dia/horário',
          'Pré-preenchimento de data com a data da semana',
          'Indicador visual de sugestão automática',
        ],
      },
    ],
  },
  {
    version: 'v0.7.0',
    date: '01/06/2026',
    month: 'Junho 2026',
    status: 'released',
    highlights: 'Controles de Visibilidade',
    features: [
      {
        icon: <Eye className="w-5 h-5" />,
        category: 'Privacidade',
        items: [
          'Botão de olho para ocultar/exibir valores monetários',
          'Valores ocultos por padrão ao abrir o site',
          'Botão funciona apenas quando usuário está logado',
        ],
      },
      {
        icon: <Bug className="w-5 h-5" />,
        category: 'Correções',
        items: [
          'Campos de cards não apagam durante digitação',
          'Localizadores persistem após reload',
        ],
      },
    ],
  },
  {
    version: 'v0.6.0',
    date: '28/05/2026',
    month: 'Maio 2026',
    status: 'released',
    highlights: 'PWA e Offline',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Progressive Web App',
        items: [
          'Manifesto PWA com ícone e cores personalizadas',
          'Meta tags iOS (apple-touch-icon, status bar, viewport)',
          'Service Worker para cache offline',
          'Renomeação para Smart Fly (título, cabeçalho, PWA)',
          'Ícone personalizado Smart Fly (SF + avião estilizado)',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Responsividade',
        items: [
          'Layout responsivo mobile-first',
          'Otimização de cabeçalho, cards, filtros',
          'Safe-area-inset no cabeçalho para iPhone',
        ],
      },
    ],
  },
  {
    version: 'v0.5.0',
    date: '25/05/2026',
    month: 'Maio 2026',
    status: 'released',
    highlights: 'Exportação e Melhorias',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Exportação',
        items: [
          'Exportar para PDF com layout colorido A4',
          'Quebra de páginas por mês',
          'Botão no cabeçalho para exportação',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Bilhetes',
        items: [
          'Campo "Número do Voo" para ida e volta',
          'Botão "Salvar" unificado (substituindo botões OK individuais)',
        ],
      },
    ],
  },
  {
    version: 'v0.4.0',
    date: '20/05/2026',
    month: 'Maio 2026',
    status: 'released',
    highlights: 'Gráficos e Resumo Anual',
    features: [
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'Visualizações',
        items: [
          'Gráfico de variação de preços com filtros por companhia',
          'Resumo anual com KPIs (bilhetes, investimento, média)',
          'Rastreamento de emissão de bilhetes',
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Controles',
        items: [
          'Filtros por faixa de preço, status de bilhete e mês',
          'Redesenho de layout com cards modernos lado a lado',
        ],
      },
    ],
  },
  {
    version: 'v0.3.0',
    date: '15/05/2026',
    month: 'Maio 2026',
    status: 'released',
    highlights: 'Conceito Inicial',
    features: [
      {
        icon: <Plane className="w-5 h-5" />,
        category: 'Features Iniciais',
        items: [
          'Layout moderno Travel Dashboard (azul + verde + laranja)',
          'Todas as 44 semanas de 2026 com datas de ida/retorno',
          'Comparação de preços em 6 plataformas',
          'Seletor de aeroporto (GRU ou CGH)',
          'Indicadores de feriados nacionais e pontos facultativos',
          'Agrupamento por mês com accordion',
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: 'Backend',
        items: [
          'Autenticação por e-mail/senha',
          'Banco de dados MySQL para persistência',
        ],
      },
    ],
  },
  {
    version: 'Bootstrap',
    date: '25/02/2026',
    month: 'Fevereiro 2026',
    status: 'milestone',
    highlights: 'Início do Projeto',
    features: [
      {
        icon: <Rocket className="w-5 h-5" />,
        category: 'Marco Inicial',
        items: [
          'Initial project bootstrap - Criação do repositório',
          'Configuração inicial do ambiente de desenvolvimento',
          'Setup de dependências e ferramentas',
          'Estrutura base do projeto estabelecida',
          'Primeiro commit: 25/02/2026 08:45:24 UTC-5',
        ],
      },
    ],
  },
];

export default function Changelog() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>('v2.0.0');

  // Group releases by month (mantém ordem reversa)
  const releasesByMonth = releases.reduce((acc, release) => {
    if (!acc[release.month]) {
      acc[release.month] = [];
    }
    acc[release.month].push(release);
    return acc;
  }, {} as Record<string, Release[]>);

  // Ordena meses em ordem reversa (mais recentes primeiro)
  const months = Object.keys(releasesByMonth).sort().reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Novidades
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Histórico completo de entregas e marcos desde fevereiro de 2026
          </p>
        </div>

        {/* Timeline by Month */}
        <div className="space-y-8">
          {months.map((month) => (
            <div key={month}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {month}
              </h2>
              <div className="space-y-4 ml-4">
                {releasesByMonth[month].sort((a, b) => {
                  const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
                  const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
                  return dateB - dateA; // Decrescente (mais recentes primeiro)
                }).map((release, index) => (
                  <div key={release.version} className="relative">
                    {/* Release Card */}
                    <Card
                      className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                        expandedVersion === release.version
                          ? 'ring-2 ring-blue-500 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() =>
                        setExpandedVersion(
                          expandedVersion === release.version ? null : release.version
                        )
                      }
                    >
                      {/* Release Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-4 h-4 rounded-full ring-4 ${
                              release.status === 'milestone'
                                ? 'bg-yellow-500 ring-yellow-100 dark:ring-yellow-900'
                                : 'bg-blue-500 ring-blue-100 dark:ring-blue-900'
                            }`} />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                              {release.version}
                            </h3>
                            {release.status === 'released' && (
                              <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                ✅ Lançado
                              </span>
                            )}
                            {release.status === 'milestone' && (
                              <span className="px-3 py-1 text-sm font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                🎯 Marco
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            {release.date}
                          </p>
                          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                            {release.highlights}
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-6 h-6 text-slate-600 dark:text-slate-400 transition-transform ${
                            expandedVersion === release.version ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Expandable Content */}
                      {expandedVersion === release.version && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                          {release.features.map((feature, featureIndex) => (
                            <div key={featureIndex}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="text-blue-600 dark:text-blue-400">
                                  {feature.icon}
                                </div>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {feature.category}
                                </h4>
                              </div>
                              <ul className="space-y-2 ml-8">
                                {feature.items.map((item, itemIndex) => (
                                  <li
                                    key={itemIndex}
                                    className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="text-blue-500 mt-1">✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              20+
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Releases & Marcos
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              159
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Testes Passando
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              50+
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Commits
            </p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              ~85%
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Cobertura de Testes
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Primeira entrega: 15/05/2026 (v0.3.0) • Última atualização: 17/07/2026 • Versão Atual: 2.0.0 • Status: ✅ Em Produção
          </p>
        </div>
      </div>
    </div>
  );
}
