# Reavaliação integral do Smart Fly — 18 de agosto de 2026

## Escopo e validações

Esta revisão considerou a versão sincronizada mais recente, inclusive a troca recente do mapa administrativo de Google Maps para **Leaflet/OpenStreetMap**, o gerenciamento de voos adicionais, o fluxo multi-ano, rotas tRPC, autenticação interna, armazenamento de mídias e callbacks agendados.

| Verificação | Resultado |
| --- | --- |
| Testes automatizados | 52 arquivos e 306 cenários aprovados |
| Tipagem TypeScript | Sem erros |
| Build de produção | Concluído; 3.011 módulos transformados |
| Dependências de produção | Sem vulnerabilidades conhecidas pelo `pnpm audit --prod` |
| CSP e mapa OpenStreetMap | Corrigida a allowlist de imagens para tiles `*.tile.openstreetmap.org` |

> A revisão não encontrou bloqueador de build nem vulnerabilidade conhecida nas dependências de produção. A versão pode seguir para validação funcional, observadas as prioridades abaixo.

## Correção aplicada durante a revisão

A tela **Locais** carrega tiles públicos de `https://{s}.tile.openstreetmap.org`. A CSP recém-endurecida bloqueava essa origem, fazendo o mapa aparecer vazio em produção. A diretiva `img-src` passou a permitir exclusivamente `https://*.tile.openstreetmap.org`, sem reintroduzir o curinga `https:`.

## Achados priorizados

| Prioridade | Achado | Evidência | Recomendação |
| --- | --- | --- | --- |
| Alta | Validação de upload baseada no `Content-Type` informado pelo cliente | `server/_core/index.ts` aceita qualquer `image/*` ou `video/*` no endpoint de mídia | Aplicar allowlist de MIME, validação por assinatura binária, limites por tipo e remoção de arquivos inválidos. |
| Média | Proxy legado de Google Maps permanece exposto, embora a tela Locais use OpenStreetMap | `server/_core/index.ts` mantém `/api/maps/proxy`; `UsageTelemetryMap.tsx` não consome mais `MapView` | Após confirmar que nenhuma rota usa o mapa legado, remover proxy, componente e dependências associados. |
| Média | Limite específico de cotações é local à instância | O limitador de RapidAPI é mantido em memória no router | Para proteger a franquia sob autoscaling, mover o limite de frequência para mecanismo persistido/compartilhado e incluir teste concorrente no banco. |
| Média | Consulta anual de semanas ainda é pública, embora redigida | `flights.getWeeks` é `publicProcedure` | Decidir se o cronograma deve ser privado. Caso positivo, tornar a leitura protegida; caso público, reduzir os campos ao mínimo necessário. |
| Média | HTML inicial de produção continua grande | Build atual gera `index.html` com aproximadamente 375 KB | Investigar compressão e runtime inserido na camada de hospedagem antes de otimizações estruturais. |
| Baixa | CSP ainda aceita `style-src-attr 'unsafe-inline'` para React/Leaflet | `server/_core/contentSecurityPolicy.ts` | Migrar estilos calculados para classes e remover essa exceção após profiling. Scripts inline e `eval` já permanecem bloqueados. |
| Baixa | Gráficos secundários do Financeiro continuam no chunk da rota | `FinancialDashboard.tsx` importa Recharts estaticamente | Extrair blocos de gráficos para componentes carregados por seção com limites de Suspense tipados. |

## Controles confirmados

| Domínio | Situação confirmada |
| --- | --- |
| Sessão interna | Procedimentos protegidos exigem o cookie interno; procedimentos administrativos usam capacidade administrativa. |
| Dados por exercício | Semanas, cotações, finanças, memórias e voos adicionais validam o ano de planejamento. |
| Navegação de Locais | O retorno usa navegação programática para `/`, sem remeter a `/admin/notifications`. |
| Mapa novo | Marcadores, cores por tipo, enquadramento automático e atribuição do OpenStreetMap possuem cobertura automatizada. |
| Tarefas automáticas | Callbacks estão sob `/api/scheduled/*`, validam identidade cron e precedem o fallback estático. |
| Dependências | A auditoria de produção não reportou vulnerabilidades conhecidas. |

## Sequência recomendada

A próxima execução deve priorizar a validação binária de uploads e a remoção do proxy de Google Maps legado. Em seguida, recomenda-se decidir a política de privacidade das semanas públicas e tornar o limitador de cotações compartilhado entre instâncias. Por fim, a investigação da compressão do HTML publicado e o carregamento sob demanda dos gráficos financeiros podem reduzir o custo de carregamento sem alterar regras de negócio.
