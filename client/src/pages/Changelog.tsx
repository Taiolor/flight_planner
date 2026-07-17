import { useState } from 'react';
import { ChevronDown, Sparkles, Bug, Zap, Shield, Accessibility, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Release {
  version: string;
  date: string;
  status: 'released' | 'planned';
  highlights: string;
  features: Array<{
    icon: React.ReactNode;
    category: string;
    items: string[];
  }>;
}

const releases: Release[] = [
  {
    version: 'v1.7.0',
    date: 'Julho 2026',
    status: 'released',
    highlights: 'Documentação Completa e CI/CD',
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Documentação',
        items: [
          'Guia completo de testes (GUIA_EXECUCAO_TESTES.md)',
          'Configuração de CI/CD (CI_CD_SETUP.md)',
          'Troubleshooting e boas práticas',
        ],
      },
      {
        icon: <Zap className="w-5 h-5" />,
        category: 'CI/CD',
        items: [
          'Workflows de testes automáticos',
          'Deploy automático em produção',
          'Análise de qualidade e performance',
          'Testes agendados diariamente',
        ],
      },
    ],
  },
  {
    version: 'v1.6.0',
    date: 'Julho 2026',
    status: 'released',
    highlights: 'Testes Completos e Cobertura',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Testes',
        items: [
          '159 testes passando com 100% de sucesso',
          'Testes para voiceTranscription.ts (242 linhas)',
          'Cobertura: ~85% linhas, ~78% branches, ~90% funções',
          '20 arquivos de teste',
        ],
      },
    ],
  },
  {
    version: 'v1.5.0',
    date: 'Julho 2026',
    status: 'released',
    highlights: 'Refinamentos de Interface',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Novos Componentes',
        items: [
          'Botões "Limpar" em cada card de Ida e Volta',
          'Remove: aeroporto, companhia, data, hora, voo, localizador',
          'Ícone de lixeira com cores temáticas',
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Calendário',
        items: [
          'Finais de semana prolongados simplificados',
          'Considera apenas feriado + sábado + domingo',
          'Reduz significativamente dias marcados',
        ],
      },
      {
        icon: <Bug className="w-5 h-5" />,
        category: 'Correções',
        items: [
          'Retry automático para erros transitórios',
          'Detecção de hibernação do sandbox',
          'Backoff exponencial (1s → 2s → 4s)',
        ],
      },
    ],
  },
  {
    version: 'v1.4.0',
    date: 'Julho 2026',
    status: 'released',
    highlights: 'Melhorias de Segurança',
    features: [
      {
        icon: <Shield className="w-5 h-5" />,
        category: 'Segurança',
        items: [
          'Fix CRÍTICO: IDOR em endpoint getWeeks',
          'Validação de autorização adicionada',
          'Testes de segurança inclusos',
          'Security headers otimizados',
        ],
      },
    ],
  },
  {
    version: 'v1.3.0',
    date: 'Junho 2026',
    status: 'released',
    highlights: 'Copa do Mundo 2026',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Novo: Brasil na Copa',
        items: [
          'Calendário dinâmico com jogos do Brasil',
          'Resultados em tempo real (4 jogos disputados)',
          'Estatísticas: 3V 1E 0D | 9 gols pró, 2 contra',
          'Painel reduzido ao mínimo com botão sanfona',
          'Ícone ChevronDown animado (rotação 180°)',
          'Preferência de visualização persistida',
        ],
      },
    ],
  },
  {
    version: 'v1.2.0',
    date: 'Junho 2026',
    status: 'released',
    highlights: 'Acessibilidade e UX',
    features: [
      {
        icon: <Accessibility className="w-5 h-5" />,
        category: 'Acessibilidade (WCAG)',
        items: [
          'Labels de formulário vinculados corretamente',
          'Aria-labels adicionados aos inputs',
          'Inputs de data com labels semânticos',
          'Identificadores únicos em botões',
          'Estados de loading e disabled',
        ],
      },
    ],
  },
  {
    version: 'v1.1.0',
    date: 'Junho 2026',
    status: 'released',
    highlights: 'Performance e Otimizações',
    features: [
      {
        icon: <Zap className="w-5 h-5" />,
        category: 'Otimizações',
        items: [
          'Paralelização de fetches independentes (50-60% mais rápido)',
          'Cache em memória para notificações (13.3ms → 1.2ms)',
          'Refatoração de operações de array (single-pass)',
          'Benchmark incluído',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'Junho 2026',
    status: 'released',
    highlights: 'Lançamento Inicial',
    features: [
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: 'Features Principais',
        items: [
          'Dashboard com resumo anual 2026',
          'Calendário interativo com visualização de meses',
          'Sistema de filtros avançados',
          'Listagem de semanas com detalhes',
          'Cards de ida e volta',
          'Gráfico de preços por semana',
          'Exportação em PDF',
          'Notificações push agendadas',
          'Autenticação com Manus OAuth',
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: 'Design',
        items: [
          'Design moderno com gradiente azul-roxo',
          'Paleta corporativa (azul, verde, laranja)',
          'Responsivo para desktop e mobile',
          'Modo escuro/claro',
        ],
      },
    ],
  },
];

export default function Changelog() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>('v1.7.0');

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
            Histórico de melhorias e releases do Flight Planner
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {releases.map((release, index) => (
            <div key={release.version} className="relative">
              {/* Timeline line */}
              {index < releases.length - 1 && (
                <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-transparent" />
              )}

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
                      <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900" />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {release.version}
                      </h2>
                      {release.status === 'released' && (
                        <span className="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          ✅ Lançado
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
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {feature.category}
                          </h3>
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

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              8
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Versões Lançadas
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
            Última atualização: 15/07/2026 • Versão Atual: 1.7.0 • Status: ✅ Em Produção
          </p>
        </div>
      </div>
    </div>
  );
}
