# 🎯 Plano de Ação: Resolução de Conflitos de PRs Pendentes

**Data:** 13/07/2026  
**Status:** Em execução  
**Prioridade:** CRÍTICA (Segurança)

---

## 📊 Resumo das PRs com Conflitos

| PR   | Título                                                    | Tipo           | Criticidade | Conflitos  |
| ---- | --------------------------------------------------------- | -------------- | ----------- | ---------- |
| #182 | 🛡️ Sentinel: [HIGH] Fix IDOR in getWeeks endpoint         | Segurança      | 🔴 CRÍTICA  | 4 arquivos |
| #180 | 🧹 Remove leftover console.log in push notifications      | Code Health    | 🟡 MÉDIA    | TBD        |
| #175 | 🎨 Palette: Improve accessibility of interactive elements | Acessibilidade | 🟢 BAIXA    | TBD        |

---

## 🔴 PR #182 - CRÍTICA (Segurança)

### Vulnerabilidade

**IDOR (Insecure Direct Object Reference)** no endpoint `getWeeks`

- Usuários não autenticados conseguem acessar dados sensíveis (localizadores, pontos)
- Problema: endpoint público retorna objetos completos do banco sem filtro

### Solução Implementada

1. Verificação de autenticação via `getSessionFromCookie(ctx.req)`
2. Redação de campos sensíveis para usuários não autenticados
3. Documentação em `.Jules/sentinel.md`

### Arquivos com Conflito

#### 1️⃣ `.Jules/palette.md` (RENOMEADO para `.jules/palette.md`)

**Conflito:** Arquivo foi renomeado de maiúscula para minúscula

```
Antes: .Jules/palette.md
Depois: .jules/palette.md
```

**Resolução:** Manter a versão minúscula (`.jules/palette.md`)

#### 2️⃣ `client/public/__manus__/version.json`

**Conflito:** Versão desatualizada vs. versão atual

```
PR #182:  "version": "30a4109e"
Main:     "version": "c1564c5"
```

**Resolução:** Usar versão de main (`c1564c5`)

#### 3️⃣ `plan.md`

**Conflito:** Mudanças no plano de projeto
**Resolução:** Manter versão de main (mais recente)

#### 4️⃣ `pr_description.md`

**Conflito:** Descrição de PR desatualizada
**Resolução:** Manter versão de main

### Arquivos Modificados (SEM CONFLITO)

- ✅ `server/routers.ts` - Fix IDOR (19 adições, 2 deleções)
- ✅ `client/src/pages/Home.tsx` - Melhorias UX (82 adições, 14 deleções)
- ✅ `client/src/pages/FlightQuotes.tsx` - Melhorias (14 adições, 3 deleções)
- ✅ `.Jules/sentinel.md` - Nova documentação (5 linhas)
- ✅ `.jules/bolt.md` - Atualização (1 linha)

---

## 📋 Plano de Execução

### Fase 1: Resolver PR #182 (Segurança - CRÍTICA)

**Tempo estimado:** 15 minutos

**Passos:**

1. ✅ Fazer checkout da branch da PR #182
2. ✅ Rebase com main para trazer conflitos
3. ✅ Resolver conflitos:
   - Deletar `.Jules/palette.md` (versão antiga)
   - Manter `.jules/palette.md` (versão nova)
   - Usar version.json de main
   - Usar plan.md de main
   - Usar pr_description.md de main
4. ✅ Fazer commit de resolução
5. ✅ Force-push para atualizar PR
6. ✅ Fazer merge via GitHub

**Comando:**

```bash
cd /home/ubuntu/flight_planner
gh pr checkout 182
git rebase user_github/main
# Resolver conflitos manualmente
git add .
git rebase --continue
git push user_github HEAD:$(git rev-parse --abbrev-ref HEAD) --force-with-lease
gh pr merge 182 --squash
```

### Fase 2: Resolver PR #180 (Code Health - MÉDIA)

**Tempo estimado:** 10 minutos

**Passos:**

1. Fazer checkout da branch da PR #180
2. Rebase com main
3. Resolver conflitos (provavelmente em `server/pushNotifications.ts`)
4. Fazer merge

### Fase 3: Resolver PR #175 (Acessibilidade - BAIXA)

**Tempo estimado:** 10 minutos

**Passos:**

1. Fazer checkout da branch da PR #175
2. Rebase com main
3. Resolver conflitos
4. Fazer merge

---

## ✅ Checklist de Execução

- [ ] **Fase 1: PR #182**
  - [ ] Checkout branch
  - [ ] Rebase com main
  - [ ] Resolver conflito `.Jules/palette.md` (deletar versão antiga)
  - [ ] Resolver conflito `version.json` (usar main)
  - [ ] Resolver conflito `plan.md` (usar main)
  - [ ] Resolver conflito `pr_description.md` (usar main)
  - [ ] Commit de resolução
  - [ ] Force-push
  - [ ] Merge via GitHub

- [ ] **Fase 2: PR #180**
  - [ ] Checkout branch
  - [ ] Rebase com main
  - [ ] Resolver conflitos
  - [ ] Merge

- [ ] **Fase 3: PR #175**
  - [ ] Checkout branch
  - [ ] Rebase com main
  - [ ] Resolver conflitos
  - [ ] Merge

---

## 📌 Notas Importantes

1. **PR #182 é CRÍTICA** - Vulnerabilidade de segurança deve ser resolvida primeiro
2. **Conflitos são principalmente em metadados** - Versão.json, planos, documentação
3. **Lógica de segurança não tem conflito** - Mudanças em `server/routers.ts` estão limpas
4. **Usar `--force-with-lease`** - Mais seguro que `--force` para evitar sobrescrever mudanças de outros

---

## 🎯 Resultado Esperado

Após execução completo deste plano:

- ✅ 9 PRs mergeadas (6 já feitas + 3 pendentes)
- ✅ Vulnerabilidade IDOR corrigida
- ✅ Código limpo de console.logs
- ✅ Acessibilidade melhorada
- ✅ Performance otimizada

**Status Final:** Repositório limpo e seguro para produção
