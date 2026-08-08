1. **Otimização de Performance em `client/src/pages/Changelog.tsx`**
   - Envolver o agrupamento e ordenação de releases (`releasesByMonth` e `months`) no hook `useMemo`.
   - **Motivo**: O array de `releases` é um array longo, e esse cálculo de agrupamento (`reduce`) e a subsequente ordenação das chaves dos meses (`sort` com parsing de datas) estão acontecendo a cada renderização, o que não é necessário já que `releases` é estático ou muda muito raramente.

2. **Otimização de Performance em `client/src/pages/FlightQuotes.tsx`**
   - Extrair a lógica do cálculo do `lowestQuote` que hoje usa `.reduce()` no componente `QuoteRow` e adicionar em `useMemo` na própria raiz onde os `quotes` são gerenciados (em `FlightQuotes` e/ou os itens renderizados via `.map`).
   - Mover os cálculos de status (past/current/future) do `weekCounts` pra single pass se ele não estiver (mas eu verifico).

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run tests, check types and run formatting before creating PR.
