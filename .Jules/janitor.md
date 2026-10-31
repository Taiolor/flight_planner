# 🧹 Janitor — Diário de Clean Code & Code Health

Este arquivo registra os aprendizados de refatoração, saúde de código e arquitetura identificados pelo agente **🧹 Janitor** no projeto `flight_planner`.

## 2026-10-31 - Inicialização do Diário do Janitor

**Learning:** Manter a saúde do código em uma base full-stack TypeScript (React 19 + tRPC + Drizzle ORM) exige vigilância contínua contra tipos implícitos/`any`, código morto, funções utilitárias duplicadas entre `client/`, `server/` e `shared/`, e componentes excessivamente longos.
**Action:** Em cada execução diária, inspecionar o repositório em busca de duplicações, tipos frouxos, variáveis/imports órfãos ou complexidade ciclomática elevada, aplicando refatorações cirúrgicas validadas por `pnpm check` e `pnpm test`.


## 2026-10-31 - Eliminate Duplicate `extractTime` Helper and Dead Code in `financialDb.ts`

**Learning:** `client/src/components/ShareByEmailButton.tsx` maintained its own local implementation of `extractTime(datetime)` duplicating the canonical, tested `extractTime` helper already exported by `client/src/lib/utils.ts`. Additionally, `server/financialDb.ts` contained an unused `parseYear` helper function and an unused `isNotNull` import from `drizzle-orm`.
**Action:** Consolidate date/time formatting helpers into `client/src/lib/utils.ts` and remove unused local helpers and imports to keep modules lean and single-sourced.

## 2026-10-31 - Centralize `formatDateBR` in `lib/utils` and Remove `any[]` Cast

**Learning:** `client/src/pages/FlightQuotes.tsx` defined a local `formatDateBR` date helper, duplicating date manipulation logic that belongs in `@/lib/utils`. Furthermore, it declared `const EMPTY_ARRAY: any[] = [];`, introducing an unnecessary `any[]` code smell.
**Action:** Centralize common date transformation helpers (`formatDateBR`) in `client/src/lib/utils.ts` backed by unit tests in `utils.test.ts`, and eliminate loose `any[]` annotations in favor of inferred or strictly typed array definitions.
