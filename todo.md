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
