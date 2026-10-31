# Plano diretor — calendário anual dinâmico

**Autor:** Manus AI  
**Data:** 16 de agosto de 2026  
**Objetivo:** fazer com que o ano escolhido no cabeçalho seja a fonte única de verdade para as semanas, bilhetes, preços, calendário, finanças, PDF, cotações e alertas relacionados.

## 1. Decisão arquitetural

O sistema deve passar de uma aplicação **centrada em 2026** para uma aplicação **centrada no ano de planejamento**. O ano não será apenas uma preferência visual: ele fará parte da identidade de toda semana, passagem, preço, cotação e registro operacional.

> A identidade mínima de uma semana passa a ser **`planningYear + weekNumber`**. Nenhuma operação poderá usar somente `weekNumber`.

O plano mantém integralmente os dados existentes de 2026. A seleção de 2027, 2028 ou qualquer ano futuro cria ou consulta um plano independente, sem copiar passagens emitidas, localizadores, preços pagos, pontos, cotações ou histórico de notificações do ano anterior.

## 2. Comportamento esperado para o usuário

| Ação | Resultado obrigatório |
|---|---|
| Selecionar 2027 no cabeçalho da Home | A tela consulta somente semanas, preços, filtros, totais e bilhetes de 2027. |
| Abrir Calendário com 2027 selecionado | A grade, os marcadores, feriados, resumo de semanas sem bilhete e cartões exibem somente 2027. |
| Abrir Financeiro com 2027 selecionado | KPIs, gráficos, tabelas e projeções usam o mesmo ano selecionado. |
| Escolher ano sem plano criado | A aplicação informa claramente que o plano não existe e oferece criação protegida de um rascunho. Nunca exibe 2026 silenciosamente. |
| Editar semana 1 de 2027 | Nenhum dado da semana 1 de 2026 pode ser lido, alterado ou sobrescrito. |
| Atualizar a página ou abrir um link compartilhado | O ano é restaurado pela URL; `localStorage` é apenas preferência de retorno. |
| Ano atravessando dezembro/janeiro | A viagem continua pertencendo ao ano de planejamento escolhido, mesmo que o retorno ocorra no ano civil seguinte. |

## 3. Invariantes que tornam a solução segura

| Invariante | Regra de implementação |
|---|---|
| Isolamento anual | Toda query e mutation de domínio recebe `year` ou `flightWeekId` resolvido a partir dele. |
| Chave composta | Semanas são únicas por `(year, weekNumber)`; preços por `(year, weekNumber, airline)`. |
| Fonte de verdade única | O estado anual vem de `YearContext` sincronizado com a URL. Páginas não mantêm anos locais independentes. |
| Sem fallback silencioso | Ausência de plano resulta em estado vazio explícito; o backend não substitui por `new Date().getFullYear()` ou por 2026. |
| Geração idempotente | Criar ou regenerar semanas não duplica registros, não sobrescreve bilhetes e não altera semanas ajustadas manualmente. |
| Operações atômicas | Alterações que envolvem plano, semanas e preços usam transação; falha reverte o conjunto inteiro. |
| Dados históricos imutáveis | 2026 é migrado e preservado antes de qualquer expansão anual. |
| Cache anual | Toda chave de cache inclui o ano; invalidações atingem somente o ano afetado. |

## 4. Arquitetura proposta

### 4.1 Estado anual compartilhado

O `YearContext` deve evoluir para um `PlanningYearProvider` com as seguintes responsabilidades:

| Responsabilidade | Implementação |
|---|---|
| Resolver ano inicial | Prioridade: parâmetro `?ano=` da URL → último ano salvo → plano ativo mais recente → ano civil atual. |
| Validar ano | Aceitar somente anos existentes ou anos permitidos para criação, por exemplo `2026–2035`. |
| Sincronizar URL | Ao trocar de ano, usar `history.replaceState` ou rota `?ano=2027` sem recarregamento completo. |
| Persistir preferência | Salvar em `localStorage` somente depois de validar o ano. |
| Expor estado | `selectedYear`, `availableYears`, `planningYearStatus`, `setSelectedYear`, `createPlanningYear`. |
| Evitar condições de corrida | Cancelar consultas anteriores ou ignorar respostas cujo `year` não coincida com o estado atual. |

O seletor de ano deve ser reutilizado em Home, Calendário e Financeiro. Financeiro não deve manter um `useState(2026)` próprio. Calendário não deve receber um `DEFAULT_YEAR = 2026` como fonte de dados.

### 4.2 Modelo de dados alvo

```text
planning_years
  └── 1:N flight_weeks
          ├── 1:N flight_legs
          ├── 1:N flight_prices
          ├── 1:N flight_quotes
          └── 1:N notification_logs
```

| Entidade | Responsabilidade | Campos essenciais |
|---|---|---|
| `planning_years` | Configuração e ciclo de vida do plano anual. | `year`, `label`, `startDate`, `endDate`, `departureWeekday`, `returnWeekday`, `defaultDepartureAirport`, `status`, `createdAt`. |
| `flight_weeks` | Agenda semanal pertencente ao plano. | `id`, `year`, `weekNumber`, `departureDate`, `returnDate`, `isDeleted`, `isTicketIssued`, `source`, `hasDateOverride`. |
| `flight_legs` | Bilhete individual de ida, volta ou trecho futuro. | `id`, `flightWeekId`, `direction`, `airline`, `locator`, `flightNumber`, `datetime`, `airport`, `terminal`, `price`, `miles`, `rescheduled`. |
| `flight_prices` | Preços pesquisados por companhia e semana. | `year`, `weekNumber`, `airline`, `price`, `capturedAt`. |
| `flight_quotes` | Respostas de cotação e seus metadados. | `flightWeekId`, `year`, `source`, `lowestPrice`, `quotedAt`, horários e companhias. |
| `notification_logs` | Histórico operacional de alertas. | `flightWeekId`, `year`, `direction`, `flightDatetime`, `status`, `sentAt`. |

### 4.3 Compatibilidade de curto prazo

Não é necessário extrair `flight_legs` na primeira entrega. A primeira versão pode manter os campos atuais de ida e volta em `flight_weeks`, desde que as chaves, consultas e mutations sejam anuais. A extração de trechos deve ocorrer na segunda fase, quando o sistema já estiver operando corretamente com 2027.

Isso reduz risco de migração, preserva a exportação PDF atual e permite validar o comportamento anual antes de aumentar a normalização do domínio.

## 5. Banco de dados e integridade

### 5.1 Mudanças obrigatórias antes da interface

```sql
CREATE TABLE planning_years (
  year INT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  departureWeekday TINYINT NOT NULL,
  returnWeekday TINYINT NOT NULL,
  defaultDepartureAirport VARCHAR(10) NOT NULL,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE flight_weeks
  ADD CONSTRAINT uq_flight_weeks_year_week UNIQUE (year, weekNumber),
  ADD INDEX idx_flight_weeks_year_dates (year, departureDate, returnDate);

ALTER TABLE flight_prices
  ADD CONSTRAINT uq_flight_prices_year_week_airline
  UNIQUE (year, weekNumber, airline);

ALTER TABLE public_prices
  ADD CONSTRAINT uq_public_prices_year_week_airline
  UNIQUE (year, weekNumber, airline);

ALTER TABLE flight_quotes
  ADD COLUMN year INT NULL,
  ADD COLUMN flightWeekId INT NULL,
  ADD INDEX idx_flight_quotes_year_week (year, weekNumber);

ALTER TABLE notification_logs
  ADD COLUMN year INT NULL,
  ADD COLUMN flightWeekId INT NULL,
  ADD INDEX idx_notification_logs_year_week (year, weekNumber);
```

As constraints devem ser aplicadas somente depois de uma consulta de pré-validação confirmar que não existem duplicatas. Caso exista duplicidade, a migração deve parar antes de qualquer alteração destrutiva e gerar um relatório de conflito.

### 5.2 Estratégia de backfill

| Etapa | Ação | Garantia |
|---|---|---|
| Backup | Exportar as tabelas afetadas e registrar contagens/checksums. | Permite reversão completa. |
| Registro de 2026 | Inserir `planning_years(2026)` usando o período real atual. | Preserva o plano histórico. |
| Weeks | Validar que as 44 semanas atuais pertencem a 2026. | Não altera datas nem status. |
| Prices | Associar `year = 2026` a registros legados faltantes. | Preços permanecem no mesmo ano. |
| Quotes/logs | Derivar ano de `departureDate` ou `flightDatetime`; marcar ambiguidades para revisão. | Não inventa associação em caso ambíguo. |
| Verificação | Comparar total de semanas, bilhetes emitidos, preços, milhas e financeiro antes/depois. | Detecta perda ou duplicação. |

Nenhuma migration deve apagar colunas antigas na mesma entrega que cria os novos campos. A remoção só ocorrerá após duas janelas de operação bem-sucedida e depois de validar backup e relatórios de reconciliação.

## 6. Geração confiável de semanas

### 6.1 Serviço determinístico

Criar um serviço de domínio, por exemplo `generatePlanningWeeks(config)`, fora de componentes React. Ele deve gerar datas usando objetos de data local ou strings `YYYY-MM-DD`, jamais conversões de meia-noite UTC.

| Entrada | Exemplo |
|---|---|
| Ano de planejamento | `2027` |
| Início e fim do plano | `2027-01-01` a `2027-12-31` ou período configurado |
| Dia padrão de ida | domingo |
| Dia padrão de volta | quinta ou sexta |
| Aeroporto padrão | GRU |
| Estratégia de semana incompleta | incluir, excluir ou requerer confirmação |

O serviço deve criar a primeira ida no primeiro dia de ida dentro do intervalo e enumerar semanas sequencialmente. O retorno padrão é calculado a partir da ida. Se o retorno cruzar o ano civil, a semana continua no plano anual de origem.

### 6.2 Idempotência e sobrescrita segura

O endpoint `planningYears.generateWeeks({ year })` deve executar em transação e obedecer às regras abaixo:

1. Se a semana ainda não existe, criar.
2. Se existe e não possui bilhete, preço salvo, ajuste manual ou `hasDateOverride`, atualizar somente dados gerados.
3. Se existe com qualquer dado operacional, não sobrescrever; registrar no resultado `skippedManualWeeks`.
4. Se duas solicitações ocorrem simultaneamente, a constraint anual e a transação garantem que apenas uma criação prevaleça.
5. O retorno informa `created`, `updated`, `skipped`, `conflicts` e `warnings`.

## 7. Contratos de API

Todos os contratos anuais devem tornar `year` obrigatório, validado por Zod e autorizado no backend.

| Área | Contrato novo |
|---|---|
| Planos | `planningYears.list`, `planningYears.get`, `planningYears.create`, `planningYears.generateWeeks`, `planningYears.archive`. |
| Semanas | `flights.getWeeks({ year })`, `flights.updateWeek({ year, weekNumber, patch })`, `flights.updateWeekDates({ year, weekNumber, ... })`. |
| Preços | `flights.getPrices({ year })`, `flights.getPublicPrices({ year })`, `flights.savePrice({ year, weekNumber, airline, price })`. |
| Financeiro | Reutilizar os contratos anuais existentes, removendo listas de anos fixas e defaults de 2026. |
| Cotações | `quotes.getByWeek({ year, weekNumber })`; mutations recebem `flightWeekId` ou `year + weekNumber`. |
| PDF | `exportPdf({ year, filters })`, sempre registrando o ano no cabeçalho. |
| Administração | Logs e alertas retornam `year`, `weekNumber` e datas; não dependem do ano visual para entregar alertas futuros. |

Os helpers devem receber `year` explicitamente. A prática atual de usar `new Date().getFullYear()` para filtrar semanas ou preços deve ser removida porque o ano do servidor não representa necessariamente o plano escolhido pelo usuário.

## 8. Aplicação por tela

### Home

Ao trocar o ano, a Home deve invalidar `flights.getWeeks({ year })`, `flights.getPrices({ year })`, totais e filtros dependentes. Estados temporários indexados por `weekNumber` devem ser limpos ou passar a usar a chave `${year}:${weekNumber}`. A inicialização automática atual deve ser removida: criar um plano é uma ação explícita e protegida.

O estado de tela deve distinguir três casos: carregando o plano, plano criado sem semanas emitidas e plano inexistente. Nenhum desses casos pode mostrar o dataset estático de 2026 como fallback.

### Calendário

O Calendário deve usar `usePlanningYear()`, não uma prop com default de 2026. Os cabeçalhos, resumo de passagens pendentes, dias marcados e popup devem receber semanas do mesmo `year`. O catálogo de feriados deve ser anual e ter escopo de fonte; eventos especiais de 2026 não acompanham automaticamente o plano de 2027.

### Financeiro

Financeiro deve abandonar estado anual local e ler o mesmo contexto. O seletor pode permanecer como redundância visual, mas deve atualizar o contexto global. Os anos disponíveis vêm de `planningYears.list`, não de arrays fixos. O período de projeção deve ser exibido como uma análise separada (`baseYear` e `targetYear`), sem alterar o plano visual atual.

### PDF, cotações e administração

PDF precisa conter o ano de planejamento e filtrar os dados antes de renderizar. Cotações devem ser identificadas por semana anual. O painel administrativo deve exibir ano e semana nas notificações, enquanto o job de push continua selecionando apenas voos futuros por `flightDatetime`.

## 9. Tratamento de falhas e recuperação

| Falha | Prevenção | Recuperação |
|---|---|---|
| Ano na URL inválido | Validação de limites e existência de plano. | Redirecionar para o plano ativo com aviso não intrusivo. |
| Plano inexistente | Estado explícito e botão protegido “Criar plano”. | Não usar fallback para 2026. |
| Geração parcial | Transação e relatório de resultado. | Rollback automático; reexecução idempotente. |
| Cache exibindo outro ano | Chaves React Query incluem `year`; resposta valida o ano retornado. | Invalidar somente o ano afetado e rejeitar resposta obsoleta. |
| Dados antigos sem ano | Backfill com relatório de ambiguidade. | Manter registro não associado até resolução, sem apagá-lo. |
| Duplicação de semana/preço | Constraints compostas. | A mutation retorna conflito tratável, sem sobrescrever. |
| Data deslocada por timezone | Datas de agenda em `YYYY-MM-DD` local; testes em GMT-3 e UTC. | Recalcular a partir da string persistida, não de timestamp UTC. |
| Falha ao carregar feriados | Catálogo versionado por ano e fallback com aviso. | Continuar exibindo semanas; não bloquear bilhetes. |
| Migração interrompida | Migrations pequenas e versionadas; backup prévio. | Retomar da etapa idempotente ou restaurar backup. |

## 10. Plano de implementação

| Fase | Entregas | Critério para avançar |
|---|---|---|
| **A. Fundação de dados** | `planning_years`, índices compostos, colunas anuais em quotes/logs, backup e relatório de integridade. | 2026 reconciliado sem diferença de contagem ou financeiro. |
| **B. Serviços anuais** | Helpers e routers recebem `year`; caches anuais; transações. | Testes comprovam isolamento entre semanas iguais de 2026 e 2027. |
| **C. Gerador de planos** | Criação protegida, gerador idempotente, configuração de recorrência e feriados. | Criar 2027 duas vezes não duplica nem altera ajustes. |
| **D. Home dinâmica** | Seletor global, URL, dados anuais, estados vazios e filtros. | Troca de ano não mistura bilhetes/preços. |
| **E. Calendário dinâmico** | Grade, feriados, resumo, popup e alertas anuais. | Calendário e Home exibem exatamente as mesmas semanas do ano. |
| **F. Financeiro dinâmico** | Contexto compartilhado, anos disponíveis, gráficos e PDF anuais. | Totais correspondem ao banco para o ano selecionado. |
| **G. Cotações/notificações** | `flightWeekId` e logs anuais; administração atualizada. | Alertas e histórico identificam corretamente ano/semana. |
| **H. Normalização de bilhetes** | `flight_legs` e migração de ida/volta. | PDF, remarcações e localizadores funcionam por trecho. |
| **I. Corte e observabilidade** | Remover defaults legados, dashboards de reconciliação e backup. | Não há leitura de `weekNumber` isolado nos caminhos de produção. |

## 11. Estratégia de testes

| Nível | Casos obrigatórios |
|---|---|
| Unitário | Geração de semanas, semanas cruzando ano, datas em GMT-3, idempotência e regras de retorno quinta/sexta. |
| Banco | Constraints compostas, transações, backfill, rollback e isolamento de preços por ano. |
| Router | Todas as procedures rejeitam ausência de `year` e nunca usam ano do servidor como fallback. |
| Integração | Criar 2027, emitir ida e volta, registrar preço, consultar financeiro, exportar PDF e verificar que 2026 permanece idêntico. |
| Interface | Troca de ano em Home, Calendário e Financeiro sincroniza URL, carregamento, estados vazios e valores. |
| Regressão | PDF, notificações, feriados, remarcações, pontos e resumo de semanas sem passagem em 2026. |
| Carga | Alternar rapidamente anos, múltiplas abas e geração concorrente do mesmo ano. |

## 12. Critérios de aceite finais

O calendário será considerado dinâmico quando todos os pontos abaixo forem verdadeiros:

1. O mesmo seletor anual controla Home, Calendário e Financeiro.
2. O ano aparece na URL e sobrevive a recarregamento, navegação e link compartilhado.
3. Semanas, preços, bilhetes, milhas, remarcações e localizadores nunca atravessam anos.
4. Um novo ano é criado por uma ação explícita, idempotente e auditável.
5. 2026 permanece integralmente preservado, inclusive totais financeiros e PDF.
6. Ano inexistente não reutiliza nenhum dado de outro ano.
7. Todos os caminhos de dados usam `year` ou `flightWeekId`; não há lookup de produção somente por `weekNumber`.
8. Cotações, notificações e histórico identificam ano e semana corretamente.
9. A suíte de testes cobre cenários de troca de ano, falhas de banco, data entre dezembro/janeiro e concorrência.

## 13. Decisões que podem ser adotadas como padrão

Para iniciar sem bloquear a implementação, recomenda-se assumir temporariamente os valores abaixo; todos podem ser configuráveis posteriormente.

| Tema | Padrão sugerido |
|---|---|
| Janela do plano | 1º de janeiro a 31 de dezembro. |
| Dia de ida | Domingo. |
| Dia de retorno | Sexta-feira, com opção de ajuste por semana para quinta. |
| Aeroporto de ida | GRU. |
| Criação de ano | Rascunho vazio com semanas geradas; não copia dados financeiros ou bilhetes. |
| Anos disponíveis | Planos existentes, mais próximo ano permitido para criação. |
| Feriados | Catálogo anual versionado, com falha não bloqueante. |
| Bilhetes na primeira entrega | Campos atuais de ida/volta preservados; extração para `flight_legs` na fase H. |

## Referências internas

- [`YearContext`](../client/src/contexts/YearContext.tsx)
- [`Home`](../client/src/pages/Home.tsx)
- [`CalendarView`](../client/src/pages/CalendarView.tsx)
- [`FinancialDashboard`](../client/src/pages/FinancialDashboard.tsx)
- [`schema Drizzle`](../drizzle/schema.ts)
- [`persistência de semanas e preços`](../server/db.ts)
- [`agregação financeira`](../server/financialDb.ts)
- [`notificações push`](../server/pushNotifications.ts)
- [`rotas de cotações`](../server/routers/quotes.ts)
