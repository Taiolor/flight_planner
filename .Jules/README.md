# 🤖 Esquadrão Diário de Agentes (Estilo Google Jules)

Este diretório armazena a **memória contínua e os diários de aprendizado** dos 5 agentes especialistas que auditam e evoluem o `flight_planner` diariamente às **06:00 (`America/Sao_Paulo`)**.

## Os 5 Agentes Especialistas

| Agente | Persona | Foco Principal | Diário de Aprendizado | Skill no Projeto |
| :--- | :--- | :--- | :--- | :--- |
| **⚡ Bolt** | Performance Engineer | Queries N+1 (Drizzle), re-renders React, memoização, complexidade algorítmica $O(N)$ | [`.Jules/bolt.md`](./bolt.md) | [`.agents/skills/jules-bolt/SKILL.md`](../.agents/skills/jules-bolt/SKILL.md) |
| **🛡️ Sentinel** | Security Auditor | Middlewares tRPC (`flightProtectedProcedure`), limites Zod, XSS/HTML escape, cookies/JWT, `ENV` | [`.Jules/sentinel.md`](./sentinel.md) | [`.agents/skills/jules-sentinel/SKILL.md`](../.agents/skills/jules-sentinel/SKILL.md) |
| **🎨 Palette** | UX & Accessibility (a11y) | WCAG, `aria-*`, `htmlFor`/`id`, navegação por teclado (`focus-visible`), feedbacks visuais e empty states | [`.Jules/palette.md`](./palette.md) | [`.agents/skills/jules-palette/SKILL.md`](../.agents/skills/jules-palette/SKILL.md) |
| **🧪 Radar** | Automated Testing & QA | Cobertura Vitest, testes de casos de borda (tRPC + React Testing Library), prevenção de regressões | [`.Jules/radar.md`](./radar.md) | [`.agents/skills/jules-radar/SKILL.md`](../.agents/skills/jules-radar/SKILL.md) |
| **🧹 Janitor** | Clean Code & Code Health | Tipagem estrita TypeScript (`pnpm check`), remoção de código morto, DRY, modularidade e saúde arquitetural | [`.Jules/janitor.md`](./janitor.md) | [`.agents/skills/jules-janitor/SKILL.md`](../.agents/skills/jules-janitor/SKILL.md) |

## Fluxo de Trabalho Diário (Orquestrador)

A skill orquestradora [`.agents/skills/jules-daily-squad/SKILL.md`](../.agents/skills/jules-daily-squad/SKILL.md) coordena a execução diária seguindo o protocolo Google Jules:

1. **Leitura de Memória**: Cada agente lê seu respectivo arquivo `.Jules/<agente>.md` antes de analisar o código para não repetir auditorias redundantes e aplicar padrões já aprendidos.
2. **Melhoria Cirúrgica**: Cada agente identifica **1 oportunidade real e de alto impacto** em sua área e implementa uma mudança focada, limpa e atômica.
3. **Verificação Rigorosa**: Executa `pnpm check` (TypeScript) e `pnpm test` (Vitest) para garantir zero regressões.
4. **Registro de Aprendizado**: Adiciona uma nova entrada datada (`## YYYY-MM-DD - Título`) no seu diário `.Jules/<agente>.md`.
5. **Entrega (Branch / PR / Commit)**: Cria uma branch semântica (`bolt/...`, `sentinel/...`, `palette/...`, `radar/...`, `janitor/...`) com commit padronizado e abre Pull Request (ou registra localmente caso offline).
