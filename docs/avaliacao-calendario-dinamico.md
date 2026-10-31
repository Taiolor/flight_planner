# Avaliação técnica — calendário anual dinâmico

**Autor:** Manus AI  
**Data:** 16 de agosto de 2026  
**Escopo:** Seleção de ano no cabeçalho, semanas e passagens isoladas por ano de planejamento.

## Síntese executiva

O sistema já possui uma base parcial para separar dados por ano: `flight_weeks`, `flight_prices` e `public_prices` armazenam a coluna `year`, e a Gestão Financeira já recebe o ano como parâmetro. Contudo, a experiência ainda é efetivamente fixa em 2026. A Home consulta semanas e preços sem informar o ano selecionado; o backend substitui esse parâmetro implicitamente pelo ano do relógio do servidor; o calendário tem um `year` visual sem vinculá-lo ao estado global; e cotações, logs de notificação e algumas buscas identificam uma viagem apenas por `weekNumber`.

> **Conclusão:** a mudança é viável sem descartar os dados de 2026, mas deve ser tratada como uma evolução de identidade de domínio — de `semana` para `ano de planejamento + semana` — e não como uma alteração apenas de interface.

O caminho recomendado é introduzir uma entidade de **ano de planejamento**, tornar todas as consultas explicitamente anuais, usar chaves compostas ou referências por `flightWeekId`, gerar semanas a partir de regras configuráveis e migrar progressivamente os dados de 2026. O seletor no cabeçalho deve se tornar a fonte única de verdade, sincronizada com a URL e aplicada a Home, Calendário, Financeiro, Cotações, PDF e Administração.

## Diagnóstico atual

| Camada | Situação atual | Impacto para calendário dinâmico |
|---|---|---|
| Cabeçalho/Home | O `YearContext` persiste um ano escolhido, mas a Home consulta `getWeeks`, `getPrices` e `getPublicPrices` sem enviar esse ano. | Trocar o seletor muda o rótulo da tela, mas não garante a troca do conjunto de semanas, bilhetes ou preços. |
| Semanas | A tabela já possui `year`, mas não tem unicidade composta em `(year, weekNumber)`. | A semana 1 de 2026 e a semana 1 de 2027 não estão protegidas contra colisões lógicas. |
| Persistência | Helpers usam `new Date().getFullYear()` e caches únicos globais. Alguns lookups recebem apenas `weekNumber`. | A leitura pode retornar o ano do servidor, não o ano escolhido pelo usuário; caches podem misturar resultados entre anos. |
| Calendário | Aceita uma prop `year`, mas usa `DEFAULT_YEAR = 2026`, consulta semanas sem filtro e possui cabeçalhos/resumos fixos em 2026. | A grade mensal pode representar um ano e os marcadores/bilhetes outro. |
| Fonte de semanas | `flightData.ts` é um dataset manual de 44 semanas de 2026, iniciado em março. | Não há geração de semanas para 2027+, nem configuração reutilizável de período e recorrência. |
| Preços e finanças | Finanças já recebe `year`; preços genéricos não são filtrados pelo ano da UI e o upsert usa `weekNumber + airline`. | Há risco de preço de uma semana de um ano sobrescrever o mesmo número de semana de outro ano. |
| Cotações | `flight_quotes` usa datas e `weekNumber`, mas não possui `year` nem referência à semana. | Histórico, edição e busca de cotação não ficam isolados por ano de planejamento. |
| Notificações | Jobs usam `getAllFlightWeeks()` e logs armazenam apenas `weekNumber` e direção. | Alertas e histórico não têm identidade anual explícita. |
| PDF e bilhetes | O bilhete está hoje embutido nos campos de ida/volta da semana. | Funciona para o modelo atual de até dois trechos, mas limita expansão e dificulta rastrear cada bilhete como registro próprio. |

Atualmente há **44 semanas de 2026**, das quais **28** estão marcadas como emitidas; também existem **32** registros de preços privados, **3** públicos e **2** cotações armazenadas para datas de 2026. A migração deve preservar esses registros como o primeiro ano de planejamento, sem recriar ou reenumerar as semanas existentes.

## Modelo de domínio recomendado

### 1. Separar “ano de planejamento” de “ano civil”

O campo `year` existente deve ser interpretado explicitamente como **ano de planejamento**. Ele não deve derivar automaticamente do relógio do servidor. Isso é importante porque uma semana pode atravessar a virada do ano civil — por exemplo, uma ida em dezembro e uma volta em janeiro — mas continua pertencendo ao plano anual no qual foi criada.

O número de semana deve permanecer como uma **sequência do plano** (`1`, `2`, `3`...), e não ser convertido em semana ISO. A sequência atual começa em março e contém 44 viagens; portanto, o uso de semana ISO mudaria a semântica histórica e quebraria a familiaridade da tela.

### 2. Nova entidade `planning_years`

Recomenda-se criar uma tabela `planning_years` para centralizar as regras do período:

| Campo | Finalidade |
|---|---|
| `year` (PK) | Ano de planejamento, por exemplo `2026` ou `2027`. |
| `label` | Nome opcional exibido na interface, por exemplo “Plano de viagens 2027”. |
| `startDate` e `endDate` | Janela do plano; evita assumir janeiro a dezembro. |
| `departureWeekday` | Dia padrão de ida; no cenário atual, domingo. |
| `defaultReturnWeekday` | Dia padrão de retorno; quinta ou sexta-feira. |
| `defaultDepartureAirport` | GRU ou CGH como padrão anual. |
| `status` | Rascunho, ativo ou arquivado. |
| `templateYear` | Ano de origem quando um novo plano é criado a partir de uma configuração existente. |

Essa entidade torna explícitas as escolhas que hoje estão escondidas em `flightData.ts` e permite iniciar 2027 sem copiar bilhetes, preços ou dados financeiros de 2026.

### 3. Semanas e bilhetes

Há duas opções de implementação.

| Opção | Descrição | Vantagem | Limitação |
|---|---|---|---|
| **MVP compatível** | Manter os campos de ida/volta em `flight_weeks`, garantindo `UNIQUE(year, weekNumber)`. | Migração menor e preserva toda a UI atual. | Continua limitado a uma ida e uma volta por semana. |
| **Modelo recomendado** | Manter `flight_weeks` como agenda e criar `flight_legs`/`flight_tickets` com um registro por trecho. | Cada bilhete tem localizador, companhia, preço, milhas, status e remarcação próprios. | Exige migração e adaptação maior do frontend/PDF. |

Para atender ao requisito de passagens controladas individualmente, a recomendação é o **modelo recomendado**, implementado em duas etapas: primeiro tornar a semana anual segura; depois extrair os trechos de ida e volta para uma tabela própria.

Um desenho de destino seria:

```text
planning_years (year)
       │ 1:N
flight_weeks (id, year, weekNumber, departureDate, returnDate, ...)
       │ 1:N
flight_legs (id, flightWeekId, direction, locator, airline, datetime,
             airport, flightNumber, terminal, price, miles, rescheduled, ...)
       │ 1:N
flight_quotes (id, flightWeekId, quotedAt, source, lowestPrice, ...)
```

Os índices mínimos devem ser:

```sql
UNIQUE KEY uq_flight_weeks_year_week (year, weekNumber);
UNIQUE KEY uq_flight_prices_year_week_airline (year, weekNumber, airline);
UNIQUE KEY uq_public_prices_year_week_airline (year, weekNumber, airline);
INDEX idx_flight_weeks_year_dates (year, departureDate, returnDate);
```

Durante a transição, `flight_quotes` e `notification_logs` devem receber `year` e, preferencialmente, `flightWeekId`. Depois do backfill, as leituras novas devem usar a referência por ID para eliminar ambiguidade.

## Regras para geração de semanas

O dataset estático de 2026 deve ser substituído por um gerador determinístico, por exemplo `generatePlanningWeeks(config)`. O gerador recebe o ano de planejamento, a data inicial e final, o dia padrão de ida e o dia padrão de retorno. Ele cria uma sequência contínua de semanas, sem alterar semanas que já tenham sido ajustadas manualmente.

O comportamento sugerido é:

1. Encontrar o primeiro domingo dentro da janela do plano.
2. Criar uma semana por domingo até a data final definida para o plano.
3. Calcular o retorno padrão na sexta; quando a regra anual definir quinta, usar quinta como padrão.
4. Permitir ajuste por semana antes ou depois de criar o bilhete.
5. Marcar semanas geradas como `source = generated` e ajustes humanos como `source = manual` ou manter uma coluna `hasDateOverride`.

As datas devem ser manipuladas como **datas locais sem horário** (`YYYY-MM-DD`) ou com uma biblioteca que preserve fuso horário. Não se deve converter uma data de agenda para UTC à meia-noite, pois isso já causou deslocamento de dia no calendário anteriormente.

Feriados, jogos e eventos especiais devem sair de um objeto global rígido. A solução é um catálogo anual por fonte (`holiday_calendars` ou adaptadores por ano), associado ao ano de planejamento. Eventos específicos de 2026, como a Copa, não devem aparecer quando o usuário seleciona 2027.

## Contratos de API propostos

Todo endpoint que lê ou altera planejamento deve receber `year` de modo obrigatório. Defaults para 2026 ou para o ano do servidor devem ser removidos depois da migração.

| Atual | Proposta |
|---|---|
| `flights.getWeeks()` | `flights.getWeeks({ year })` |
| `flights.getPrices()` | `flights.getPrices({ year })` |
| `flights.getPublicPrices()` | `flights.getPublicPrices({ year })` |
| `flights.initWeeks(weeks)` | `planningYears.create({ config })` e `planningYears.generateWeeks({ year, overwriteDrafts: false })` |
| `flights.updateWeekStatus({ year?, weekNumber, ... })` | `flights.updateWeek({ year, weekNumber, ... })` ou `flightWeeks.update({ id, ... })` |
| `quotes.getByWeek({ weekNumber })` | `quotes.getByWeek({ year, weekNumber })` ou `quotes.getByFlightWeek({ flightWeekId })` |
| `quotes.fetchFromApi(...)` | Input com `year` e `flightWeekId`, usando as datas da semana no servidor. |
| Notificações | Buscar voos futuros por `flightDatetime`; logs devem registrar `year` e `flightWeekId`. |

O cache do servidor deve ser indexado por ano: `Map<number, Promise<FlightWeek[]>>` e `Map<number, Promise<FlightPrice[]>>`, nunca uma promessa global única. Mutations devem invalidar apenas o ano afetado no cliente.

## Experiência de interface recomendada

O seletor existente deve continuar no cabeçalho, mas passar a controlar toda a aplicação. A fonte de verdade pode ser `YearContext`, com sincronização para a URL (`?ano=2027`) e `localStorage` como preferência de retorno.

| Tela | Mudança necessária |
|---|---|
| Home | Consultar semanas e preços por `selectedYear`; limpar estados temporários ao trocar de ano; criar o plano somente após confirmação explícita. |
| Calendário | Usar `useYear()` em vez de `DEFAULT_YEAR`; enviar ano ao backend; exibir “Calendário {ano}”; filtrar marcadores, resumo e alertas pelo mesmo plano. |
| Financeiro | Substituir estado anual local pelo `YearContext`; obter anos disponíveis de `planning_years`, não de um array fixo. |
| Cotações | Exibir o ano no título e usar `year + weekNumber` ou `flightWeekId` em todas as operações. |
| PDF | Incluir ano de planejamento e garantir que todos os bilhetes exportados pertencem ao ano selecionado. |
| Administração | Exibir ano ou semana completa nos alertas e no histórico; manter notificações operacionais baseadas em horários futuros, não no ano selecionado visualmente. |

Quando um ano ainda não existir, o seletor deve exibir o estado **“Plano ainda não criado”** com uma ação protegida para criar o rascunho a partir da configuração padrão. A criação não deve copiar bilhetes emitidos, localizadores, preços pagos, cotações, pontos ou logs do ano anterior.

## Estratégia de migração sem perda de dados

### Fase 0 — Proteção e inventário

Fazer backup lógico das tabelas afetadas e registrar as contagens de 2026. O estado atual deve ser tratado como o plano `2026`, incluindo as 44 semanas e os 28 bilhetes emitidos.

### Fase 1 — Integridade do banco

Adicionar índices compostos e a tabela `planning_years`. Inserir o registro de 2026 sem alterar semanas existentes. Adicionar colunas `year` e `flightWeekId` a cotações e logs inicialmente como opcionais.

### Fase 2 — Backfill

Preencher `flightWeekId` em cotações e logs por meio do par `year + weekNumber`; no caso de logs antigos, derivar o ano a partir de `flightDatetime` e usar a data de envio apenas como último recurso. Gerar um relatório para itens que não possam ser associados automaticamente.

### Fase 3 — APIs anuais

Atualizar helpers, routers e invalidations para exigir `year`. Manter uma camada de compatibilidade temporária apenas para clientes ainda em transição; ela deve registrar aviso e ter data de remoção definida.

### Fase 4 — Geração de plano e interface

Implementar `planningYears.create` e o gerador de semanas. Conectar o seletor anual a Home, Calendário, Financeiro e Cotações. Migrar títulos, PDFs e resumos para o ano selecionado.

### Fase 5 — Normalização de bilhetes

Extrair `flight_legs`/`flight_tickets`, migrar ida e volta existentes e atualizar PDF, notificações e administração para a nova referência. Essa fase pode ser posterior ao primeiro lançamento anual dinâmico, desde que a chave composta já exista.

### Fase 6 — Corte definitivo

Remover defaults de 2026/ano atual, dataset `flightData` como fonte operacional e os campos legados após validação do backfill. Manter a fonte estática apenas como fixture histórica de testes, se necessário.

## Critérios de aceite

| Cenário | Resultado esperado |
|---|---|
| Trocar 2026 por 2027 no cabeçalho | Home, Calendário, Financeiro, Cotações e PDF exibem exclusivamente dados de 2027. |
| Criar 2027 | Semanas são geradas a partir das regras anuais; nenhum bilhete ou preço de 2026 é copiado. |
| Editar semana 1 de 2027 | A alteração não afeta semana 1 de 2026. |
| Salvar preço de uma companhia em 2027 | O preço não sobrescreve o registro homônimo de 2026. |
| Notificação futura | O job encontra o trecho pelo horário de voo e registra ano e semana no histórico. |
| Ano sem plano | A interface informa ausência de plano e oferece criação protegida, sem fallback silencioso para 2026. |
| Datas entre dezembro/janeiro | O retorno continua associado ao ano de planejamento correto. |
| Regressão de 2026 | Dados existentes, PDF, calendário, finanças e alertas permanecem funcionais. |

## Decisões que precisam de definição antes da implementação

1. Qual é a janela padrão de cada plano: janeiro a dezembro, março a dezembro ou datas editáveis por ano?
2. O retorno padrão deve ser quinta, sexta ou uma regra por semana?
3. A criação de um novo ano deve copiar apenas a configuração anual (aeroporto e recorrência) ou também rascunhos de semanas?
4. O modelo precisa suportar mais de dois trechos por semana desde o primeiro lançamento? Se sim, a normalização de `flight_legs` deve fazer parte da primeira entrega.
5. Quais feriados municipais/estaduais devem ser carregados automaticamente para cada ano e rota?

## Recomendação final

Implementar primeiro a versão anual segura com `planning_years`, geração de semanas e chaves compostas. Essa entrega permite selecionar 2027 e controlar semanas, passagens e preços de maneira independente, preservando 2026. Em seguida, evoluir para `flight_legs` para que cada trecho seja uma passagem individual e extensível.

Não é recomendável apenas conectar o seletor atual ao calendário: sem corrigir os helpers, as chaves e os caches, o sistema exibiria um ano na interface enquanto consultaria ou alteraria outro no banco.

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
