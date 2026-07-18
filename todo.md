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
