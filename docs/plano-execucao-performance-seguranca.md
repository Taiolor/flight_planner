# Plano integrado de execução — performance seguida de segurança

**Ordem deliberada:** primeiro reduzir custo de carregamento, consultas e crescimento de histórico; em seguida, aplicar as remediações de segurança e OWASP. Cada marco produz um checkpoint independente e só avança quando os critérios de aceite estiverem comprovados.

## Princípios de execução

O plano preserva o comportamento funcional atual, o isolamento anual e as rotas publicadas. Mudanças de baixo risco e alto retorno precedem refatorações estruturais. Nenhuma alteração de infraestrutura, migração de banco ou atualização de dependência será combinada com mudanças de interface no mesmo checkpoint, permitindo diagnóstico e rollback objetivos.

> A sequência solicitada não diminui a prioridade das três vulnerabilidades altas de dependências. Até a etapa de segurança ser concluída, não haverá novo release público entre os marcos de performance sem uma avaliação de risco específica.

## Marco 0 — Preparação e linha de base

| Atividade | Resultado esperado | Critério de aceite |
| --- | --- | --- |
| Preservar as métricas de referência | Build, gzip, TTFB, rotas, planos SQL e heartbeat registrados | Relatórios de auditoria anexados ao projeto |
| Criar orçamento de performance inicial | Limites mensuráveis para HTML, JS inicial e chunks opcionais | Orçamento documentado antes do primeiro código |
| Preparar testes de regressão | TypeScript, Vitest, rotas críticas e PDF disponíveis | Suíte atual aprovada antes de cada marco |
| Definir checkpoints de rollback | Uma versão por marco | Nenhum marco depende de alterações não salvas |

## Etapa 1 — Execução de performance

### P1 — Carregamento sob demanda de PDF

O componente de exportação e suas dependências `jspdf` e `html2canvas` passarão a ser carregados somente após a intenção explícita de gerar PDF. A Home manterá um botão responsivo com estado de carregamento, mas não importará o gerador no primeiro render.

| Escopo | Implementação | Critério de aceite | Rollback |
| --- | --- | --- | --- |
| `FlightPdfExport`, jsPDF e html2canvas | `import()` dinâmico no fluxo de exportação e fallback de interface | PDF de ida, volta, remarcado e cancelado permanece correto; chunk PDF não é solicitado na carga inicial | Restaurar import estático isoladamente |
| Testes | Manter testes atuais e adicionar teste do estado de carregamento quando aplicável | Vitest e TypeScript aprovados | Reverter somente o marco P1 |

### P2 — Gráficos sob demanda na Home

O gráfico anual será separado do bundle inicial e carregado quando o usuário abrir sua área. Não será alterada a origem das métricas, apenas o momento de importação e montagem.

| Escopo | Implementação | Critério de aceite | Rollback |
| --- | --- | --- | --- |
| Recharts e `PriceChart` | `React.lazy`/`Suspense` ou `import()` condicionado ao painel de gráfico | Nenhum chunk Recharts no primeiro acesso; gráfico preserva valores anuais e acessibilidade | Restaurar carregamento estático do gráfico |
| Estados de interface | Skeleton local durante a primeira abertura | Sem quebra de layout em desktop e celular | Reverter estado local sem tocar nos dados |

### P3 — Política de cache e invalidação tRPC

Sem alterar regras de negócio, será configurado `staleTime` por domínio: semanas, preços, calendário, cotações e finanças terão cache de curta duração; status administrativo conservará polling específico. Toda mutação que altera dados invalidará apenas os procedimentos afetados e o ano correspondente.

| Domínio | Política inicial | Critério de aceite |
| --- | --- | --- |
| Semanas, preços, cotações e finanças anuais | `staleTime` entre 60 e 120 segundos | Retorno à mesma rota não refaz consulta antes do vencimento |
| Painel de notificações | Polling atual, com dados históricos sob demanda | Alertas continuam atualizando sem consultas duplicadas |
| Mutações | Invalidação granular por procedimento e ano | Alteração de preço/bilhete reflete imediatamente no exercício certo |

### P4 — Histórico administrativo e índices anuais

O painel de notificações receberá paginação por cursor, filtro por período e carregamento do histórico somente quando o usuário solicitar. Em sequência separada, o banco receberá índices compostos para cotações e logs anuais, sem alterações destrutivas.

| Escopo | Implementação | Critério de aceite |
| --- | --- | --- |
| Logs administrativos | Cursor, limite e período no contrato/API/interface | A carga inicial não retorna histórico completo; navegação de páginas preserva o ano |
| Cotações e logs | Índices `(year, createdAt)` e `(year, sentAt)` após revisar schema real | `EXPLAIN` elimina `TableFullScan`/`Sort` do caminho histórico esperado |
| Migração | Uma única migração aditiva e verificável | Sem perda de dados e rollback por checkpoint disponível |

### P5 — Renderização progressiva e telemetria

Esta etapa só começa após a medição posterior a P1–P4. Ela adia gráficos secundários do Financeiro, reduz re-renderizações locais na Home apenas se profiling confirmar necessidade e introduz Web Vitals, duração de procedimentos tRPC e observabilidade de consultas lentas.

| Medida | Critério de aceite |
| --- | --- |
| Web Vitals | LCP, INP e TTFB disponíveis por rota no ambiente publicado |
| tRPC | Duração e erro por procedimento sem registrar dados sensíveis |
| Financeiro/Home | Profiling demonstra ganho antes de extrair cartões ou memoizar componentes |

### P6 — Verificação de infraestrutura publicada

O HTML publicado excepcionalmente grande e sem compressão observada é uma dependência de plataforma. Após P1 e P2, será repetida a medição e, caso persista, será aberta uma solicitação de infraestrutura para habilitar/confirmar compressão e investigar a injeção de runtime. Esta etapa não será resolvida por minificação manual da aplicação.

## Gate de transição para segurança

A etapa de segurança inicia apenas quando P1–P4 estiverem validados e o benchmark posterior estiver registrado. P5 e P6 podem prosseguir como melhoria contínua, mas não bloqueiam as correções de segurança prioritárias.

## Etapa 2 — Execução de segurança e OWASP

### S1 — Atualização controlada da cadeia de dependências

As vulnerabilidades altas identificadas na auditoria serão corrigidas antes de qualquer novo release após a etapa de performance. A intervenção será isolada: atualizar ou sobrescrever `path-to-regexp`, `lodash`, `lodash-es`, `dompurify`, Mermaid e dependências de Streamdown; verificar o lockfile; compilar; executar testes; e rodar novamente a auditoria de produção.

| Escopo | Estratégia | Critério de aceite | Risco controlado |
| --- | --- | --- | --- |
| Express e `path-to-regexp` | Atualização compatível ou override testado | Sem vulnerabilidade alta do pacote e rotas HTTP respondem normalmente | Compatibilidade de rotas e rate limit |
| Recharts e Lodash | Atualização transitiva/override e teste de Home/Financeiro | Gráficos carregam e valores permanecem corretos | Regressão visual e de tipagem |
| Streamdown, Mermaid e DOMPurify | Atualizar ou remover cadeia sem uso de produção | `pnpm audit --prod` sem altas e sem vulnerabilidades transitivas remanescentes evitáveis | Renderização de conteúdo formatado/PDF |

### S2 — CSP e configuração do navegador

A CSP será reduzida progressivamente. Primeiro, `frame-ancestors` passará de curinga para `'self'`; depois, `connect-src` será limitado à origem da aplicação e aos domínios comprovadamente necessários. Toda exceção de script, style, imagem ou frame deve ser documentada com sua dependência funcional.

| Controle | Implementação | Critério de aceite |
| --- | --- | --- |
| Clickjacking | `frame-ancestors 'self'` e XFO coerente | Página não incorpora em origem externa não autorizada |
| Conexões | Allowlist em `connect-src` | API, push, mapas e desenvolvimento continuam operando no ambiente correspondente |
| Conteúdo ativo | Revisar `blob:`, `data:` e `unsafe-inline` | Nenhuma exceção é mantida sem justificativa e teste |

### S3 — Autorização administrativa e privacidade de dados

Será criado `flightAdminProcedure` baseado em allowlist de administradores ou papel persistido. Ele protegerá configuração de notificações, destinatários, logs, disparos de teste e operações de administração. Em paralelo, será tomada uma decisão explícita sobre `flights.getWeeks`: manter uma resposta pública mínima ou exigir sessão.

> A política pública de semanas depende de decisão do proprietário: **A)** proteger integralmente a agenda; ou **B)** manter visibilidade pública apenas para campos explicitamente não sensíveis. O plano técnico pode implementar qualquer opção, mas não deve decidir sozinho a política de privacidade.

| Caso | Critério de aceite |
| --- | --- |
| Sessão comum sem papel administrativo | Procedimentos administrativos retornam `FORBIDDEN` |
| Sessão administrativa | Painel permanece funcional |
| Visitante não autenticado | Campos definidos como privados não são retornados por qualquer procedimento público |

### S4 — Encoding de e-mail, contratos e tratamento de erros

Entradas de voo e compartilhamento serão normalizadas por schemas Zod com limites de tamanho, formatos e conjuntos de caracteres apropriados. Todo texto inserido em e-mails HTML será escapado contextualmente. O callback do heartbeat e as integrações externas devolverão erros genéricos ao cliente e registrarão detalhes somente no log de servidor com identificador de correlação.

| Risco | Implementação | Critério de aceite |
| --- | --- | --- |
| HTML não escapado | Função única de escape e templates sem interpolação insegura | Teste com caracteres HTML mostra texto literal no e-mail |
| Campos arbitrários | Limites e formatos em números de voo, localizadores, terminais e companhias | Contrato rejeita payload fora da regra |
| Vazamento de erro | Resposta externa genérica + log estruturado interno | Callback não devolve mensagem de exceção ou URL interna |

### S5 — Proteção de quota, push e fluxos sensíveis

O uso de RapidAPI será reservado atomica e condicionalmente antes da chamada externa, terá limite específico e timeout. As assinaturas push serão vinculadas a sessão/dispositivo para impedir consulta ou remoção baseada somente no endpoint. Operações caras e de terceiros terão logs de auditoria sem dados sensíveis.

| Fluxo | Implementação | Critério de aceite |
| --- | --- | --- |
| Busca RapidAPI | Reserva transacional, timeout e limite por procedimento | Concorrência não excede quota mensal e falhas não prendem a interface |
| Push | Vincular assinatura ao usuário/dispositivo e proteger operações | Endpoint isolado não permite enumeração ou desinscrição de terceiro |
| Jobs | Correlação e logs seguros | Falhas rastreáveis sem exposição de detalhes ao chamador |

### S6 — Automação contínua de segurança

O ciclo fecha com scripts locais e, quando a permissão de workflow estiver disponível, uma pipeline remota. Ela deve executar `pnpm audit --prod`, varredura de segredo sem imprimir valores, TypeScript, Vitest e checagem passiva de cabeçalhos. Cada novo procedimento tRPC deve trazer teste de autorização negativa.

| Controle | Bloqueio de aceite |
| --- | --- |
| SCA | Nenhuma vulnerabilidade alta introduzida |
| Segredos | Nenhum arquivo versionado com padrão de segredo forte |
| API | Procedimento administrativo sem teste de `UNAUTHORIZED`/`FORBIDDEN` não é aceito |
| DAST passivo | Cabeçalhos publicados mantêm HSTS, CSP restritiva, `nosniff` e política de frame correta |

## Estratégia de validação e checkpoints

Cada marco de implementação seguirá o mesmo ciclo: alteração isolada, testes unitários ou de contrato, TypeScript, suíte Vitest, verificação manual do fluxo afetado, medição comparativa quando houver impacto de performance e checkpoint. Migrações de banco serão aplicadas somente depois da revisão de schema e acompanhadas de `EXPLAIN` para a consulta-alvo.

| Marco | Validação obrigatória | Evidência esperada | Publicação |
| --- | --- | --- | --- |
| P1 | PDF completo, PDF com cancelado/remarcado, TypeScript e Vitest | Chunk PDF ausente da carga inicial e presente ao exportar | Após checkpoint próprio |
| P2 | Gráfico anual, estado vazio, celular, TypeScript e Vitest | Chunk Recharts sob demanda | Após checkpoint próprio |
| P3 | Navegação repetida, mutações e troca de ano | Menos refetches sem dado obsoleto após alteração | Após checkpoint próprio |
| P4 | Paginação, filtro anual, migração e `EXPLAIN` | Índices usados e payload inicial reduzido | Após checkpoint próprio |
| S1 | `pnpm audit --prod`, build, TypeScript, Vitest e fluxos de gráfico/PDF | Zero vulnerabilidade alta | Antes de qualquer nova publicação pública |
| S2 | Cabeçalhos HTTP publicados e regressão de integrações | CSP sem curinga de frame e allowlists justificadas | Após checkpoint próprio |
| S3–S5 | Testes de autorização negativa, encoding, quota, callback e push | Sem bypass, erro sensível ou envio indevido | Após checkpoints separados por domínio |
| S6 | Execução dos scripts de segurança | Relatório de CI/local sem falha de alta severidade | Contínuo |

## Ordem de checkpoints sugerida

| Ordem | Checkpoint | Conteúdo exclusivo |
| ---: | --- | --- |
| 1 | `perf/lazy-pdf` | P1, sem alterar gráficos ou cache |
| 2 | `perf/lazy-charts` | P2, sem alterar API ou banco |
| 3 | `perf/query-cache` | P3, contratos preservados |
| 4 | `perf/history-pagination-indexes` | P4 e migração de índices |
| 5 | `security/dependency-remediation` | S1 e lockfile |
| 6 | `security/csp-hardening` | S2 e testes de cabeçalho |
| 7 | `security/admin-privacy` | S3, após decisão de política pública |
| 8 | `security/output-api-jobs` | S4 e S5, divididos se o escopo ficar grande |
| 9 | `security/continuous-verification` | S6, scripts e documentação operacional |

## Decisões do proprietário antes da execução

| Decisão | Alternativas | Impacto no plano |
| --- | --- | --- |
| Visibilidade do calendário | Exigir sessão para todas as semanas; ou manter versão pública reduzida | Define S3 e testes de privacidade |
| Administração | Allowlist simples pelo e-mail interno; ou role persistida preparada para múltiplos usuários | Define escopo de `flightAdminProcedure` |
| Compressão do HTML | Solicitar suporte da plataforma; ou aguardar confirmação técnica | Define execução de P6, fora do código de negócio |
| Telemetria | Métricas internas mínimas; ou serviço externo aprovado | Define instrumentação P5 sem expor dados pessoais |

## Roteiro operacional

A execução começará em P1 e seguirá em ordem até P4. Depois da validação comparativa, a segurança iniciará em S1, que é o gate de release, seguida de S2, S3, S4 e S5. S6 fecha o ciclo ao automatizar as verificações. Decisões de privacidade e modelo administrativo serão solicitadas somente no momento em que bloquearem S3; todas as demais etapas podem avançar autonomamente.

## Referências

[1]: [Auditoria de performance do Smart Fly](./auditoria-performance.md) — linha de base, prioridades e critérios de medição.
[2]: [Auditoria de segurança do Smart Fly](./auditoria-seguranca.md) — vulnerabilidades, OWASP e plano de remediação.
[3]: [OWASP Top 10:2025](https://owasp.org/Top10/2025/en/) — categorias atuais de riscos de aplicações web.
[4]: [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — riscos e controles específicos de APIs.
