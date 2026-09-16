# Revisão de Pull Requests conflitantes — 16/09/2026

## Escopo

A revisão foi feita contra a `main` atual do repositório [Taiolor/flight_planner](https://github.com/Taiolor/flight_planner). Foram identificados dez PRs abertos em estado `CONFLICTING`: #381, #380, #367, #366, #365, #360, #358, #347, #344 e #334.

## Matriz de decisão

| PR | Tema | Situação observada na main | Decisão desta sessão | Risco |
| --- | --- | --- | --- | --- |
| [#381](https://github.com/Taiolor/flight_planner/pull/381) | Estabilidade referencial de mutações em `useCallback` | Dependências ainda usavam objetos completos em autenticação e push | Integrar manualmente em `useAuth` e `usePushNotifications` | Baixo |
| [#380](https://github.com/Taiolor/flight_planner/pull/380) | Limites de tamanho para entradas Zod | Login já estava protegido; campos de semanas ainda não tinham limite | Integrar manualmente, combinando com #366 | Médio |
| [#367](https://github.com/Taiolor/flight_planner/pull/367) | Labels ARIA em links externos | FlightPopup e FlightQuotes já tinham parte da melhoria; Home ainda tinha lacunas | Completar manualmente na Home e manter atributos existentes | Baixo |
| [#366](https://github.com/Taiolor/flight_planner/pull/366) | Limites em destinatários e e-mail de teste | E-mail já tinha limite; nome de destinatário ainda não | Integrar manualmente em conjunto com #380 | Baixo |
| [#365](https://github.com/Taiolor/flight_planner/pull/365) | Centralização de `escapeHtml` | Sanitização local existia no módulo de e-mail, mas não havia utilitário comum | Integrar utilitário compartilhado e manter comportamento para zero/nulos | Baixo |
| [#360](https://github.com/Taiolor/flight_planner/pull/360) | Parsing de datas no cálculo da semana atual | `parseBR` já estava aplicado na main | Tratar como obsoleto/duplicado | Baixo |
| [#358](https://github.com/Taiolor/flight_planner/pull/358) | Memoização de `WeekCard` e handlers em Cotações | `WeekCard` e handlers ainda não estavam memoizados | Integrar manualmente | Baixo |
| [#347](https://github.com/Taiolor/flight_planner/pull/347) | Schwartzian transform no Changelog | Transformação já estava presente na main | Tratar como obsoleto/duplicado | Baixo |
| [#334](https://github.com/Taiolor/flight_planner/pull/334) | Schwartzian transform no Changelog | Mesmo escopo funcional de #347 já presente | Tratar como duplicado/obsoleto | Baixo |
| [#344](https://github.com/Taiolor/flight_planner/pull/344) | Sliders Radix para filtros da Home | Sliders já estavam presentes na main | Tratar como obsoleto/duplicado | Baixo |

## Ordem de validação

As mudanças manuais serão validadas com `pnpm check`, testes focados dos módulos alterados, suíte completa `pnpm test`, build de produção e inspeção dos marcadores de conflito. PRs cujo escopo já esteja presente serão encerrados como obsoletos ou superseded somente após a validação da main.
