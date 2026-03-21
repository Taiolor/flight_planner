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
