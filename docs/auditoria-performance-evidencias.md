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
