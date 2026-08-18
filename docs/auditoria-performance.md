# Auditoria integral de performance — Smart Fly

**Data da auditoria:** 18 de agosto de 2026  
**Escopo:** rotas publicadas, telas registradas, fluxo cliente–API, bundles, banco de dados, cache, exportação de PDF, consultas, notificações e tarefa automática.

## Resumo executivo

A aplicação está **funcional e saudável para o volume atual de dados**, com build concluído em 11,93 segundos, tipagem sem erros e uma tarefa horária de notificações estável. O principal risco não é o banco de dados atual: são o **peso transferido no primeiro acesso**, a ausência de uma política explícita de cache de consultas e alguns caminhos que crescerão linearmente com histórico, especialmente notificações administrativas e cotações.

O maior ganho prático vem de adiar o carregamento de PDF e gráficos na página inicial. Os dois fornecedores juntos representam aproximadamente **290 KB gzip** que podem ser transferidos somente quando o usuário pedir exportação ou abrir o gráfico. A resposta HTML publicada também é excepcionalmente grande — 374.940 bytes e sem compressão observada no cabeçalho — devendo ser tratada como prioridade de infraestrutura. [1](#evidências-coletadas)

> **Conclusão:** não há evidência de um gargalo crítico de banco no volume presente. A prioridade deve ser reduzir o custo inicial de JavaScript/HTML, limitar consultas administrativas que crescem com o tempo e instrumentar métricas reais de usuário antes de qualquer otimização estrutural mais invasiva.

## Cobertura da auditoria

Foram inventariadas **todas as rotas registradas no roteador**, todas as páginas ativas e os módulos de negócio que elas consomem. A página `ComponentShowcase.tsx` existe no código, mas não está registrada como rota; foi classificada como superfície não publicada. A inspeção de funções cobriu os caminhos de consulta, geração de dados, PDF, cotações, finanças, notificações e trabalho agendado. Componentes genéricos de interface foram cobertos indiretamente por análise de bundle e importações, pois não constituem fluxos de negócio autônomos.

| Superfície | Cobertura | Situação de performance | Prioridade |
| --- | --- | --- | --- |
| `/` — Home | Renderização, filtros, gráfico, PDF, semanas, preços e push | Alto custo inicial por importar gráficos e PDF; lista atual é administrável | Alta |
| `/calendar` — Calendário | Grade anual, filtros, popup e resumo | Grade fixa de 12 meses; custo previsível e atualmente aceitável | Média |
| `/cotacoes` — Cotações | Semanas, API externa, formulário manual e histórico | Processamento externo é o limitador; 52 cards ainda são aceitáveis | Média |
| `/financeiro` — Financeiro | KPIs, tabelas, projeções e gráficos | Rota já é lazy; múltiplos gráficos podem pesar em dispositivos modestos | Média |
| `/admin/notifications` — Administração | Status, logs, destinatários e polling | Logs e chamadas simultâneas exigem paginação/carga sob demanda ao crescer | Alta |
| `/novidades` — Changelog | Dados estáticos e timeline | Volume atual baixo; não justifica otimização urgente | Baixa |
| `/404` — Não encontrada | Página estática | Sem risco material | Baixa |
| API, banco e heartbeat | Routers, helpers, planos SQL e tarefa horária | Índices futuros e observabilidade são os pontos principais | Alta |

## Medições objetivas

O build de produção transformou 2.955 módulos em 11,93 segundos e gerou 3,7 MB de artefatos. O JavaScript principal tem 1.068.745 bytes, ou 279.209 bytes gzip. Os fornecedores de PDF e gráficos têm respectivamente 170.924 e 119.214 bytes gzip. O build emite aviso por chunk acima de 1 MB, o que confirma que o custo inicial merece atenção. [1](#evidências-coletadas)

| Artefato | Tamanho bruto | Tamanho gzip | Leitura |
| --- | ---: | ---: | --- |
| JavaScript principal | 1.068.745 B | 279.209 B | Acima do desejável para a rota inicial de um planejador pessoal |
| PDF (`jspdf` + `html2canvas`) | 588.394 B | 170.924 B | Pode ser carregado somente ao exportar |
| Gráficos (`recharts`) | 445.038 B | 119.214 B | Pode ser carregado somente ao abrir gráficos |
| CSS | 190.383 B | 27.645 B | Aceitável, mas deve ser acompanhado |
| HTML inicial publicado | 374.940 B | 106.502 B localmente | Alto; o cabeçalho publicado não expôs compressão |

As seis rotas verificadas no domínio publicado responderam com HTTP 200. Em uma amostra única, o TTFB variou de 1,94 s a 3,44 s e o tempo total de 2,59 s a 4,75 s. A rota inicial foi carregada pelo navegador, passou pelo estado de skeleton e estabilizou com os dados de 2026. Esses números são uma linha de base de ambiente, não um teste de carga ou percentil de produção. [1](#evidências-coletadas)

## Achados por camada

### 1. Carregamento inicial e bundles

**Achado P0 — PDF e gráficos entram na Home por imports estáticos.** A Home importa `recharts`, `FlightPdfExport`, `jspdf` e `html2canvas` pelo caminho do bundle inicial. Embora outras rotas sejam carregadas com `React.lazy`, a Home continua a disponibilizar imediatamente funcionalidades que só são usadas sob demanda. O ganho recomendado é separar `PriceChart` e o gerador de PDF em módulos realmente dinâmicos, acionados quando o usuário abre o gráfico ou confirma a exportação. Isto evita transferir cerca de 290 KB gzip para sessões que não usam essas funções. [1](#evidências-coletadas)

**Achado P0 — documento HTML inicial muito grande e sem compressão observada.** O HTML-fonte do projeto tem apenas cerca de 7 KB, porém a saída publicada chegou a 374.940 bytes, com `cache-control: no-cache, no-store, must-revalidate` e sem `content-encoding` observado. A maior parte do crescimento está associada ao runtime inserido no artefato de produção, não ao conteúdo da aplicação. Esta é uma recomendação de infraestrutura: abrir uma verificação com a plataforma para habilitar compressão de texto e confirmar por que o runtime React é inserido no HTML. Não é adequado tentar “minificar” manualmente o código de negócio para resolver essa diferença. [1](#evidências-coletadas)

**Achado P1 — a estratégia de chunks existe, mas não substitui imports dinâmicos.** O `manualChunks` separa dependências em fornecedores, porém uma dependência importada estaticamente pela Home ainda participa do custo da rota inicial. A correção é arquitetural no ponto de uso: remover imports estáticos das funções opcionais e medir novamente, em vez de apenas alterar nomes de chunks.

### 2. Telas, renderização e interação

**Home.** É a maior tela, com 6.206 linhas e fluxo que combina cartões de semanas, controles, busca, exportação, preço, agenda e gráficos. A interface se beneficia de agrupar estados relacionados e de extrair cartões de semana memoizados, mas a virtualização não é uma prioridade imediata: há 44 semanas disponíveis e o conteúdo já é agrupado por mês. O melhor retorno vem do carregamento sob demanda de funcionalidades pesadas e de evitar que atualizações locais de um cartão invalidem árvores fora daquele cartão. [2](#análise-por-tela)

**Calendário.** A grade anual processa aproximadamente 365 células e 12 meses; isto é custo fixo e modesto para o escopo atual. A página já contém `useMemo` para estrutura de meses e finais de semana prolongados. Recomenda-se memoizar células/marcas somente se o profiling mostrar atraso ao alternar filtros; introduzir virtualização agora acrescentaria complexidade sem ganho proporcional. [2](#análise-por-tela)

**Financeiro.** A rota já é carregada de forma lazy e os conjuntos anuais são pequenos — meses, 52 semanas e poucos indicadores. O risco real aparece em dispositivos de menor CPU ao desenhar todos os gráficos Recharts ao mesmo tempo. A recomendação é renderizar gráficos secundários apenas quando a aba/seção estiver aberta e aplicar debounce nos controles que alterem projeções continuamente. [2](#análise-por-tela)

**Cotações.** As 52 semanas e o estado global de carregamento são aceitáveis hoje. O gargalo externo está no loop de consulta da API de voos, que deve continuar com limitação de concorrência e cache por semana/ano. Para evolução, isole o estado de carregamento por cartão e monte diálogos/tooltips somente quando abertos. [2](#análise-por-tela)

**Administração de notificações.** Esta é a tela com maior risco de degradação progressiva. Ela consulta status e logs, atualizando por polling de 60 segundos quando habilitado. Os logs têm limite de 100, o que contém o payload atual, mas faltam paginação explícita, busca por período e carregamento somente ao expandir o acordeão. Estas medidas evitam que o painel se torne caro à medida que o histórico cresce. [2](#análise-por-tela)

**Novidades e páginas estáticas.** O changelog tem conteúdo estático e não demanda intervenção de performance no volume atual. A rota de página não encontrada é trivial. `ComponentShowcase` não é acessível por rota e não afeta usuários finais. [2](#análise-por-tela)

### 3. Consultas, cache e rede

**Achado P1 — ausência de política global de `staleTime`.** O cliente React Query define tentativas de retry, mas não define `staleTime` ou `gcTime`. Portanto, as consultas seguem o padrão de serem consideradas obsoletas imediatamente. Para dados anuais de semanas, preços e calendário, uma política de 30–120 segundos com invalidação explícita após mutações reduz refetches ao navegar e retornar para a mesma tela. Dados de status de notificação podem manter o polling atual, mas devem permanecer específicos daquela rota. [3](#evidências-de-código)

**Achado P1 — o payload da Home merece observabilidade.** Registros recentes indicaram uma resposta de semanas na ordem de centenas de milissegundos em desenvolvimento. Como a Home recebe todas as semanas do ano e vários campos por semana, a otimização adequada é medir tamanho e duração por procedimento tRPC antes de remover campos. A projeção atual é manter a consulta anual única — somente 52 semanas — e definir payloads enxutos para listagem quando o histórico crescer.

**Achado P2 — latência de entrada precisa de amostragem real.** Os tempos HTTP observados são compatíveis com inicialização e variabilidade de ambiente autoscale, mas uma única requisição por rota não permite distinguir cold start, rede e servidor. A próxima ação deve ser telemetria de Web Vitals e tempos p50/p95 de tRPC, não uma mudança prematura de hospedagem. [1](#evidências-coletadas)

### 4. Banco de dados, APIs e tarefas automáticas

O banco está pequeno: 96 semanas, 32 preços, 2 cotações e 76 logs. Assim, os `TableFullScan` observados em preços, cotações e logs não são um gargalo presente. Eles são, porém, um sinal de preparação para escala. [1](#evidências-coletadas)

| Consulta | Plano atual | Risco de crescimento | Recomendação |
| --- | --- | --- | --- |
| Semanas por ano ordenadas | Usa `uq_flight_weeks_year_week` | Baixo: máximo aproximado de 52/ano | Manter; índice atual é adequado |
| Preços por ano | `TableFullScan` | Médio com histórico de anos e companhias | Confirmar uso de `idx_flight_prices_year`; rodar `ANALYZE` após aumento material |
| Cotações por ano ordenadas por data | `TableFullScan` + `Sort` | Alto se o histórico de cotações crescer | Adicionar índice composto `(year, createdAt)` |
| Logs por ano ordenados por envio | `TableFullScan` + `TopN` | Alto com execução horária contínua | Adicionar índice composto `(year, sentAt)` e paginação por cursor |

**Tarefa automática.** O heartbeat de notificações teve quatro execuções recentes bem-sucedidas entre 1.450 ms e 1.920 ms, com uma falha 403 histórica anterior à correção do callback. O comportamento atual é saudável. Quando a quantidade de assinaturas push e destinatários aumentar, o próximo passo é separar geração de candidatos, reserva idempotente e envio em lote, preservando a execução horária curta. [1](#evidências-coletadas)

**APIs externas e e-mail.** A busca de cotações envolve espera e iteração por resultados externos; essa latência deve ficar fora de interações críticas da Home e ser apresentada com progresso por semana. Já o envio de e-mail dentro de uma mutação de cancelamento é correto para o volume atual de três destinatários, mas pode atrasar a confirmação de salvamento quando a lista crescer. Uma fila/outbox assíncrona é uma evolução P2, não uma necessidade imediata.

## Plano de ação priorizado

| Prioridade | Ação | Benefício esperado | Esforço | Critério de aceite |
| --- | --- | --- | --- | --- |
| P0 | Carregar PDF somente ao clicar em exportar | Evita ~171 KB gzip inicial | Médio | PDF funciona; chunk não é solicitado no primeiro acesso |
| P0 | Carregar gráficos da Home somente ao abrir o gráfico | Evita ~119 KB gzip inicial | Médio | Gráfico continua correto; chunk só aparece sob demanda |
| P0 | Investigar compressão e runtime no HTML publicado | Reduz transferência/cold load do documento de 375 KB | Médio, plataforma | `content-encoding` ativo e HTML substancialmente menor em resposta HTTP |
| P1 | Definir `staleTime` por domínio e invalidar após mutações | Menos refetches e renderizações ao navegar | Baixo | Navegação repetida não reconsulta sem necessidade; mutação atualiza dados |
| P1 | Paginar logs administrativos e carregar acordeões sob demanda | Protege o painel contra crescimento de histórico | Médio | Primeira carga não busca/renderiza histórico completo |
| P1 | Criar índices `(year, createdAt)` e `(year, sentAt)` | Elimina scans/sorts futuros em histórico anual | Baixo | `EXPLAIN` usa índice composto após migração |
| P2 | Extrair cartões da Home e isolar estados locais | Menos re-renderizações durante edição | Médio | Profiling confirma redução de commits fora do cartão editado |
| P2 | Adiar gráficos secundários no Financeiro | Melhor interação em dispositivos modestos | Baixo | Seções fechadas não montam gráficos |
| P2 | Instrumentar Web Vitals, duração tRPC e slow queries | Decisões posteriores baseadas em p50/p95 reais | Médio | Dashboard com LCP, INP, TTFB e duração por procedimento |
| P3 | Avaliar fila/outbox para e-mails e push em lote | Mantém mutações rápidas ao escalar | Médio | Atualização de bilhete não aguarda envio para múltiplos destinatários |

## Recomendações que **não** devem ser antecipadas

Virtualizar o calendário, as 52 semanas da Home ou as 52 cotações parece sofisticado, mas não é indicado pelo volume atual. Da mesma forma, não há evidência para reescrever o router, trocar a biblioteca de gráficos ou migrar de hospedagem antes de obter métricas de usuários reais. Essas alterações trariam risco de regressão superior ao ganho provável.

## Estratégia de validação após otimizações

Após executar as ações P0, repita o build e registre tamanho gzip dos chunks. Valide no DevTools que PDF e Recharts não são requisitados no primeiro carregamento da Home. Meça cinco acessos quentes e cinco acessos após inatividade para cada rota, registrando TTFB e total. Para banco, rode `EXPLAIN` das cotações e logs depois da migração de índices. Por fim, estabeleça orçamento de performance em CI: HTML comprimido, JavaScript inicial gzip, número de requisições iniciais e ausência de chunks opcionais na Home.

## Evidências coletadas

As medições de build, tamanho, cabeçalhos HTTP, amostra de rotas, volumes de banco, planos SQL e execução do heartbeat estão registradas no documento de evidências da auditoria: [1](./auditoria-performance-evidencias.md).

## Análise por tela

As observações estáticas por tela foram incorporadas às seções de cobertura e de renderização deste relatório. A análise examinou Home, Calendário, Financeiro, Cotações, Administração de Notificações, Novidades e as páginas estáticas registradas.

## Evidências de código

O cache global foi revisado em [`client/src/main.tsx`](../client/src/main.tsx), a divisão de bundles em [`vite.config.ts`](../vite.config.ts), o carregamento de rotas em [`client/src/App.tsx`](../client/src/App.tsx) e os imports críticos da Home em [`client/src/pages/Home.tsx`](../client/src/pages/Home.tsx). [3](#evidências-de-código)
