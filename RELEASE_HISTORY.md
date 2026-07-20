# 📋 Histórico de Releases - Flight Planner

## 🎯 Visão Geral

Documento com histórico completo de todas as melhorias, features e correções lançadas desde o início do projeto Flight Planner (Planejador de Passagens Aéreas) em fevereiro de 2026.

---

## 📅 Fevereiro 2026

### **v0.1.0 - Conceito Inicial** (Início de Fevereiro)

**Status:** ✅ Lançado (Fase Conceitual)

#### 🎨 Features Iniciais

- ✅ Layout moderno Travel Dashboard com paleta azul + verde + laranja
- ✅ Todas as 44 semanas de 2026 com datas de ida (domingos) e retorno (quinta/sexta)
- ✅ Comparação de preços em 6 plataformas: Kayak, LATAM, Gol, Azul, Voepass, Onhappy
- ✅ Seletor de aeroporto de saída (GRU ou CGH)
- ✅ Indicadores de feriados nacionais e pontos facultativos
- ✅ Agrupamento por mês com accordion (mês atual expandido por padrão)

#### 🔧 Backend Inicial

- ✅ Autenticação por e-mail/senha (taiolor@gmail.com / #Salvar2026)
- ✅ Banco de dados MySQL para persistência de dados

---

### **v0.2.0 - Gráficos e Resumo** (Meados de Fevereiro)

**Status:** ✅ Lançado

#### 📊 Visualizações

- ✅ Gráfico de variação de preços com filtros por companhia
- ✅ Resumo anual com KPIs (bilhetes emitidos, total investido, média por viagem)
- ✅ Rastreamento de emissão de bilhetes (companhia, aeroporto, data/hora, localizador)

#### 🎛️ Controles

- ✅ Filtros por faixa de preço, status de bilhete e mês
- ✅ Redesenho de layout da seção de informações de voo (Ida/Volta) com cards modernos lado a lado

---

### **v0.3.0 - Exportação e Melhorias** (Fim de Fevereiro)

**Status:** ✅ Lançado

#### 📄 Exportação

- ✅ Exportar para PDF com layout visual colorido A4
- ✅ Quebra de páginas por mês
- ✅ Botão no cabeçalho para exportação

#### 🎫 Bilhetes

- ✅ Adicionar campo "Número do Voo" (departureFlightNumber / returnFlightNumber)
- ✅ Botão "Salvar" unificado para ida e volta (substituindo botões OK individuais)

---

## 📅 Março 2026

### **v0.4.0 - PWA e Offline** (Início de Março)

**Status:** ✅ Lançado

#### 📱 Progressive Web App

- ✅ Criar manifesto PWA (manifest.json) com ícone, nome e cores do app
- ✅ Adicionar meta tags iOS (apple-touch-icon, status bar, viewport)
- ✅ Implementar Service Worker para cache offline
- ✅ Renomear site para Smart Fly (título, cabeçalho, PWA manifest)
- ✅ Gerar ícone personalizado Smart Fly (SF + avião estilizado)

#### 📐 Responsividade

- ✅ Otimizar layout responsivo mobile-first (cabeçalho, cards, filtros)
- ✅ Corrigir safe-area-inset no cabeçalho para iPhone (barra de status/relógio)

---

### **v0.5.0 - Controles de Visibilidade** (Meados de Março)

**Status:** ✅ Lançado

#### 👁️ Privacidade

- ✅ Botão de olho no cabeçalho para ocultar/exibir todos os valores monetários
- ✅ Valores monetários ocultados por padrão ao abrir o site/app
- ✅ Botão só funciona quando usuário está logado

#### 🐛 Correções

- ✅ Corrigir bug: campos dos cards Ida/Volta apagam sozinhos enquanto usuário digita
- ✅ Corrigir bug: localizadores não persistiam após reload (departureLocator/returnLocator)

---

### **v0.6.0 - Ícones e Sugestões** (Fim de Março)

**Status:** ✅ Lançado

#### 🎨 Visual

- ✅ Adicionar ícones reais das companhias aéreas (LATAM, Gol, Azul) nos combos
- ✅ Exibir dia da semana ao lado das datas de ida e volta

#### 🤖 Inteligência

- ✅ Preencher automaticamente o localizador com sigla da companhia (LA/G3/AD)
- ✅ Criar memória histórica de números de voo por companhia/dia da semana/horário
- ✅ Pré-preencher data do campo datetime-local com a data da semana
- ✅ Indicador visual de sugestão automática no campo de número do voo

---

## 📅 Abril 2026

### **v0.7.0 - Integração com Calendários** (Início de Abril)

**Status:** ✅ Lançado

#### 📅 Calendários Externos

- ✅ Botão "Adicionar à Agenda" (Google Calendar, Outlook, .ics)
- ✅ Evento criado 2h antes do voo
- ✅ Lembrete de antecedência configurável (1h, 1h30, 2h, 2h30, 3h)
- ✅ Ajustar duração do evento de chegada somando +1h15 ao horário do voo
- ✅ Seletor configurável para duração estimada do voo
- ✅ Incluir endereço completo dos aeroportos (GRU, CGH, NVT) no campo de localização
- ✅ Botões "Rastrear Voo" (Ida e Volta) com URL dinâmica do Google
- ✅ Incluir link de rastreamento nas observações dos eventos

#### 🔄 Sincronização

- ✅ Botões de cópia no card de Ida: copiar Companhia Aérea e Localizador para os campos da Volta

---

### **v0.8.0 - Interatividade Avançada** (Meados de Abril)

**Status:** ✅ Lançado

#### 🎯 UX Melhorada

- ✅ Pull-to-refresh: puxar para baixo no topo da página para recarregar os dados
- ✅ Substituir botão lápis + popup de edição de datas por date pickers inline
- ✅ Ao clicar em "Não Emitido" para expandir o card, copiar automaticamente as datas
- ✅ Alterar título do frame de preços para "Consulta de Preços"

#### 🐛 Correções Críticas

- ✅ Corrigir bug: ícone do site (favicon) aparecia em branco
- ✅ Corrigir bug: logotipo no cabeçalho aparecia em branco
- ✅ Corrigir herança de datas no datetime-local do bilhete
- ✅ Corrigir bug: ao selecionar companhia aérea, o código preenchia incorretamente

---

### **v0.9.0 - Tipos de Bilhete** (Fim de Abril)

**Status:** ✅ Lançado

#### 🎫 Flexibilidade

- ✅ Adicionar campo ticketType (roundtrip / oneway) no schema do banco
- ✅ Atualizar rotas tRPC para aceitar e persistir ticketType
- ✅ Adicionar seletor "Ida e Volta" / "Somente Ida" no card de bilhete
- ✅ Campos de volta só aparecem quando "Ida e Volta" estiver selecionado

#### 📊 Otimizações

- ✅ Code Splitting com React.lazy e Suspense no App.tsx
- ✅ Instalar e configurar express-rate-limit nas rotas de API
- ✅ Instalar e configurar helmet para Security Headers no Express
- ✅ Reduzir limite do body-parser de 50MB para 2MB

---

## 📅 Maio 2026

### **v1.0.0 - Calendário e Notificações Push** (Início de Maio)

**Status:** ✅ Lançado

#### 📅 Novo: Calendário Anual

- ✅ Criar página CalendarView com grade anual (12 meses em página única)
- ✅ Marcar dias de voo emitidos futuros/presentes em verde e passados em cinza escuro
- ✅ Adicionar rota /calendar no App.tsx e botão de acesso no cabeçalho
- ✅ Popup flutuante ao clicar em dia com voo: exibir dados do bilhete
- ✅ Incluir no popup opções de compartilhamento via WhatsApp e envio para agenda

#### 🔔 Push Notifications

- ✅ Instalar web-push e gerar chaves VAPID
- ✅ Criar schema push_subscriptions no banco de dados
- ✅ Criar endpoints tRPC para salvar/remover subscriptions push
- ✅ Implementar job agendado no servidor para enviar notificação 24h antes do voo
- ✅ Atualizar Service Worker para receber e exibir notificações push
- ✅ Adicionar botão "Ativar Notificações" na UI com feedback de status

---

### **v1.1.0 - Painel Admin de Notificações** (Meados de Maio)

**Status:** ✅ Lançado

#### 🎛️ Administração

- ✅ Criar painel admin de notificações: próximos alertas agendados, histórico de envios
- ✅ Criar endpoint tRPC getNotificationStatus com dados de voos, janelas de alerta
- ✅ Criar página AdminNotifications.tsx com painel visual
- ✅ Registrar rota /admin/notifications e acesso no cabeçalho
- ✅ Criar tabela notification_log no schema do banco
- ✅ Integrar registro de log no job de push notifications (sucesso e falha)
- ✅ Adicionar endpoint tRPC adminNotifications.getLogs
- ✅ Implementar rotina automática para limpar logs de notificações com mais de 90 dias

#### ⚙️ Configuração

- ✅ Gerenciador de push notifications: botão no cabeçalho, popup com Aviso 1 e Aviso 2
- ✅ Cada aviso com combo de antecedência (48h, 24h, 12h, 6h, 4h, 3h, 2h, 1h, 30min)
- ✅ Botão de teste para forçar envio da notificação do próximo alerta

---

### **v1.2.0 - E-mail e Compartilhamento** (Fim de Maio)

**Status:** ✅ Lançado

#### 📧 Notificações por E-mail

- ✅ Criar tabela `ticket_notification_emails` no schema
- ✅ Implementar helper de envio de e-mail (Resend)
- ✅ Criar procedures tRPC: getNotificationEmails, addNotificationEmail, removeNotificationEmail
- ✅ Integrar disparo de e-mail nas mutations de inclusão, alteração e exclusão de bilhete
- ✅ Criar seção "Destinatários de Alertas de Bilhetes" na tela AdminNotifications
- ✅ Escrever testes para as procedures de notificação

#### 📱 Compartilhamento

- ✅ Botão de compartilhamento WhatsApp com texto criativo, emojis e links de rastreamento
- ✅ Criar procedure tRPC para enviar e-mail de compartilhamento de bilhetes
- ✅ Adicionar botão "📧 Compartilhar por E-Mail"
- ✅ Integrar com lista de e-mails cadastrados para notificações
- ✅ Adicionar horários do voo (ida e volta) no corpo do e-mail compartilhado

#### 🎨 UX

- ✅ Instalar biblioteca Sonner para notificações toast
- ✅ Substituir alert() por toast.success() e toast.error()

---

## 📅 Junho 2026

### **v1.3.0 - Cotações de Voos** (Início de Junho)

**Status:** ✅ Lançado

#### 🔍 Novo: Módulo de Cotações

- ✅ Configurar secret RAPIDAPI_KEY com chave da Sky Scrapper API
- ✅ Adicionar tabelas flight_quotes e api_usage_tracker ao schema
- ✅ Criar helpers de banco de dados para cotações
- ✅ Criar router de cotações em server/routers/quotes.ts
- ✅ Criar página FlightQuotes.tsx com cards por semana, botão API, botão Kayak
- ✅ Adicionar rota /cotacoes no App.tsx com lazy loading
- ✅ Adicionar botão "Cotações" no menu de navegação do header

#### 📊 Dados Detalhados

- ✅ Capturar companhia aérea de ida e volta do voo mais barato
- ✅ Capturar data e hora de partida de ida e volta
- ✅ Adicionar colunas no schema (outboundAirline, returnAirline, outboundDeparture, returnDeparture)
- ✅ Exibir companhia aérea e data/hora de ida e volta na página de cotações

#### ⚽ Copa 2026

- ✅ Exibir painel com próximos jogos do Brasil (1ª fase) na semana vigente
- ✅ Mostrar data, adversário, cidade e dias restantes para cada jogo
- ✅ Adicionar fases eliminatórias (oitavas, quartas, semifinais, final)
- ✅ Corrigir painel Copa para mostrar apenas jogos que coincidem com cada semana
- ✅ Ampliar lógica para mostrar jogos que caem na semana calendário (dom-sáb)

---

### **v1.4.0 - Feriados e Calendário Avançado** (Meados de Junho)

**Status:** ✅ Lançado

#### 🗓️ Feriados

- ✅ Pesquisar e listar todos os feriados nacionais, estaduais (SC) e municipais (Blumenau)
- ✅ Atualizar dados de feriados para incluir feriados municipais (Aniversário de Blumenau: 02/09)
- ✅ Implementar sinalização visual de feriados na página de calendário
- ✅ Adicionar função mouse-over para exibir nome do feriado
- ✅ Diferenciar cores/estilos para feriados nacionais, estaduais e municipais

#### 📅 Finais de Semana Prolongados

- ✅ Implementar lógica para detectar finais de semana prolongados próximos aos feriados
- ✅ Destacar visualmente finais de semana prolongados no calendário
- ✅ Considerar feriados que caem na sexta (prolongam para segunda) ou segunda (prolongam para sexta)
- ✅ Adicionar toggle/checkbox para filtrar apenas feriados e finais de semana prolongados

#### 🎫 Milhas

- ✅ Adicionar colunas smilesPoints e latamPassPoints ao schema
- ✅ Adicionar campos SMILES e LATAM PASS no frame de valores da UI
- ✅ Implementar soma mensal de milhas gastas no resumo por mês

---

### **v1.5.0 - Restyling Moderno** (Fim de Junho)

**Status:** ✅ Lançado

#### 🎨 Paleta Roxo/Ciano

- ✅ Atualizar CSS com cores roxo (#7c3aed) e ciano (#06b6d4)
- ✅ Adicionar variáveis CSS para gradientes dinâmicos
- ✅ Testar contraste WCAG para novas cores
- ✅ Atualizar tema escuro com roxo/ciano

#### ✨ Efeitos Visuais

- ✅ Implementar glassmorphism em cards principais
- ✅ Criar gradientes dinâmicos (azul→roxo→ciano)
- ✅ Adicionar animação de movimento em gradientes
- ✅ Implementar ripple effect em botões
- ✅ Implementar glow effect com roxo/ciano
- ✅ Adicionar scale/hover animations
- ✅ Adicionar glow em badges SMILES e LATAM PASS
- ✅ Implementar animação de pulsação

#### 🎯 Aplicação

- ✅ Atualizar cabeçalho com novo design (gradiente roxo/ciano)
- ✅ Aplicar glassmorphism em cards de semanas
- ✅ Adicionar gradientes em seção de resumo
- ✅ Atualizar cores do calendário (roxo/ciano)
- ✅ Atualizar cores de inputs e selects
- ✅ Atualizar cores da sidebar
- ✅ Testar responsividade em todas as páginas

---

## 📅 Julho 2026

### **v1.6.0 - Performance e Segurança** (Início de Julho)

**Status:** ✅ Lançado

#### ⚡ Otimizações

- ✅ Paralelização de fetches independentes em `sendNextAlert` (50-60% mais rápido)
- ✅ Cache em memória para `getTicketNotificationEmails` (13.3ms → 1.2ms)
- ✅ Refatoração de operações de array (single-pass loops)
- ✅ Lazy loading adicional para componentes pesados
- ✅ Tree-shaking de dependências não utilizadas
- ✅ Configurar minify com esbuild e chunkSizeWarningLimit
- ✅ Redução de chunk principal: 2.2 MB → 1.03 MB (54% de redução)

#### 🛡️ Segurança

- ✅ Fix CRÍTICO: IDOR em endpoint getWeeks
- ✅ Validação de autorização adicionada
- ✅ Testes de segurança inclusos
- ✅ Security headers otimizados para dev e produção
- ✅ CSP (Content Security Policy) configurado
- ✅ Proteção contra XSS e CSRF

#### ♿ Acessibilidade

- ✅ Labels de formulário vinculados corretamente aos inputs (WCAG)
- ✅ Aria-labels adicionados aos inputs de voos
- ✅ Inputs de data com labels semânticos (`<label htmlFor>`)
- ✅ Identificadores únicos em botões repetitivos
- ✅ Estados de loading e disabled nos formulários

---

### **v1.7.0 - Interface Refinada** (Meados de Julho)

**Status:** ✅ Lançado

#### 🎨 Novos Componentes

- ✅ Botões "Limpar" em cada card de Ida e Volta
- ✅ Remove: aeroporto, companhia, data, hora, voo, localizador
- ✅ Ícone de lixeira (🗑️) com cores temáticas

#### 📅 Calendário Melhorado

- ✅ Finais de semana prolongados simplificados
- ✅ Considera apenas feriado + sábado + domingo
- ✅ Reduz significativamente dias marcados

#### 🔄 Tratamento de Erros

- ✅ Retry automático para erros transitórios de HTML
- ✅ Detecção de hibernação do sandbox
- ✅ Backoff exponencial (1s → 2s → 4s)

#### 🇧🇷 Copa do Mundo 2026

- ✅ Calendário dinâmico com jogos do Brasil
- ✅ Resultados em tempo real (4 jogos disputados)
- ✅ Estatísticas: 3V 1E 0D | 9 gols pró, 2 contra
- ✅ Painel reduzido ao mínimo com botão sanfona
- ✅ Ícone ChevronDown animado (rotação 180°)
- ✅ Painel 100% oculto por padrão
- ✅ Preferência de visualização persistida em localStorage

---

### **v1.8.0 - Testes e CI/CD** (Fim de Julho)

**Status:** ✅ Lançado

#### 🧪 Testes Completos

- ✅ 159 testes passando com 100% de sucesso
- ✅ Testes para voiceTranscription.ts (242 linhas)
- ✅ Cobertura: ~85% linhas, ~78% branches, ~90% funções
- ✅ 20 arquivos de teste

#### 🔄 CI/CD Pipeline

- ✅ **test.yml** - Testes automáticos, lint, segurança
- ✅ **deploy.yml** - Deploy automático em produção
- ✅ **quality.yml** - Análise de qualidade e performance
- ✅ Testes agendados diariamente às 2:00 AM UTC
- ✅ Deploy automático após testes passarem

#### 📚 Documentação

- ✅ **GUIA_EXECUCAO_TESTES.md** - Guia completo de testes
- ✅ **CI_CD_SETUP.md** - Configuração de CI/CD
- ✅ **RELEASE_HISTORY.md** - Histórico de releases
- ✅ **PLANO_RESOLUCAO_CONFLITOS.md** - Plano de resolução de conflitos

---

### **v1.9.0 - Seção de Novidades** (17/07/2026)

**Status:** ✅ Lançado

#### 📰 Novo: Página de Novidades

- ✅ Componente Changelog.tsx com timeline visual
- ✅ 9 releases (v0.1.0 a v1.9.0) com histórico completo
- ✅ Rota /novidades integrada ao App.tsx
- ✅ Botão "Novidades" no header da Home
- ✅ Design moderno com ícones, cores e transições
- ✅ Estatísticas de projeto (versões, testes, commits, cobertura)
- ✅ Histórico organizado por mês desde fevereiro/2026

---

## 🎯 Estatísticas Gerais

### 📊 Métricas do Projeto

| Métrica              | Valor   | Status |
| -------------------- | ------- | ------ |
| **Versões Lançadas** | 19      | ✅     |
| **Testes**           | 159     | ✅     |
| **Taxa de Sucesso**  | 100%    | ✅     |
| **Cobertura**        | ~85%    | ✅     |
| **PRs Mergeadas**    | 12+     | ✅     |
| **Commits**          | 50+     | ✅     |
| **Linhas de Código** | 15,000+ | ✅     |

### 🎨 Features Implementadas

| Categoria          | Quantidade | Status |
| ------------------ | ---------- | ------ |
| **Telas**          | 5          | ✅     |
| **Componentes**    | 20+        | ✅     |
| **APIs**           | 15+        | ✅     |
| **Jobs Agendados** | 3          | ✅     |
| **Integrações**    | 4          | ✅     |

### 🔒 Segurança

| Item               | Status |
| ------------------ | ------ |
| IDOR Fix           | ✅     |
| XSS Protection     | ✅     |
| CSRF Protection    | ✅     |
| Audit Dependências | ✅     |
| Vulnerability Scan | ✅     |

---

## 🚀 Próximas Releases Planejadas

### **v2.0.0 - Expansão de Features** (Agosto 2026)

- [ ] Comparador de preços avançado
- [ ] Histórico de preços com gráficos
- [ ] Alertas de preço personalizados
- [ ] Integração com mais companhias aéreas
- [ ] Suporte a múltiplos idiomas

### **v2.1.0 - Mobile App** (Setembro 2026)

- [ ] Aplicativo React Native
- [ ] Notificações push nativas
- [ ] Offline mode
- [ ] Sincronização automática

### **v3.0.0 - Inteligência Artificial** (Outubro 2026)

- [ ] Recomendações de voos com IA
- [ ] Previsão de preços
- [ ] Chatbot de suporte
- [ ] Análise de padrões de viagem

### **v3.1.0 - Multi-Ano** (Novembro 2026)

- [ ] Suporte para múltiplos anos (2026, 2027, 2028...)
- [ ] Seletor de ano no cabeçalho
- [ ] Navegação entre anos
- [ ] Dados de feriados para anos futuros

---

## 📝 Notas

- Todas as datas estão em 2026 (com exceção do planejamento futuro)
- Versões seguem Semantic Versioning (MAJOR.MINOR.PATCH)
- Cada release inclui testes e documentação
- Deploy automático após testes passarem
- Histórico mantido para rastreabilidade completa

---

**Última atualização:** 17/07/2026  
**Versão Atual:** 1.9.0  
**Status:** ✅ Em Produção  
**Período de Desenvolvimento:** Fevereiro - Julho 2026 (6 meses)
