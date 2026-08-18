# Evidências coletadas — auditoria de performance

| Fonte | Medição ou observação |
| --- | --- |
| Build local de produção | 2.955 módulos transformados; 11,93 s; diretório `dist` de 3,7 MB. |
| Artefatos principais | `index` JavaScript: 1.068.745 bytes (279.209 bytes gzip); PDF: 588.394 bytes (170.924 bytes gzip); gráficos: 445.038 bytes (119.214 bytes gzip). |
| Página publicada | Documento inicial de 374.940 bytes, `cache-control: no-cache, no-store, must-revalidate`, sem `content-encoding` observado no cabeçalho. |
| Rotas publicadas | Amostras únicas: TTFB entre 1,94 s e 3,44 s; tempo total entre 2,59 s e 4,75 s. As amostras não substituem medição de carga. |
| Navegação publicada | A rota inicial renderizou a interface e iniciou a busca de dados, exibindo skeletons durante o carregamento; em seguida estabilizou com 44 semanas disponíveis e uma semana expandida, confirmando que os assets de produção foram carregados pelo navegador. |
| Banco atual | 96 semanas, 32 preços, 2 cotações, 76 logs de notificação, 2 assinaturas push e 3 destinatários de e-mail. |
| Tarefa automática | Quatro execuções recentes bem-sucedidas entre 1.450 ms e 1.920 ms; uma falha histórica 403 anterior à correção do callback. |

## Planos de consulta

Os planos `EXPLAIN` mostram busca ordenada pelo índice anual de semanas. Em contraste, os planos de `flight_prices`, `flight_quotes` e `notification_logs` exibiram `TableFullScan` nos volumes atuais. Isto é pouco relevante no tamanho presente, mas define uma oportunidade de índices compostos antes de escalar o histórico anual.

## Execução P1 — PDF sob demanda

Após a separação do acionador leve na Home, o build de produção passou a manter todo o gerador de PDF em um chunk dinâmico de **927.354 bytes brutos** e **273.199 bytes gzip**. O documento inicial não contém referências a `FlightPdfExport`, `jspdf` ou `html2canvas`; o chunk só é solicitado pelo import dinâmico após o clique de exportação. O chunk inicial JavaScript ficou em **179.583 bytes gzip** nesta medição.

## Execução P2 — Gráficos sob demanda

Os gráficos da Home agora são renderizados somente depois de uma solicitação explícita do usuário. O build separou o painel leve `HomeCharts` (**9.488 bytes brutos; 1.961 bytes gzip**) e a biblioteca de gráficos (**408.539 bytes brutos; 112.865 bytes gzip**) em chunks dinâmicos. O HTML inicial não contém referências a Recharts ou aos chunks de gráficos; o JavaScript inicial ficou em **178.638 bytes gzip** nesta medição.

## Execução P3 — Cache tRPC e invalidação anual

Foi definida uma política de cache por domínio: planejamento e finanças anuais permanecem recentes por dois minutos, cotações por um minuto, consumo de API e administração por trinta segundos, e a chave pública VAPID é tratada como estática. O refetch em foco foi desabilitado para essas leituras. Mutações de semana, preço e milhas invalidam apenas o exercício correspondente e seus resumos financeiros; mutações de cotações invalidam somente as cotações e o consumo de API do mesmo ano.
