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

- [ ] Exportar para PDF
- [x] Adicionar campo "Número do Voo" (departureFlightNumber / returnFlightNumber) nos cards de Ida e Volta
- [ ] Publicar o site
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
- [ ] Instalar web-push, criar schema de push_subscriptions e gerar chaves VAPID
- [ ] Criar endpoints tRPC para salvar/remover subscriptions push
- [ ] Implementar job agendado no servidor para enviar notificação 24h antes do voo
- [ ] Atualizar Service Worker para receber e exibir notificações push
- [ ] Adicionar botão "Ativar Notificações" na UI com feedback de status

## Push Notifications (nova sessão)

- [ ] Instalar web-push e gerar chaves VAPID
- [ ] Criar schema push_subscriptions no banco de dados
- [ ] Criar endpoints tRPC para salvar/remover subscriptions push
- [ ] Implementar job agendado no servidor para enviar notificação 24h antes do voo
- [ ] Atualizar Service Worker para receber e exibir notificações push
- [ ] Adicionar botão "Ativar Notificações" na UI com feedback de status

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
- [ ] Bug: caractere '0' aparecendo visualmente quando o bilhete não está marcado como emitido
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
- [ ] Bug: erro ao gerar PDF (botão PDF no cabeçalho não funciona)
- [x] Substituir botão lápis + popup de edição de datas por date pickers inline no card (data ida + data volta com label do dia da semana ao lado)
- [ ] Ao clicar em "Não Emitido" para expandir o card, copiar automaticamente as datas dos date-pickers (Ida e Retorno) para os campos de data/hora do bilhete (datetime-local Ida e Volta)
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
- [ ] Sincronizar main local com GitHub (PRs #19, #21, #22, #23, #26, #28)
- [ ] Merge PR #14 (ARIA accordion toggle)
- [ ] Merge PR #18 (single-pass loops chartData)
- [ ] Aplicar PR #25 manualmente (SHA-256 timing fix) e fechar #15
- [ ] Aplicar PR #20 manualmente (sameSite lax CSRF fix) e fechar #27
- [ ] Fechar PRs redundantes #16 e #24
