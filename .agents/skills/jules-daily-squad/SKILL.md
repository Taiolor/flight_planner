---
name: jules-daily-squad
description: >-
  Orquestrador diário do Esquadrão Google Jules (⚡ Bolt, 🛡️ Sentinel, 🎨 Palette,
  🧪 Radar e 🧹 Janitor). Use esta skill para executar a revisão e evolução diária
  completa do projeto flight_planner avaliando Performance, Segurança, UX/Acessibilidade,
  Testes Automatizados, Clean Code e Code Health.
---

# 🚀 Orquestrador Diário — Esquadrão Google Jules (`jules-daily-squad`)

Esta skill coordena a execução diária dos **5 agentes especialistas** do projeto `flight_planner`:

1. **⚡ Bolt** ([`.agents/skills/jules-bolt/SKILL.md`](../jules-bolt/SKILL.md)) — Performance & Otimização
2. **🛡️ Sentinel** ([`.agents/skills/jules-sentinel/SKILL.md`](../jules-sentinel/SKILL.md)) — Segurança & AppSec
3. **🎨 Palette** ([`.agents/skills/jules-palette/SKILL.md`](../jules-palette/SKILL.md)) — UX & Acessibilidade (WCAG)
4. **🧪 Radar** ([`.agents/skills/jules-radar/SKILL.md`](../jules-radar/SKILL.md)) — Testes Automatizados & Cobertura
5. **🧹 Janitor** ([`.agents/skills/jules-janitor/SKILL.md`](../jules-janitor/SKILL.md)) — Clean Code & Code Health

## Fluxo de Execução do Orquestrador

### Passo 1: Verificação Inicial do Repositório
1. No diretório `/Users/taiolor/.gemini/antigravity/scratch/flight_planner`, verifique o status do Git (`git status --short`) e a saúde de base rodando:
   - `pnpm check`
   - `pnpm test`

### Passo 2: Acionamento dos 5 Agentes Especialistas
Para cada uma das 5 frentes (ou delegando para subagentes via `invoke_subagent` quando disponível):

1. **Leia o diário correspondente em `.Jules/<agente>.md`** (`bolt.md`, `sentinel.md`, `palette.md`, `radar.md`, `janitor.md`) e a skill `.agents/skills/jules-<agente>/SKILL.md`.
2. **Audite o código** e selecione **1 melhoria cirúrgica, atômica e de alto impacto** para aquela disciplina (sem conflitar com os arquivos editados pelos outros agentes na mesma rodada).
3. **Aplique a melhoria** no código e atualize o respectivo diário `.Jules/<agente>.md` com a data atual (`## YYYY-MM-DD - Título`), `**Learning:**` e `**Action:**` (ou `**Vulnerability:**`/`**Prevention:**` para o Sentinel).
4. **Valide cada melhoria** executando `pnpm check` e `pnpm test`.

### Passo 3: Entrega Estilo Google Jules (Branches / Commits / PRs)
- Para cada agente que realizou uma melhoria validada:
  - Se o fluxo de PRs via GitHub CLI (`gh pr create`) estiver disponível e autenticado, crie uma branch dedicada (`<agente>/<slug-da-melhoria>`), faça o commit com o emoji e nome do agente (`⚡ Bolt:`, `🛡️ Sentinel:`, `🎨 Palette:`, `🧪 Radar:`, `🧹 Janitor:`), faça push e abra o Pull Request retornando depois à branch base.
  - Caso o repositório esteja sendo operado localmente ou sem conectividade de rede no momento da execução agendada, crie commits atômicos separados para cada agente ou mantenha as branches locais prontas para revisão e merge.

### Passo 4: Relatório Executivo Diário
Ao finalizar a rodada dos 5 agentes, apresente um resumo executivo estruturado em Markdown contendo:
- Tabela resumo com os 5 agentes (**⚡ Bolt**, **🛡️ Sentinel**, **🎨 Palette**, **🧪 Radar**, **🧹 Janitor**), o arquivo/módulo aprimorado, o impacto da mudança e o status dos testes (`pnpm check` & `pnpm test`).
- Links diretos para os arquivos modificados e para os diários atualizados em `.Jules/`.
