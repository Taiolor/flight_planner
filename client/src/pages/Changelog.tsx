import React, { useState, type MouseEvent } from "react";
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
import { triggerHaptic } from "@/lib/haptics";
import { rememberNavigationFocus } from "@/lib/navigationFocus";
import { Link, useLocation } from "wouter";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished?: Promise<unknown>;
  };
};

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

export const releases: Release[] = [
  // Agosto 2026
  {
    version: "v2.0.0",
    date: "29/08/2026",
    month: "Agosto 2026",
    status: "released",
    highlights:
      "Operação diária mais resiliente: decisão, clima, modo offline, navegação móvel e entrega publicada refinados",
    features: [
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: "Central de Decisão e Planejamento Diário",
        items: [
          "Central de Decisão ampliada com ranking explicável, próxima viagem, fila secundária, métricas reais e atalhos contextuais para Gestão e Calendário",
          "Sanfona integral da Central, atalho Alt + Shift + D, opção de fixar no topo e síntese operacional enquanto o conteúdo está recolhido",
          "Ajuste manual e reversível de relevância por semana, com preferência validada por exercício",
          "Resumo semanal mantém sempre as referências de semana anterior, atual e próxima, calculadas pela data real de acesso",
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Clima e Detalhes de Bilhetes",
        items: [
          "Previsão por trecho enriquecida com condição, horário mais próximo do voo, sensação térmica, visibilidade, vento, rajadas, nascer e pôr do sol",
          "Alertas de chuva, vento e baixa visibilidade apresentados como contexto operacional, com contingência clara quando a fonte não estiver disponível",
          "Detalhes meteorológicos iniciam compactos e podem ser exibidos por trecho, preservando ida e volta independentes",
          "No detalhe do bilhete, localizador e rastreamento agora antecedem o clima; o modal ganhou rolagem interna e fechamento sempre acessível",
        ],
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        category: "PWA, Offline e Disponibilidade",
        items: [
          "Splash de abertura com marcos reais de inicialização, indicador discreto de progresso, aviso de modo offline e respeito à redução de movimento",
          "Cache explícito e validado de próximas viagens, limitado a dados operacionais essenciais e com expiração de 14 dias",
          "Última sincronização exibida quando o dispositivo está offline e recuperação orientada quando não há dados locais para o exercício",
          "Entrega de logos, ícones, imagens institucionais e tiles de mapa reforçada para funcionar no domínio publicado, sem depender de redirecionamentos incompatíveis",
        ],
      },
      {
        icon: <Accessibility className="w-5 h-5" />,
        category: "Experiência Móvel e Cabeçalho",
        items: [
          "Cabeçalho reorganizado em grupos objetivos para desktop e celular, com alvos de toque preservados em larguras de 320 px, 375 px e 390 px",
          "Controle de mostrar ou ocultar valores disponível diretamente no cabeçalho móvel, além do menu de preferências",
          "Menu de recursos passa a manter Exportar PDF legível no fundo escuro, inclusive no estado indisponível",
          "Ações de aparência, avisos e navegação foram reduzidas a ícones quando apropriado, mantendo rótulos acessíveis e dicas descritivas",
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Design System Operacional",
        items: [
          "Central de Decisão, Central de Atenção, Variação de Preços e cards semanais alinhados ao acabamento azul-marinho: gradiente, cabeçalho escuro, superfícies translúcidas e contraste reforçado",
          "Controles de expandir ou recolher foram simplificados para ícones consistentes, com foco visível, hover sutil e preferência de redução de movimento respeitada",
          "Filtros, alertas e indicadores de status receberam contrastes mais robustos, sem depender somente de cor para comunicar prioridade",
          "Navegação inferior móvel recebeu ação Mais e atalhos condicionais, preservando a hierarquia da operação diária",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Confiabilidade e Qualidade",
        items: [
          "Consulta meteorológica corrigida para respeitar a janela inclusiva da fonte e evitar parâmetros incompatíveis em ida e volta",
          "Regressões adicionadas para ativos publicados, mapas, clima, modais, cabeçalho, navegação e contraste de ações críticas",
          "772 testes automatizados aprovados neste ciclo, acompanhados por checagem de TypeScript e build de produção",
          "Duas integrações externas permanecem intencionalmente ignoradas na suíte, sem bloquear a validação local das funcionalidades cobertas",
        ],
      },
    ],
  },
  {
    version: "v1.9.0",
    date: "22/08/2026",
    month: "Agosto 2026",
    status: "released",
    highlights:
      "Gestão de passagens, calendário, metas e experiência diária mais precisos, consistentes e acessíveis",
    features: [
      {
        icon: <Plane className="w-5 h-5" />,
        category: "Gestão de Passagens e Bilhetes",
        items: [
          "Nova área dedicada de Gestão de Passagens, com expansão global ou individual dos meses, animações suaves e entrada escalonada dos cards semanais",
          "Confirmação visual acessível após salvar dados do bilhete, com reidratação dos campos de Terminal para ida, volta e somente ida",
          "Terminais, localizadores, remarcações, cancelamentos e logos compactos das companhias agora aparecem nos resumos e detalhes dos bilhetes",
          "Nomes de companhias padronizados em CAIXA ALTA em Planejamento, Calendário, Cotações, Financeiro, Memórias, notificações e compartilhamentos",
        ],
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Calendário com Datas Efetivas",
        items: [
          "Dias emitidos, popup de bilhete, rastreamento, WhatsApp, Google Agenda, Outlook e arquivo .ics passam a usar a data efetiva do voo emitido",
          "Correção de bilhetes somente ida e de remarcações: o Calendário não marca mais a data planejada quando a passagem foi emitida em outro dia",
          "Resumo de semanas sem passagem alinhado aos trechos realmente emitidos, evitando pendências falsas para semanas com ida ou volta registrada",
          "Legenda para voos cancelados em roxo-escuro e melhorias de contraste, responsividade e detalhes do Calendário",
        ],
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        category: "Planejamento, Metas e Financeiro",
        items: [
          "Cards da Home calculados pela data real de acesso: semana anterior, atual e próxima, sem referência fixa de calendário",
          "Central de atenção priorizada por escore de urgência e adiamento configurável de alertas por 8 horas, 24 horas ou 3 dias",
          "Meta anual de emissões editável por exercício, agora usada corretamente no percentual e na barra de progresso em vez do divisor fixo de semanas",
          "Orçamentos mensais com realizado, projeção, cópia para o próximo ano com ajuste percentual e alertas ao atingir 90% ou ultrapassar o limite",
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Experiência e Acessibilidade",
        items: [
          "Skeletons completos e responsivos para Calendário e Cotações, com revelação gradual do conteúdo após o carregamento",
          "Fade-in acessível padronizado entre estados de carregamento e conteúdo nas telas principais, respeitando redução de movimento",
          "Logo Smart Fly com microinteração, tooltip de retorno à Home e navegação de cabeçalho refinada para desktop e celular",
          "Refinamento visual azul-marinho nos módulos operacionais, preferência de aparência persistida e controles compactos sem perda de acessibilidade",
        ],
      },
      {
        icon: <Gauge className="w-5 h-5" />,
        category: "Telemetria e Fly.IA",
        items: [
          "Mapa administrativo com filtros combináveis de período e tipo de evento, totais por período e persistência da última seleção",
          "Fly.IA ampliado com contexto factual de voo, orientações de embarque e ação segura para abrir direções no Google Maps quando houver origem informada",
          "Painel administrativo de consumo do Gemini com estimativa de uso, orçamento, bloqueio preventivo e alertas operacionais",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Confiabilidade e Qualidade",
        items: [
          "Proteções de acesso, mensagens centralizadas de autenticação e isolamento por exercício preservados nas novas funcionalidades",
          "Cobertura automatizada ampliada continuamente para calendário, gestão, metas, telemetria, interações de cabeçalho e interface responsiva",
          "Mais de 600 testes automatizados no ciclo, com validações recorrentes de TypeScript e build de produção",
        ],
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "18/08/2026",
    month: "Agosto 2026",
    status: "released",
    highlights:
      "Viagens: novos voos, Memórias, desempenho avançado e identidade renovada",
    features: [
      {
        icon: <Plane className="w-5 h-5" />,
        category: "Mais Opções para Cada Semana",
        items: [
          "Inclusão, edição e exclusão de múltiplos voos adicionais por semana, em ida e volta ou somente ida",
          "Validação das datas dentro da semana planejada, confirmação de exclusão e notificações de emissão por trecho",
          "Voos adicionais integrados ao Calendário, PDF, indicadores financeiros e cálculos de milhas",
        ],
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        category: "Memórias de Viagem",
        items: [
          "Nova área Memórias para acompanhar quilômetros realizados e futuros por trecho de voo",
          "Linha do tempo anual de passagens emitidas e espaço para fotos, vídeos e mídias de cada experiência",
          "Cálculo geodésico entre aeroportos para consolidar os quilômetros percorridos",
        ],
      },
      {
        icon: <Gauge className="w-5 h-5" />,
        category: "Performance e Confiabilidade",
        items: [
          "PDF, gráficos e gráficos financeiros carregados sob demanda, reduzindo o peso inicial das páginas",
          "Políticas de cache tRPC por domínio, paginação do histórico de notificações e métricas de Web Vitals",
          "Cotações protegidas por reserva atômica da franquia, limite específico, timeout e tamanho máximo de resposta",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Segurança e Administração",
        items: [
          "Content Security Policy restrita, permissões administrativas persistidas e templates de e-mail com escaping contextual",
          "Telemetria de uso opcional com consentimento, retenção de 30 dias e mapa administrativo com OpenStreetMap",
          "Auditoria de dependências de produção sem vulnerabilidades conhecidas e suíte expandida de testes",
        ],
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        category: "Identidade Viagens",
        items: [
          "Cabeçalho principal simplificado com o rótulo Viagens",
          "Atalho instalável do PWA renomeado para Viagens, com novo ícone de avião e trajetória em V",
          "Navegação administrativa e cabeçalhos padronizados para uma experiência mais consistente",
        ],
      },
    ],
  },
  {
    version: "v1.7.0",
    date: "18/08/2026",
    month: "Agosto 2026",
    status: "released",
    highlights:
      "Planejamento Anual Completo, Cancelamentos por Trecho e Operação Mais Confiável",
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Planejamento Multi-Ano",
        items: [
          "Seletor global de ano conectado à Home, Calendário, Cotações e Financeiro",
          "Semanas geradas de forma idempotente para cada exercício, com ida aos domingos e retorno às sextas-feiras",
          "Dados de semanas, preços, cotações, indicadores e notificações isolados por ano, sem fallback para 2026",
        ],
      },
      {
        icon: <Database className="w-5 h-5" />,
        category: "Cotações, Financeiro e Documentos",
        items: [
          "Cotações e histórico de preços agora acompanham o exercício selecionado no cabeçalho",
          "Indicadores, tabelas, gráficos e projeções financeiras passam a exigir o ano selecionado",
          "Exportação PDF identifica o ano na capa e no nome do arquivo, preservando o contexto anual",
        ],
      },
      {
        icon: <Bell className="w-5 h-5" />,
        category: "Notificações Operacionais",
        items: [
          "Callback anual e idempotente de notificações publicado com execução horária",
          "Histórico e status de alertas filtrados pelo exercício selecionado",
          "Validação controlada do alerta de cancelamento concluída exclusivamente pelo serviço Resend",
        ],
      },
      {
        icon: <Plane className="w-5 h-5" />,
        category: "Cancelamentos por Trecho",
        items: [
          "Novos checkboxes independentes de cancelamento para ida e volta, persistidos por ano",
          "Status de cancelamento destacado na Home, no Calendário, nos detalhes do bilhete e no PDF",
          "Filtro exclusivo de voos cancelados no Calendário e e-mail automático quando um trecho é cancelado",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Qualidade, Performance e Segurança",
        items: [
          "259 testes automatizados aprovados e TypeScript sem erros nas entregas do ciclo",
          "Auditorias integrais de performance e segurança concluídas, incluindo SAST, DAST não invasivo, APIs e OWASP",
          "Plano de execução priorizado criado: otimizações de performance primeiro e remediações de segurança em seguida",
        ],
      },
    ],
  },
  {
    version: "v1.6.0",
    date: "16/08/2026",
    month: "Agosto 2026",
    status: "released",
    highlights:
      "Calendário Mais Confiável, PDF Detalhado e Segurança Reforçada",
    features: [
      {
        icon: <Calendar className="w-5 h-5" />,
        category: "Calendário e Planejamento",
        items: [
          "Correção de timezone para preservar a data exata dos voos no calendário",
          "Voos somente ida agora aparecem como emitidos e abrem os detalhes do bilhete",
          "Badge visual para bilhetes remarcados e identificação atualizada dos jogos da Copa",
          "Resumo de semanas sem passagem com número da semana, datas de ida/volta, ícones e alerta vermelho para compras nos próximos 15 dias",
          "Cabeçalho do calendário aprimorado para telas menores",
        ],
      },
      {
        icon: <Plane className="w-5 h-5" />,
        category: "Exportação PDF de Bilhetes",
        items: [
          "Status de remarcação exibido separadamente para ida, volta ou somente ida",
          "Localizador individual apresentado em cada trecho do bilhete",
          "Quebras de página preservam o cartão completo do bilhete",
          "Companhias aéreas em maiúsculas e centralizadas nas células do PDF",
        ],
      },
      {
        icon: <Shield className="w-5 h-5" />,
        category: "Segurança e Confiabilidade",
        items: [
          "Rate limiting do login tRPC consolidado para evitar consumo duplicado de tentativas",
          "Content Security Policy de produção endurecida, sem unsafe-inline e unsafe-eval para scripts",
          "Migração preparada para pnpm 11, com configurações de patches, overrides e builds no pnpm-workspace.yaml",
          "Pipeline de validação preparada com instalação determinística, TypeScript e Vitest",
        ],
      },
      {
        icon: <Gauge className="w-5 h-5" />,
        category: "Qualidade",
        items: [
          "225 testes automatizados aprovados após as integrações de segurança e dependências",
          "Novos testes unitários para rate limiting de login e Content Security Policy",
          "Validação isolada de atualizações de nanoid e do grupo de dependências de produção",
        ],
      },
    ],
  },
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

// ⚡ Bolt Optimization: Implement a Schwartzian transform (map-sort-map) on the release arrays
// to pre-calculate Date parsing once in O(N) time instead of redundantly during O(N log N) sorting.
Object.keys(releasesByMonth).forEach(month => {
  releasesByMonth[month] = releasesByMonth[month]
    .map(release => ({
      release,
      time: new Date(release.date.split("/").reverse().join("-")).getTime(),
    }))
    .sort((a, b) => b.time - a.time)
    .map(item => item.release);
});

// ⚡ Bolt Optimization: Implement a Schwartzian transform (map-sort-map) on the month keys
// to pre-calculate Date object creation once in O(N) time instead of redundantly during O(N log N) sorting.
const sortedMonths = Object.keys(releasesByMonth)
  .map(month => {
    const [monthName, yearName] = month.split(" ");
    return {
      month,
      time: new Date(
        Number(yearName),
        (monthOrder[monthName] ?? 1) - 1
      ).getTime(),
    };
  })
  .sort((a, b) => b.time - a.time)
  .map(item => item.month);

export default function Changelog() {
  const [location, setLocation] = useLocation();
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(
    new Set(["v2.0.0"])
  );

  const navigateHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    rememberNavigationFocus(location, "changelog-back");
    triggerHaptic();

    const navigate = () => setLocation("/");
    const shouldReduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const transitionDocument = document as ViewTransitionDocument;

    if (shouldReduceMotion || !transitionDocument.startViewTransition) {
      navigate();
      return;
    }

    transitionDocument.startViewTransition(navigate);
  };

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
      <header className="bg-gradient-to-r from-[#071a36] via-[#102f61] to-[#17427e] text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-10">
        <Link
          href="/"
          aria-label="Voltar para a página inicial"
          data-navigation-focus="changelog-back"
          onClick={navigateHome}
          className="flex items-center gap-1.5 rounded-sm text-sm font-medium text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
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
            <div className="text-3xl font-bold text-green-600">772</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Testes
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">90+</div>
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
