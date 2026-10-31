# 🧪 Radar — Diário de Testes Automatizados & Qualidade

Este arquivo registra os aprendizados e padrões de testes automatizados identificados pelo agente **🧪 Radar** no projeto `flight_planner`.

## 2026-10-31 - Inicialização do Diário do Radar

**Learning:** O projeto utiliza Vitest (`pnpm test`) com `@testing-library/react`, `jsdom` e `@vitest/coverage-v8` para testes de frontend (`client/src/`) e backend (`server/`). Manter mocks alinhados com o objeto centralizado `ENV` (`server/_core/env.ts`) e testar tanto o caminho feliz quanto rejeições de schema Zod/middlewares tRPC previne regressões silenciosas.
**Action:** Em cada execução diária, priorizar módulos ou routers com baixa cobertura de ramos (branch coverage), adicionar testes determinísticos para casos de borda (inputs limites, falhas de autenticação, estados vazios/erro na UI) e verificar que toda a suíte passa via `pnpm test`.


## 2026-10-31 - Unit Test Coverage for Financial Aggregations (`server/financial.test.ts`)

**Learning:** The financial aggregation module (`server/financialDb.ts`) lacked dedicated unit tests verifying that `getFinancialSummaryByMonth` and `getFinancialYearSummary` properly exclude unissued tickets (`isTicketIssued === 0`), sort months chronologically, group unknown airlines under `"desconhecida"`, and avoid division-by-zero when no tickets are issued.
**Action:** Leverage the optional `prefetchedWeekData` parameter in aggregation functions to write fast, deterministic unit tests covering both multi-month/multi-airline rollups and empty-state boundary conditions.

## 2026-10-31 - Schema Boundary Validation Tests for Quotes & Travel Procedures

**Learning:** While `server/quotes.test.ts` verified simple arithmetic and date formatting functions, it lacked automated validation tests for tRPC input schemas (`getByWeek`, `fetchFromApi`, `saveManual`, and `shareByEmail`). This left input boundaries (such as upper limits on week numbers, negative prices, and maximum string lengths) untested against potential regression or malicious payloads.
**Action:** Always maintain dedicated schema validation tests in `server/*.test.ts` verifying that boundary values, oversized strings, and negative numeric inputs are strictly rejected by Zod schemas before reaching database and email handlers.
