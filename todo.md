# Planejador de Passagens Aéreas 2026 - TODO

## Concluído

- [x] Layout moderno Travel Dashboard (paleta azul + verde + laranja)
- [x] Todas as 44 semanas de 2026 com datas de ida (domingos) e retorno (quinta/sexta)
- [x] Comparação de preços em 6 plataformas: Kayak, LATAM, Gol, Azul, Voepass, Onhappy
- [x] Seletor de aeroporto de saída (GRU ou CGH)
- [x] Indicadores de feriados nacionais e pontos facultativos
- [x] Agrupamento por mês com accordion (mês atual expandido por padrão)
- [x] Autenticação por e-mail/senha (taiolor@gmail.com / #Salvar2026)
- [x] Banco de dados MySQL para persistência de dados
- [x] Gráfico de variação de preços com filtros por companhia
- [x] Resumo anual com KPIs (bilhetes emitidos, total investido, média por viagem)
- [x] Rastreamento de emissão de bilhetes (companhia, aeroporto, data/hora, localizador)
- [x] Filtros por faixa de preço, status de bilhete e mês
- [x] Corrigir bug dos localizadores (departureLocator/returnLocator não persistiam após reload)
- [x] Redesenhar layout da seção de informações de voo (Ida/Volta) com cards modernos lado a lado

## Pendente

- [x] Exportar para PDF
- [x] Adicionar campo "Número do Voo" (departureFlightNumber / returnFlightNumber) nos cards de Ida e Volta
- [x] Publicar o site
- [x] Remover filtro "Aeroporto de Saída" (label + combobox) do cabeçalho
- [x] Criar manifesto PWA (manifest.json) com ícone, nome e cores do app
- [x] Adicionar meta tags iOS (apple-touch-icon, status bar, viewport)
- [x] Implementar Service Worker para cache offline
- [x] Otimizar layout responsivo mobile-first (cabeçalho, cards, filtros, buscadores)
- [x] Botão de olho no cabeçalho para ocultar/exibir todos os valores monetários
- [x] Corrigir safe-area-inset no cabeçalho para iPhone (barra de status/relógio)
- [x] Substituir botões OK individuais dos cards Ida/Volta por um único botão "Salvar" unificado
- [x] Corrigir bug: campos dos cards Ida/Volta apagam sozinhos enquanto usuário digita (useEffect de sincronização sobrescreve estado local)
- [x] Adicionar ícones reais das companhias aéreas (LATAM, Gol, Azul) nos combos
- [x] Exibir dia da semana ao lado das datas de ida e volta
- [x] Botão "Adicionar à Agenda" (Google Calendar, Outlook, .ics) com evento 2h antes do voo
- [x] Lembrete de antecedência configurável nos eventos de calendário (1h, 1h30, 2h, 2h30, 3h)
- [x] Ajustar duração do evento de chegada somando +1h15 ao horário do voo de partida
- [x] Seletor configurável para duração estimada do voo (tempo de chegada) no painel de agenda
- [x] Incluir endereço completo dos aeroportos (GRU, CGH, NVT) no campo de localização dos eventos de calendário
- [x] Botões "Rastrear Voo" (Ida e Volta) com URL dinâmica do Google
- [x] Incluir link de rastreamento nas observações dos eventos de calendário
- [x] Botões de cópia no card de Ida: copiar Companhia Aérea e Localizador para os campos da Volta
- [x] Pull-to-refresh: puxar para baixo no topo da página para recarregar os dados (equivalente a F5)
- [x] Renomear site para Smart Fly (título, cabeçalho, PWA manifest, index.html)
- [x] Gerar ícone personalizado Smart Fly (SF + avião estilizado) e atualizar PWA
- [x] Botão de compartilhamento WhatsApp com texto criativo, emojis e links de rastreamento
- [x] Instalar web-push, criar schema de push_subscriptions e gerar chaves VAPID
- [x] Criar endpoints tRPC para salvar/remover subscriptions push
- [x] Implementar job agendado no servidor para enviar notificação 24h antes do voo
- [x] Atualizar Service Worker para receber e exibir notificações push
- [x] Adicionar botão "Ativar Notificações" na UI com feedback de status

## Push Notifications (nova sessão)

- [x] Instalar web-push e gerar chaves VAPID
- [x] Criar schema push_subscriptions no banco de dados
- [x] Criar endpoints tRPC para salvar/remover subscriptions push
- [x] Implementar job agendado no servidor para enviar notificação 24h antes do voo
- [x] Atualizar Service Worker para receber e exibir notificações push
- [x] Adicionar botão "Ativar Notificações" na UI com feedback de status

## Melhorias nos campos de bilhete (nova sessão)

- [x] Preencher automaticamente o localizador com sigla da companhia (LA/G3/AD) ao selecionar airline, se o campo estiver vazio
- [x] Criar memória histórica de números de voo por companhia/dia da semana/horário para sugerir número do voo automaticamente
- [x] Pré-preencher data do campo datetime-local de ida/volta com a data da semana (DD/MM/YYYY → YYYY-MM-DD), deixando horário vazio para o usuário preencher
- [x] Adicionar botão "Ativar Notificações" no header com feedback visual de status (ativo/inativo/sem suporte)
- [x] Indicador visual de sugestão automática no campo de número do voo (ícone + estado sugerido/confirmado)
- [x] Botão "Testar Notificação" visível apenas quando push está ativo, envia notificação de teste via endpoint push.sendTest

## Bugs (sessão atual)

- [x] Bug: ao trocar companhia no combo, o localizador com 2 chars (sigla anterior) não é atualizado para a nova sigla
- [x] Bug: campo datetime com apenas data (sem horário) exibe "Invalid Date" no badge do dia da semana
- [x] Remover botão "Testar Notificação" do header (funcionalidade validada)
- [x] Bug: campos datetime de ida e volta não herdam os valores já gravados no banco ao abrir o card de bilhete

## Sessão atual

- [x] Bug: ao clicar em "Não Emitido" os campos datetime não herdam os valores do banco (data de ida/volta da semana)
- [x] Exportar para PDF: botão no cabeçalho, layout visual colorido A4, quebra de páginas por mês
- [x] Job agendado no servidor: enviar notificação push 24h antes do voo
- [x] Service Worker: receber e exibir notificações push corretamente
- [x] Bug: caractere '0' aparecendo visualmente quando o bilhete não está marcado como emitido
- [x] Bug: herança de data de ida/volta a partir dos dias da semana ainda não funciona ao clicar em "Não Emitido"
- [x] Bug PDF: quebras de página não respeitam limite por mês (mês cortado no meio)
- [x] Bug PDF: label da companhia aérea não está centralizada horizontalmente
- [x] SEO: adicionar meta tags keywords, description, Open Graph, Twitter Card, canonical e JSON-LD no index.html
- [x] Bug definitivo: ao clicar em "Não Emitido", preencher tempDepartureDatetime e tempReturnDatetime com as datas da semana (DD/MM/YYYY → YYYY-MM-DD) no momento do clique, hora nula aceita
- [x] Bug: botão PDF parou de exportar dados após última atualização
- [x] Bug: createRoot no FlightPdfExport cria segunda instância do React causando "Cannot read properties of null (reading 'useState')"
- [x] Bug persistente: herança de data de ida/volta ao clicar em "Não Emitido" ainda não funciona — corrigir definitivamente
- [x] Gerenciador de push notifications: botão no cabeçalho, popup com Aviso 1 e Aviso 2, cada um com combo de antecedência (48h, 24h, 12h, 6h, 4h, 3h, 2h, 1h, 30min)
- [x] Bug UX: popup de avisos push não centralizado no mobile — corrigir para fixed+transform centrado em telas pequenas
- [x] Limpar base de push subscriptions duplicadas do banco (alertas repetidos)
- [x] Bug: overlay do popup de push notifications captura cliques e impede interação com selects e botões internos
- [x] Bug: números de voo de ida e volta não aparecem nos cards das semanas (campo preenchido mas não exibido) — causa: Service Worker com cache antigo do app quebrado; solução: desregistrar SW e recarregar
- [x] Bug: erro ao gerar PDF (botão PDF no cabeçalho não funciona)
- [x] Substituir botão lápis + popup de edição de datas por date pickers inline no card (data ida + data volta com label do dia da semana ao lado)
- [x] Ao clicar em "Não Emitido" para expandir o card, copiar automaticamente as datas dos date-pickers (Ida e Retorno) para os campos de data/hora do bilhete (datetime-local Ida e Volta)
- [x] Alterar título do frame de preços de "GRU → NVT • Preços" para "Consulta de Preços"
- [x] Bug: ícone do site (favicon) aparece em branco
- [x] Bug: logotipo no cabeçalho do site aparece em branco
- [x] Corrigir herança de datas no datetime-local do bilhete: ao clicar em "Não Emitido", preencher data/hora ida com data da semana + 00:00 e data/hora volta com data da semana + 00:00
- [x] Bug: ao selecionar companhia aérea no bilhete, o código da companhia preenche o Localizador incorretamente; deve preencher o campo Número de Voo correspondente (ida ou volta) apenas quando vazio ou com somente os 2 caracteres iniciais
- [x] Valores monetários devem ser ocultados por padrão ao abrir o site/app (estado inicial hideValues = true)
- [x] Botão de ocultar/exibir valores só deve funcionar quando o usuário estiver logado (sessão ativa); sem login, valores permanecem sempre ocultos
- [x] Adicionar campo ticketType (roundtrip / oneway) no schema do banco de dados
- [x] Atualizar rotas tRPC para aceitar e persistir ticketType
- [x] Adicionar seletor "Ida e Volta" / "Somente Ida" no card de bilhete; campos de volta só aparecem quando "Ida e Volta" estiver selecionado
- [x] Criar página CalendarView com grade anual (12 meses em página única)
- [x] Marcar dias de voo emitidos futuros/presentes em verde e passados em cinza escuro
- [x] Adicionar rota /calendar no App.tsx e botão de acesso no cabeçalho
- [x] Popup flutuante no CalendarView: ao clicar em dia com voo, exibir dados do bilhete (companhia, horário, aeroporto, localizador)
- [x] Incluir no popup as opções de compartilhamento via WhatsApp e envio para agenda (Google/Outlook/ICS), reutilizando funções existentes
- [x] Bug: push notifications não estão sendo enviadas conforme os parâmetros configurados (Aviso 1 e Aviso 2)
- [x] Criar painel admin de notificações: próximos alertas agendados, histórico de envios e dispositivos registrados
- [x] Criar endpoint tRPC getNotificationStatus com dados de voos, janelas de alerta e subscriptions
- [x] Criar página AdminNotifications.tsx com painel visual
- [x] Registrar rota /admin/notifications e acesso no cabeçalho
- [x] Criar tabela notification_log no schema do banco (weekNumber, direction, avisoLabel, avisoMinutes, sentAt, status, devicesReached, errorMessage)
- [x] Adicionar helpers insertNotificationLog e getNotificationLogs no db.ts
- [x] Integrar registro de log no job de push notifications (sucesso e falha)
- [x] Adicionar endpoint tRPC adminNotifications.getLogs e exibir histórico no painel admin
- [x] Implementar rotina automática para limpar logs de notificações com mais de 90 dias
- [x] Bug: push notifications não estão sendo recebidas pelo usuário (corrigida lógica de status e adicionados logs de diagnóstico)
- [x] Bug: erro de validação tRPC - procedimento recebendo undefined quando espera objeto
- [x] Remover coluna year do schema, do código e do banco de dados (DROP COLUMN)
- [x] Adicionar botão de teste no painel AdminNotifications para forçar envio da notificação do próximo alerta
- [x] Melhorar botão de teste: enviar a mesma mensagem formatada que seria enviada no alerta agendado, com dados oficiais do voo
- [x] Fase 1: Criar estado expandedWeeks e função toggleWeek no Home.tsx
- [x] Fase 1: Accordion de semana implementado inline no Home.tsx (mais seguro que extrair componente)
- [x] Fase 1: Integrado accordion de semana com ChevronDown e click handler
- [x] Fase 2: Accordion de semana implementado (cabeçalho sempre visível, conteúdo expande/recolhe)
- [x] Fase 3: Lógica de abertura automática implementada (mês + semana vigentes abertos por padrão)

## Melhorias de Performance e Segurança

- [x] Performance: Implementar Code Splitting com React.lazy e Suspense no App.tsx
- [x] Segurança: Instalar e configurar express-rate-limit nas rotas de API
- [x] Segurança: Instalar e configurar helmet para Security Headers no Express
- [x] Performance: Reduzir limite do body-parser de 50MB para 2MB globalmente

## Correções dos PRs #2 e #3

- [x] Segurança: Adicionar autenticação no endpoint initWeeks (PR #3)
- [x] Segurança: Substituir comparação de string por crypto.timingSafeEqual no login (PR #3)
- [x] Performance: Otimizar getLowestPrice com useMemo/lowestPriceMap O(1) (PR #2)

## Merges e Correções dos PRs (27/04/2026)

- [x] Sincronizar main local com GitHub (PRs #19, #21, #22, #23, #26, #28)
- [x] Merge PR #14 (ARIA accordion toggle)
- [x] Merge PR #18 (single-pass loops chartData)
- [x] Aplicar PR #25 manualmente (SHA-256 timing fix) e fechar #15
- [x] Aplicar PR #20 manualmente (sameSite lax CSRF fix) e fechar #27
- [x] Fechar PRs redundantes #16 e #24
- [x] Performance: Adicionar índices no banco para weekNumber, isTicketIssued e isDeleted

## Módulo de Cotações (Sky Scrapper API + Kayak)

- [x] Configurar secret RAPIDAPI_KEY com chave da Sky Scrapper API
- [x] Adicionar tabelas flight_quotes e api_usage_tracker ao schema do banco (drizzle/schema.ts)
- [x] Executar pnpm db:push para criar as novas tabelas
- [x] Criar helpers de banco de dados em server/db.ts (getAllFlightQuotes, getFlightQuotesByWeek, insertFlightQuote, deleteFlightQuote, getApiUsage, incrementApiUsage)
- [x] Criar router de cotações em server/routers/quotes.ts (getAll, getByWeek, getApiUsage, fetchFromApi, saveManual, delete)
- [x] Integrar quotesRouter ao appRouter em server/routers.ts
- [x] Criar página FlightQuotes.tsx com cards por semana, botão API, botão Kayak, campo manual e badges de fonte
- [x] Adicionar rota /cotacoes no App.tsx com lazy loading
- [x] Adicionar botão "Cotações" no menu de navegação do header (Home.tsx)
- [x] Criar testes unitários para o módulo de cotações (server/quotes.test.ts)
- [x] Resolver conflitos de merge em Home.tsx (marcadores de conflito removidos)
- [x] Verificar 0 erros TypeScript e 52 testes passando
- [x] Semanas passadas exibidas em cinza escuro (opacidade reduzida, interações desabilitadas, aviso informativo)
- [x] Semana corrente destacada com borda azul e badge "● atual"
- [x] Semanas futuras mantêm cor normal e são totalmente interativas
- [x] Resumo de semanas (atual/futuras/passadas) exibido no header da página de cotações

## Dados detalhados da cotação via API

- [x] Capturar companhia aérea de ida e volta do voo mais barato
- [x] Capturar data e hora de partida de ida e volta
- [x] Adicionar colunas no schema do banco (outboundAirline, returnAirline, outboundDeparture, returnDeparture)
- [x] Executar pnpm db:push para aplicar as novas colunas
- [x] Atualizar helpers de DB para persistir os novos campos
- [x] Atualizar router de cotações para extrair e salvar os novos campos da resposta da API
- [x] Exibir companhia aérea e data/hora de ida e volta na página de cotações

## Painel Copa 2026 na Semana Vigente

- [x] Exibir painel com próximos jogos do Brasil (1ª fase) na semana vigente do planejador
- [x] Mostrar data, adversário, cidade e dias restantes para cada jogo
- [x] Destacar visualmente jogos que já passaram vs. próximos

## Fases Eliminatórias Copa 2026 no Painel

- [x] Adicionar oitavas de final (04-07/07) ao painel da semana vigente com status "possível"
- [x] Adicionar quartas de final (09-11/07) ao painel da semana vigente
- [x] Adicionar semifinais (14-15/07, Dallas) ao painel da semana vigente
- [x] Adicionar final (19/07, MetLife Stadium) ao painel da semana vigente
- [x] Separar visualmente 1ª fase das fases eliminatórias no painel

## Fix: Painel Copa 2026 por Semana

- [x] Corrigir painel Copa para mostrar apenas jogos/fases que coincidem com o intervalo de cada semana (não fixo na semana vigente)

## Fix: Painel Copa — Semana Calendário Completa

- [x] Ampliar lógica do painel Copa para mostrar jogos que caem na semana calendário (dom-sáb) da viagem, mesmo fora do intervalo exato de ida/volta

## Feature: Notificação por E-mail de Alterações de Bilhetes

- [x] Criar tabela `ticket_notification_emails` no schema (id, email, name, active, createdAt)
- [x] Migrar banco com pnpm db:push
- [x] Implementar helper de envio de e-mail (Resend)
- [x] Criar procedures tRPC: getNotificationEmails, addNotificationEmail, removeNotificationEmail, toggleNotificationEmail
- [x] Integrar disparo de e-mail nas mutations de inclusão de bilhete (com detalhes do novo bilhete)
- [x] Integrar disparo de e-mail nas mutations de alteração de bilhete (com antes/depois)
- [x] Integrar disparo de e-mail nas mutations de exclusão de bilhete (com detalhes do bilhete excluído)
- [x] Criar seção "Destinatários de Alertas de Bilhetes" na tela de Administrador de Notificação
- [x] Escrever testes para as procedures de notificação

## Fix: Ordem dos campos no formulário de bilhete

- [x] Inverter ordem: data/hora do voo primeiro, número do voo depois (ida e volta)

## Feature: Botões de Cópia (Ida → Volta)

- [x] Adicionar botão para copiar companhia aérea da ida para a volta
- [x] Adicionar botão para copiar localizador da ida para a volta

## Feature: Notificação por E-mail de Alterações de Bilhetes

- [x] Criar tabela de destinatários de e-mail (ticketNotificationEmails)
- [x] Implementar helpers CRUD para gerenciar destinatários
- [x] Criar helper de envio de e-mail (Resend)
- [x] Adicionar procedures tRPC para CRUD de destinatários e envio de teste
- [x] Integrar disparo de e-mail na mutation updateWeekStatus (criação, alteração, exclusão)
- [x] Criar seção de gerenciamento de e-mails na tela AdminNotifications
- [x] Configurar integração com Resend para envio de e-mails
- [x] Refatorar helper de envio de e-mail para usar Resend
- [x] Testar envio de e-mail de teste via AdminNotifications
- [x] Testar notificações de alteração de bilhetes

## Sugestões de Implementação

### 1. Testar Envio de E-mail

- [x] Corrigir parâmetros do Resend no helper de e-mail
- [x] Validar que o envio de e-mail de teste funciona corretamente

### 2. Integração com Google Calendar

- [x] Criar helper para integração com Google Calendar via MCP
- [x] Adicionar procedures tRPC para criar eventos no calendário
- [x] Implementar criação de evento com 2 horas de antecedencia
- [x] Incluir URL de rastreamento de voo nas observações
- [x] Adicionar botão "Adicionar ao Calendário" na UI (Home.tsx)
- [x] Incluir endereço completo do aeroporto na localização do evento

### 3. Publicar o Site

- [x] Clicar em "Publish" no painel de gerenciamento
- [x] Validar que o site está disponível em flightplan-hq655wm9.manus.space

## Implementação das 3 Sugestões

### 1. Botões "Adicionar ao Calendário"

- [x] Adicionar botão "📅 Adicionar ao Calendário" nos dados de bilhete (ida)
- [x] Integrar com procedures tRPC calendar.createFlightEvent
- [x] Adicionar botão para volta
- [x] Exibir feedback visual (toast) após criar evento

### 2. Endereço Completo do Aeroporto

- [x] Criar mapa de endereços de aeroportos (GRU, NVT, CCJ, etc.)
- [x] Incluir endereço na localização do evento do calendário
- [x] Atualizar helper calendarIntegration.ts para aceitar endereço do aeroporto

### 3. Publicar o Site

- [x] Clicar em "Publish" no painel de gerenciamento
- [x] Validar que o site está disponível em flightplan-hq655wm9.manus.space
- [x] Testar funcionalidades principais em produção

## Feature: Compartilhar por E-Mail

- [x] Criar procedure tRPC para enviar e-mail de compartilhamento de bilhetes
- [x] Adicionar botão "📧 Compartilhar por E-Mail" abaixo do botão WhatsApp
- [x] Integrar com lista de e-mails cadastrados para notificações
- [x] Testar envio de e-mail com dados formatados (Resend)

## Implementação das 3 Sugestões Finais

### 1. Testar Compartilhamento por E-Mail

- [x] Adicionar e-mail na seção "Notificações por E-Mail" da tela AdminNotifications
- [x] Clicar em "Compartilhar por E-Mail" para validar o envio
- [x] Verificar se o e-mail foi recebido com dados formatados corretamente

### 2. Melhorar Feedback com Toast

- [x] Instalar biblioteca Sonner para notificações toast
- [x] Substituir alert() por toast.success() no botão "Compartilhar por E-Mail"
- [x] Substituir alert() por toast.error() para erros
- [x] Adicionar toast nos outros botões (Calendário, etc.)

### 3. Publicar o Site em Produção

- [x] Clicar em "Publish" no painel de gerenciamento
- [x] Validar que o site está disponível em flightplan-hq655wm9.manus.space
- [x] Testar funcionalidades principais em produção
- [x] Implementar envio automático de e-mail ao marcar bilhete como 'Emitido'

## Ajustes no E-mail de Compartilhamento

- [x] Adicionar horários do voo (ida e volta) no corpo do e-mail compartilhado
- [x] Corrigir links de calendário (Outlook e Gmail) para incluir horários corretos dos voos

## Bug Fix: Filtros de Horário

- [x] Bug: filtros de horário não funcionavam porque acessavam campo inexistente `w.departureTime` em vez de `w.departureFlightDatetime`
- [x] Corrigir lógica para extrair horário do formato datetime ISO (ex: "2026-02-22T17:55")
- [x] Usar OR para combinar ida e volta (voos sem horário definido sempre passam no filtro)
- [x] Corrigir badges dos contadores de voos para usar os campos corretos

## Feriados de Blumenau, SC e Nacionais

- [x] Pesquisar e listar todos os feriados nacionais, estaduais (SC) e municipais (Blumenau) de 2026
- [x] Atualizar dados de feriados no flightData.ts para incluir feriados municipais (Aniversário de Blumenau: 02/09)
- [x] Atualizar interface Feriado para incluir tipos "estadual" e "municipal"
- [x] Feriados já são exibidos corretamente nos cards das semanas (sistema já tinha getFeriadosDaSemana funcionando)

## Calendário - Sinalização de Feriados

- [x] Implementar sinalização visual de feriados na página de calendário
- [x] Adicionar função mouse-over para exibir nome do feriado ao passar o mouse
- [x] Diferenciar cores/estilos para feriados nacionais, estaduais e municipais (vermelho=nacional, azul=municipal, verde=estadual, âmbar=observância)

## Calendário - Finais de Semana Prolongados

- [x] Implementar lógica para detectar finais de semana prolongados próximos aos feriados
- [x] Destacar visualmente finais de semana prolongados no calendário (cor roxo claro bg-purple-100)
- [x] Considerar feriados que caem na sexta (prolongam para segunda) ou segunda (prolongam para sexta)

## Calendário - Filtro de Feriados e Finais de Semana Prolongados

- [x] Adicionar toggle/checkbox para filtrar apenas feriados e finais de semana prolongados
- [x] Ocultar outros dias quando filtro está ativo (renderiza div vazia)
- [x] Manter tooltip e cores diferenciadas para cada tipo de feriado

## Notificações por Email - Melhoria de Template

- [x] Localizar e analisar template de email de notificação de bilhetes
- [x] Adicionar seção com dados completos do bilhete (ida e volta)
- [x] Incluir botões de calendário (Outlook, Gmail) para ida e volta (já existem em shareByEmail)
- [x] Atualizar interface TicketChangeNotification com campos de bilhete completo
- [x] Melhorar template HTML com seção "O que foi atualizado" + "Dados Completos do Bilhete"
- [x] Adicionar dados completos nas chamadas de sendTicketNotificationEmail em routers.ts

## Otimização de Performance - Fase 2

- [x] Implementar lazy loading adicional para componentes pesados (AdminNotifications: 71.32 kB)
- [x] Implementar tree-shaking de dependências não utilizadas (manualChunks configurado)
- [x] Analisar e remover dependências duplicadas (pnpm dedupe executado)
- [x] Configurar minify com esbuild e chunkSizeWarningLimit
- [x] Resultado: Chunk principal reduzido de 2.2 MB para 1.03 MB (54% de redução)

## Implementação Multi-Ano (2026, 2027, 2028...)

- [x] Refatorar schema do banco de dados para incluir coluna 'year' em todas as tabelas (flightWeeks, flightPrices, public_prices)
- [x] Atualizar procedures tRPC para aceitar parâmetro 'year' e filtrar dados por ano (getAllFlightWeeks, getAllFlightPrices, getPublicPrices)
- [x] Implementar seletor de ano no cabeçalho (dropdown/tabs) com URL dinâmica
- [x] Refatorar página Home.tsx para usar YearContext e passar selectedYear ao CalendarView
- [x] Refatorar página CalendarView.tsx para suportar múltiplos anos com navegação entre anos
- [x] Atualizar dados de feriados para incluir anos futuros (2027, 2028, 2029, 2030)
- [x] Testar fluxos multi-ano e salvar checkpoint

## Resolução do PR #125 no GitHub

- [x] Resolver conflitos de merge do PR #125 (resolvido localmente em .manus-reviewer-ignore)
- [x] Fazer merge do PR #125 após resolução de conflitos (✓ Merged)

## Resolução do PR #126 no GitHub

- [x] Resolver conflitos de merge do PR #126 (resolvido localmente em version.json)
- [x] Fazer merge do PR #126 após resolução de conflitos (✓ Merged - Otimização de performance aplicada)

## Resolução dos PRs #130 e #131 de UI/UX

- [x] Resolver conflitos de merge do PR #130 (resolvido em .Jules/palette.md)
- [x] Fazer merge do PR #130 (✓ Merged - Tooltip em botão ShareByEmail)
- [x] PR #131 já foi mergeado automaticamente (Proteção de ações destrutivas)
- [x] Todos os PRs abertos resolvidos - repositório limpo

## Bug Fix - Filtros não Funcionam Corretamente

- [x] Filtro de Companhia não retorna resultados quando selecionado (CORRIGIDO)
- [x] Investigar lógica de filtro em Home.tsx (filterAirline não estava sendo aplicado)
- [x] Adicionar lógica de filtro de companhia (ida OU volta)
- [x] Adicionar filterAirline às dependências do useMemo

## UI/UX - Logotipos de Companhias Aéreas

- [x] Companhias já possuem ícones definidos em flightData.ts
- [x] Adicionar logotipos ao filtro de companhia (Select component)
- [x] Melhorar visual com ícones ao lado dos nomes (flex layout com gap)
- [x] Exibição dos logotipos funcionando corretamente

## UI/UX - Skeleton Screen para Carregamento

- [x] Criar componente SkeletonChart para simular gráfico durante carregamento
- [x] Criar componente SkeletonFilters para simular filtros durante carregamento
- [x] Integrar skeleton screens no componente Home com transição suave (Resumo Anual e Filtros)
- [x] Testar animação de carregamento em diferentes velocidades de rede

## Pagamento por Milhas (SMILES e LATAM PASS)

- [x] Adicionar colunas smilesPoints e latamPassPoints ao schema do banco (flightWeeks)
- [x] Executar migração do banco de dados (pnpm db:push)
- [x] Atualizar db.ts para incluir campos de milhas nas queries
- [x] Atualizar routers.ts para aceitar e retornar campos de milhas
- [x] Adicionar campos SMILES e LATAM PASS no frame de valores da UI (input em pontos)
- [x] Implementar soma mensal de milhas gastas no resumo por mês
- [x] Atualizar notificações por email para incluir dados de milhas
- [x] Testar fluxo completo de entrada e exibição de milhas (158 testes passando)

## Restyling Opção 2 (Moderna) - Paleta Roxo/Ciano

### Fase 1: Paleta de Cores Global

- [x] Atualizar CSS com cores roxo (#7c3aed) e ciano (#06b6d4)
- [x] Adicionar variáveis CSS para gradientes dinâmicos
- [x] Testar contraste WCAG para novas cores
- [x] Atualizar tema escuro com roxo/ciano

### Fase 2: Glassmorphism e Gradientes

- [x] Implementar glassmorphism em cards principais
- [x] Criar gradientes dinâmicos (azul→roxo→ciano)
- [x] Adicionar animação de movimento em gradientes
- [x] Aplicar em hero section do Home
- [x] Aplicar em resumo anual
- [x] Testar performance em mobile

### Fase 3: Animações Vibrantes

- [x] Implementar ripple effect em botões
- [x] Implementar glow effect com roxo/ciano
- [x] Adicionar scale/hover animations
- [x] Aplicar a todos os botões (30-40)
- [x] Testar acessibilidade (prefers-reduced-motion)

### Fase 4: Ícones 3D/SVG

- [x] Obter/criar ícones de companhias aéreas (GOL, LATAM, Onhappy, Kayak, Azul, Voepass)
- [x] Implementar animações SVG (rotação, hover)
- [x] Adicionar efeitos de cor roxo/ciano
- [x] Testar em diferentes resoluções
- [x] Otimizar peso dos SVGs

### Fase 5: Glow Effects

- [x] Adicionar glow em badges SMILES (laranja com roxo)
- [x] Adicionar glow em badges LATAM PASS (vermelho com ciano)
- [x] Implementar animação de pulsação
- [x] Aplicar a todas as badges (~20-30)
- [x] Testar em diferentes backgrounds

### Fase 6: Restyling Home

- [x] Atualizar cabeçalho com novo design (gradiente roxo/ciano)
- [x] Aplicar glassmorphism em cards de semanas
- [x] Adicionar gradientes em seção de resumo
- [x] Integrar ícones 3D das companhias
- [x] Atualizar cores de badges de milhas
- [x] Testar responsividade

### Fase 7: Restyling Calendário

- [x] Atualizar cores do calendário (roxo/ciano)
- [x] Aplicar glassmorphism em cards de eventos
- [x] Adicionar animações em datas interativas
- [x] Atualizar cores de feriados
- [x] Testar em mobile

### Fase 8: Restyling Configurações

- [x] Atualizar cores de inputs e selects
- [x] Aplicar glassmorphism em cards de configuração
- [x] Adicionar animações em toggles
- [x] Atualizar cores de botões de ação
- [x] Testar formulários

### Fase 9: Restyling Admin/Dashboard

- [x] Atualizar cores da sidebar
- [x] Aplicar glassmorphism em cards de dados
- [x] Adicionar gradientes em gráficos
- [x] Atualizar cores de status indicators
- [x] Testar em diferentes resoluções

### Fase 10: Restyling Alertas e Notificações

- [x] Atualizar cores de alertas (sucesso, erro, aviso, info)
- [x] Aplicar glassmorphism em modais
- [x] Adicionar animações de entrada/saída
- [x] Atualizar cores de badges de notificação
- [x] Testar acessibilidade de alertas

### Fase 11: Testes Completos

- [x] Testar em Chrome, Firefox, Safari, Edge
- [x] Testar em iOS e Android
- [x] Verificar contraste WCAG AA/AAA
- [x] Testar com leitor de tela
- [x] Verificar prefers-reduced-motion
- [x] Testar performance (Lighthouse)

### Fase 12: Finalização

- [x] Otimizar performance geral
- [x] Documentar mudanças de design
- [x] Criar guia de manutenção
- [x] Preparar checkpoint final
- [x] Pronto para publicação
- [x] Resolver erro de autenticação tRPC na homepage (getPrices) para usuários não autenticados.

## Otimizações de Performance - Fase 3

- [x] Lazy load ExportPdfButton (PDF export) para reduzir bundle inicial
- [x] Executar pnpm dedupe para remover dependências duplicadas (-5 packages)
- [x] Aumentar chunkSizeWarningLimit de 600 para 1000 kB
- [x] Desabilitar sourcemap em build para reduzir tamanho
- [x] Desabilitar reportCompressedSize para acelerar build
- [x] Otimizar esbuild minification com configurações agressivas
- [x] Validar que 164 testes continuam passando após otimizações

## Bug Fix - Localizadores e Números de Voos Não Exibidos

- [x] Identificar causa raiz: updateFlightWeekStatus não filtrava por year
- [x] Corrigir updateFlightWeekStatus para filtrar por year + weekNumber
- [x] Validar com testes (164 testes passando)

## Accordion de Semanas

- [x] Implementar accordion por semana (abrir/fechar) com animação suave
- [x] Semanas passadas iniciam fechadas ao carregar o site
- [x] Semanas futuras/atuais iniciam abertas ao carregar o site
- [x] Botão de expandir/recolher visível no cabeçalho de cada semana

## Bug Fix - Soma de Gastos por Semana

- [x] Corrigir cálculo de valor acumulado por semana: somar TODOS os valores em dinheiro pagos (todas as companhias), não apenas o menor preço
- [x] Somar pontos de milhas separadamente (nunca misturar com dinheiro)
- [x] Exibir ambos os totais no cabeçalho da semana e no resumo geral

## Voo Remarcado

- [x] Adicionar campos departureRescheduled e returnRescheduled ao schema do banco
- [x] Adicionar checkbox "Voo Remarcado" nos cards de bilhete (ida e volta)
- [x] Persistir estado de voo remarcado via tRPC
- [x] CalendarView: pintar voos remarcados em vermelho

## Bug: Dados não carregam da base

- [x] Bug: dados de data/hora, número de voo e localizador não carregam da base para algumas semanas (ex: semana 18 volta)

## Página de Gestão Financeira

- [x] Criar tRPC endpoint getFinancialSummary com dados agregados por semana/mês/ano
- [x] Criar página FinancialDashboard.tsx com KPIs, gráficos e tabelas
- [x] Seção de gastos em dinheiro: total por semana, mês, ano; comparativo por companhia
- [x] Seção de gastos em milhas: SMILES e LATAM PASS separados por semana/mês/ano
- [x] Gráficos de tendência (linha) e comparativo de companhias (barras/pizza)
- [x] Tabela detalhada por semana com todos os campos financeiros
- [x] Seção de projeções para 2027 com sazonalidade, frequência, inflação e correção monetária
- [x] Adicionar botão "Financeiro" no cabeçalho (Home.tsx)
- [x] Registrar rota /financeiro no App.tsx com lazy loading
- [x] Criar testes unitários para os cálculos financeiros

## Bugs Críticos - Sessão Atual

- [x] Remover companhia aérea Voepass de todos os locais (schema, routers, componentes, etc)
- [x] Bug crítico: Gestão Financeira - valores de preços não estão sendo somados corretamente. Faltam valores de kayak, latam, gol, azul, voepass e onhappy. Revisar cálculo de somatória geral no cabeçalho

- [x] Adicionar precisão com centavos em todos os valores da Gestão Financeira (cabeçalho, KPIs, tabelas, gráficos)

- [x] Implementar comparativo de variação percentual de gastos entre semana atual e anterior na Gestão Financeira

- [x] Atualizar página de Novidades com cabeçalho em layout igual ao da Gestão Financeira

- [x] Adicionar botão accordion (expandir/recolher) para Resumo Anual 2026 e Filtros e Controles na tela principal

- [x] Adicionar alertas visuais com cores na tabela de Gestão Financeira quando variação percentual ultrapassar ±20%

- [x] Padronizar cabeçalhos de Novidades e Financeiro com layout, ícones e cores iguais ao do Calendário

- [x] Separar Resumo Anual e Filtros em 2 acordeons independentes na tela principal

- [x] Bug: Gestão Financeira no mobile está pedindo login do Manus OAuth - remover completamente qualquer referência ao Manus OAuth

- [x] Bug: Gestão Financeira não responsiva no mobile - KPIs, tabelas e gráficos ficam grandes demais e não se adaptam à tela pequena

## Segurança - Dependabot / Audit

- [x] Atualizar axios de ^1.12.0 para ^1.18.1 (múltiplas vulnerabilidades críticas: prototype pollution, header injection, ReDoS, credential leak)
- [x] Atualizar drizzle-orm de ^0.44.5 para ^0.45.2 (SQL injection)
- [x] Atualizar drizzle-kit de ^0.31.4 para ^0.31.10 (dependências vulneráveis)
- [x] Atualizar vite de ^7.1.7 para ^7.3.6 (arbitrary file read, server.fs.deny bypass - patch seguro sem breaking changes)
- [x] Atualizar express de ^4.21.2 para ^4.22.2 (path-to-regexp ReDoS - patch seguro)
- [x] Atualizar vitest de ^2.1.4 para ^4.1.10 (critical: arbitrary file read via UI server)
- [x] Configurar Dependabot no .github/dependabot.yml para alertas automáticos futuros
- [x] Habilitar vulnerability alerts e automated security fixes no repositório GitHub (secret scanning requer plano GitHub Advanced Security)

- [x] Implementar visualização em cartões para tabela de semanas no mobile (Gestão Financeira) - eliminar scroll horizontal

- [x] Calendário: destacar em vermelho semanas sem passagens cuja ida ocorre nos próximos 15 dias

- [x] Calendário: exibir número da semana e datas de ida e volta no resumo de semanas sem passagens

- [x] PDF: exibir status de remarcação individual para ida, volta ou somente ida
- [x] PDF: exibir localizador individual de cada trecho do bilhete

- [x] PDF: impedir que a quebra de página corte o conteúdo de um bilhete
- [x] PDF: padronizar nome da companhia em maiúsculas e centralizar vertical e horizontalmente

- [x] Avaliar PRs abertos sem sobreposição e fazer merge apenas dos que não tiverem conflitos (11 PRs integrados com sucesso)

- [x] Classificar PRs abertos por confiabilidade, risco e ausência de conflitos

- [x] Integrar e validar os PRs de segurança #303 e #292 (PRs #290 e #286 retidos por conflitos)

- [x] Integrar isoladamente e validar atualizações de dependências dos PRs #271, #270 e #269 (PR #268 retido por conflito)

- [x] Fechar PRs comprovadamente duplicados ou obsoletos após os merges recentes (8 PRs fechados)

- [x] Configurar CI para validar instalação determinística, TypeScript e Vitest em cada pull request

- [x] Resolver o conflito do PR #290 em branch dedicada de rate limiting (`security/resolve-pr-290-rate-limit`)
- [x] Resolver o conflito do PR #286 em branch dedicada de Content Security Policy (`security/resolve-pr-286-csp`)

- [x] Criar pull requests para as branches dedicadas de rate limiting e Content Security Policy (#313 e #314)

- [x] Validar e integrar sequencialmente os PRs de segurança #313 e #314
- [x] Rebasear e validar o upgrade para pnpm 11 do PR #268 (substituído pelo PR #315; #268 fechado)
- [x] Avaliar isoladamente os PRs de dependências #304 e #309 (225 testes aprovados em ambos)

- [x] Integrar o PR #315 e fechar os PRs substituídos #290 e #286
- [x] Atualizar a página de Novidades com as entregas dos últimos dois meses

- [x] Auditar e fechar PRs de segurança comprovadamente substituídos (#312, #249, #253 e #277 fechados; #276 retido para revisão)

- [x] Publicação da pipeline de CI adiada por decisão do usuário; aguardar autorização futura de workflows

- [x] Mapear e priorizar as demais pendências abertas do projeto

- [x] Executar automaticamente PRs pendentes que possam ser validados por instalação, TypeScript e Vitest (fila de PRs esvaziada)

- [x] Avaliar arquitetura e migração para calendário dinâmico com semanas e passagens isoladas por ano

- [x] Elaborar plano diretor à prova de falhas para calendário anual dinâmico em Home, Calendário e Financeiro

- [x] Criar seletor global de ano e conectá-lo visualmente à Home, ao Calendário e ao Financeiro

- [x] Fase 1: criar fundação anual no banco, migrar 2026 e isolar entidades de planejamento por ano

- [x] Fase 2: gerar semanas idempotentes por ano e carregar a Home pelo ano selecionado

- [x] Conectar consultas, gravações e histórico de Cotações ao ano global selecionado

- [x] Revisar e concluir o isolamento de indicadores, tabelas, gráficos e projeções financeiras por ano selecionado

- [x] Isolar exportação PDF, notificações e logs pelo ano global selecionado

- [x] Publicar o callback anual de notificações e criar o agendamento periódico na plataforma

- [x] Adicionar checkboxes de cancelamento independentes para ida e volta, com persistência anual e indicação visual

- [x] Adicionar filtro de voos cancelados no calendário anual
- [x] Enviar alerta automático aos destinatários quando ida ou volta for cancelada

- [x] Validar o alerta de cancelamento com envio real para um destinatário de teste ativo
- [x] Confirmar a validação de envio exclusivamente pelo Resend, sem consulta a caixas Gmail

- [x] Auditar integralmente a performance de rotas, telas, funções, consultas, banco e tarefas automáticas

- [x] Auditar segurança da informação com SAST, DAST não invasivo, APIs, autenticação, autorização e integrações
- [x] Mapear vulnerabilidades e aderência ao OWASP Top 10 com plano de remediação priorizado

- [x] Elaborar plano integrado para executar otimizações de performance e, em seguida, remediações de segurança

- [x] Atualizar a página de Novidades com as entregas concluídas no mês corrente

- [x] P1: carregar a exportação PDF somente sob demanda na Home

- [x] P2: carregar gráficos e Recharts somente sob demanda

- [x] P3: aplicar cache tRPC por domínio e invalidação anual granular

- [x] P4: paginar histórico administrativo por ano e adicionar índices às consultas críticas

- [x] P5: implementar telemetria anônima de Web Vitals e latência tRPC

- [x] S1: corrigir dependências transitivas com vulnerabilidades altas e validar regressões

- [x] Corrigir a telemetria para não enviar mutações antes da sessão interna estar autenticada

- [x] Implementar telemetria de uso com consentimento por sessão, localização aproximada e mapa administrativo protegido
- [x] Publicar e ativar a limpeza periódica de eventos de uso com retenção de 30 dias

- [x] Adicionar menu administrativo exclusivo para acessar o mapa de locais consentidos

- [x] Corrigir o erro React #310 na tela administrativa de mapa de telemetria

- [x] Corrigir o botão Voltar da tela Locais para retornar à Home sem erro React #310

- [x] Corrigir a exibição do mapa interativo do Google Maps na tela de locais

- [x] Permitir múltiplos voos adicionais de ida e volta por semana, com todos os dados e estados atuais

- [x] Criar a área Memórias com quilômetros dinâmicos, mapa de rotas e mídias por passagem emitida

## Segurança e performance — ciclo de endurecimento

- [x] Restringir a CSP de produção, removendo permissões amplas e permitindo apenas origens necessárias
- [x] Criar autorização administrativa persistente para todos os procedimentos de administração
- [x] Escapar e validar campos de voo interpolados em e-mails HTML
- [x] Proteger a cota da RapidAPI com reserva atômica, limite específico, timeout e resposta limitada
- [x] Carregar gráficos secundários do Financeiro somente quando a respectiva seção for aberta

## Reavaliação integral — versão mais recente

- [x] Auditar o código completo, incluindo mapa OpenStreetMap, segurança, desempenho, rotas e tarefas automáticas
- [x] Permitir os tiles do OpenStreetMap na CSP de produção sem reabrir origens amplas

- [x] Corrigir bloqueio de abertura da página administrativa

## Padronização visual

- [x] Substituir em toda a interface o rótulo visual “GRU → NVT • 2026” por “Viagens”
- [x] Atualizar o nome e o ícone do atalho PWA para a marca Viagens

## Conteúdo editorial

- [x] Atualizar a página Novidades com os últimos lançamentos, novidades e implementações

## Viagens adicionais

- [x] Corrigir o botão Cancelar na adição de viagens adicionais
- [x] Replicar integralmente os campos, combos, dados, posições e layout do cartão semanal no formulário de viagens adicionais
- [x] Incluir preço pago em viagens adicionais e somá-lo ao Financeiro anual com centavos

## Bilhetes semanais

- [x] Incluir campos de Terminal na Ida, Volta e Somente Ida de todas as semanas

## Responsividade mobile

- [x] Reavaliar e corrigir a responsividade de todos os elementos da Home para telas de celular
- [x] Reavaliar e corrigir a responsividade de todos os elementos da página Calendário para telas de celular
- [x] Reavaliar e corrigir a responsividade de todos os elementos da página Cotações para telas de celular
- [x] Reavaliar e corrigir a responsividade de todos os elementos da página Memórias para telas de celular
- [x] Reavaliar e corrigir a responsividade de todos os elementos da página Financeiro para telas de celular
- [x] Reavaliar e corrigir a responsividade de todas as telas administrativas para telas de celular

## Experiência administrativa

- [x] Adicionar animações de carregamento e mensagens de feedback visual ao salvar formulários administrativos
- [x] Registrar e exibir a data e hora da última ação em cada formulário administrativo de Notificações
- [x] Adicionar botões acessíveis para limpar o histórico local de ações administrativas
- [x] Criar uma linha do tempo centralizada para exibir ações administrativas recentes

## Experiência de planejamento

- [x] Criar uma Central de atenção inteligente na Home com prazos de compra, cancelamentos e variações de preço
- [x] Permitir dispensar temporariamente e reativar alertas da Central de atenção
- [x] Adicionar resumo visual de progresso anual com semanas emitidas e pendentes
- [x] Permitir configurar e acompanhar uma meta anual de emissões
- [x] Transformar Central de atenção e Progresso anual em sanfonas com estado persistido individualmente
- [x] Permitir escolher o prazo de adiamento dos alertas da Central de atenção
- [x] Adicionar comparativo de emissões e pendências entre anos no progresso anual

## Experiência de Memórias

- [x] Criar um fundo dinâmico em carrossel com fotos reais em alta resolução das cidades das viagens
- [x] Suavizar o fade e tornar os controles de pausa do carrossel mais evidentes
- [x] Corrigir “Diário de borda” para “Diário de Bordo” na página Memórias
- [x] Corrigir o carregamento das imagens do carrossel de cidades em Memórias
- [x] Adicionar fotos reais de Guarulhos, Piracicaba e Novo Hamburgo ao carrossel de Memórias
- [x] Permitir escolher e persistir uma foto favorita no carrossel de Memórias
- [x] Corrigir a sobreposição entre gestão de fotos de fundo e Rota do ano
- [x] Adicionar animação de entrada e hover interativo ao cartão Rota do ano
- [x] Adicionar brilho interativo, expansão com detalhes e quilometragem anual ao cartão Rota do ano
- [x] Reposicionar e tornar recolhível o painel de seleção de fotos para não cobrir o acesso Fly.IA
- [x] Aplicar skeletons responsivos e acessíveis a Memórias e Rota do ano
- [x] Adicionar fade-in entre skeletons e conteúdo real de Memórias
- [x] Padronizar fade-in entre skeletons e conteúdo real em todas as telas com carregamento
- [x] Substituir os spinners de Calendário e Cotações por skeletons completos e responsivos
- [x] Ordenar a Central de atenção por escore combinado de urgência
- [x] Adicionar visão mensal de orçamento, realizado e projetado no Financeiro
- [x] Permitir copiar o orçamento de um exercício para o próximo com ajuste percentual
- [x] Destacar envelopes financeiros que atingem 90% ou ultrapassam o limite
- [x] Adicionar filtros de período e tipo de evento na página Locais
- [x] Animar suavemente a expansão e o recolhimento dos meses em Gestão de Passagens
- [x] Animar a entrada escalonada dos cards semanais ao abrir um mês
- [x] Calcular os cards de semana anterior, atual e próxima pela data real de acesso
- [x] Verificar a persistência do Terminal ao salvar bilhetes de ida, volta e somente ida
- [x] Exibir o Terminal salvo na Gestão de Passagens e no detalhe de bilhetes do Calendário
- [x] Corrigir a hidratação dos campos de Terminal após salvar na Gestão de Passagens
- [x] Adicionar hover suave e tooltip explicativo ao logo Smart Fly
- [x] Exibir confirmação visual acessível ao salvar dados de bilhete por semana
- [x] Corrigir marcação indevida no Calendário para o bilhete somente ida da Semana 42
- [x] Eliminar marcação residual de passagem emitida em 13/12/2026 no Calendário
- [x] Exibir a data efetiva do bilhete no popup, compartilhamento e agenda do Calendário
- [x] Atualizar o resumo de semanas sem passagens pelas datas efetivas emitidas
- [x] Exibir nomes de companhias aéreas em caixa alta em toda a interface
- [x] Adicionar logos pequenos e acessíveis aos badges de companhia dos bilhetes
- [x] Recalcular o percentual do Progresso anual pela meta de viagens selecionada
- [x] Atualizar a página de Novidades com entregas das últimas duas semanas
- [x] Exibir a meta anual configurada no Comparativo entre anos
- [x] Permitir metas de emissão independentes para cada ano no comparativo
- [x] Exibir percentual de conclusão para todos os anos comparados
- [x] Adicionar visualização de tendência de emissões versus metas anuais
- [x] Adicionar transição suave e acessível ao navegar pelo botão de Calendário
- [x] Aplicar a transição suave e acessível aos botões Gestão e Financeiro do cabeçalho
- [x] Aplicar a transição suave e acessível às rotas Cotações e Memórias no cabeçalho
- [x] Restaurar a posição de rolagem ao retornar entre páginas
- [x] Aplicar a transição suave às rotas Novidades e administrativas no cabeçalho
- [x] Restaurar o foco no controle que iniciou uma navegação de retorno
- [x] Adicionar atalho acessível para voltar ao topo das páginas longas
- [x] Aprimorar animações de carregamento e feedback visual nas interações do painel administrativo de notificações
- [x] Adicionar filtro por status ao histórico de envios administrativos
- [x] Exibir resumo diário de entregas e falhas no histórico de notificações
- [x] Permitir exportar o histórico administrativo filtrado em CSV
- [x] Adicionar pesquisa por texto livre ao histórico de envios administrativos
- [x] Criar painel de pendências de compra e risco de preço por semana
- [x] Criar linha do tempo operacional e checklist pré-viagem por viagem
- [x] Implementar gestão de créditos, vouchers e reembolsos por companhia
- [x] Vincular anexos operacionais aos bilhetes emitidos com armazenamento seguro
- [x] Detectar conflitos de voo e trechos de retorno ausentes
- [x] Adicionar metas por categoria de viagens, orçamento, milhas e créditos
- [x] Criar Centro de decisões com recomendações prioritárias e explicáveis
- [x] Criar relatório executivo com geração manual de PDF/CSV e opção de agendamento seguro
- [x] Corrigir a atualização do ícone do site, favicon e cache do PWA
- [x] Adicionar tela de abertura personalizada e acessível ao carregamento inicial do PWA
- [x] Adaptar a tela de abertura do PWA ao modo escuro do sistema
- [x] Refinar o fade out entre a splash screen e a tela principal do PWA
- [x] Adicionar skeletons responsivos e acessíveis à Home após a splash screen
- [x] Preparar proposta visual de cartão Apple Wallet e código de referência do botão de adição
- [x] Remover a tag textual de remarcação sobre os dias do Calendário no celular
- [x] Padronizar a legenda de status em todos os filtros do Calendário
- [x] Adicionar modo de alto contraste ao Calendário
- [x] Permitir recolher filtros secundários do Calendário no celular
- [x] Adicionar busca por número ou destino de voo no Calendário
- [x] Atualizar a habilidade reutilizável com o processo de evolução segura aplicado ao Smart Fly
- [x] Adicionar ícones visuais e previsão dos próximos dias nos dados meteorológicos do Fly.IA
- [x] Adicionar autocompletar de destinos na busca do Calendário
- [x] Adicionar alerta de chuva na Central de Decisão pela previsão dos próximos dias
- [x] Alertar sobre vento forte e baixa visibilidade na Central de Decisão
- [x] Exibir a previsão de retorno junto ao alerta meteorológico da próxima viagem
- [x] Permitir dispensar alertas meteorológicos por viagem com preferência persistente
- [x] Corrigir a visibilidade de Painel de avisos, Locais de Acesso e Uso de IA no menu mobile
- [x] Corrigir a origem de tiles que exige API key na tela Locais

## Processo reutilizável

- [x] Criar habilidade reutilizável para evolução visual e UX segura de aplicações web

## Acesso e autenticação

- [x] Padronizar os avisos de usuário não autenticado em uma message box centralizada e acessível
- [x] Aplicar a message box centralizada ao compartilhamento de passagens por e-mail
- [x] Adicionar animação sutil e respeitosa à message box de acesso
- [x] Registrar tentativas de acesso a recursos protegidos sem coletar dados pessoais
- [x] Proteger a página Financeiro com a message box centralizada e login interno

## Preferências da Home

- [x] Persistir os estados aberto e fechado do Resumo Anual e de Filtros e Controles
- [x] Simplificar o botão da Central de decisão para exibir somente o ícone de expandir ou recolher
- [x] Alinhar a Central de decisão ao padrão do Resumo Anual, com controle sem borda e hover com fade suave
- [x] Equalizar o design da Central de Atenção com a Central de Decisão
- [x] Padronizar a seção Variação de Preços com o acabamento das Centrais
- [x] Reforçar o contraste dos alertas e controles em modo escuro
- [x] Consolidar checkpoint revisado e pronto para publicação
- [x] Aprimorar a leitura da Variação de Preços com metadados derivados dos dados reais
- [x] Padronizar os cards de semanas da Home com o acabamento das Centrais
- [x] Preparar e validar visualmente os alertas para uso móvel, com roteiro de teste em dispositivo físico

## Auditoria de pull requests

- [x] Avaliar todos os PRs abertos quanto a risco, conflitos, validações, sobreposição e recomendação de tratamento

## Operação de merges

- [x] Mesclar PRs abertos elegíveis, individualmente, sem conflitos e sem duplicidades
