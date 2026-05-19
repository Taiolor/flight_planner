# Smart Fly — Guia de Deploy

> **Repositório:** https://github.com/Taiolor/flight_planner  
> **Stack:** React 19 + Vite + Express 4 + tRPC 11 + Drizzle ORM + MySQL  
> **Versão atual (main):** commit `e2708512`

---

## Pré-requisitos

| Ferramenta   | Versão mínima | Instalação                   |
| ------------ | ------------- | ---------------------------- |
| Node.js      | 20.x          | https://nodejs.org           |
| pnpm         | 9.x           | `npm install -g pnpm`        |
| Git          | qualquer      | https://git-scm.com          |
| MySQL / TiDB | 8.x           | ou use um serviço gerenciado |

---

## Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na raiz do projeto com os seguintes valores. **Nunca commite este arquivo.**

```dotenv
# ── Banco de dados ────────────────────────────────────────────────────────────
DATABASE_URL=mysql://usuario:senha@host:3306/nome_do_banco

# ── Autenticação (Manus OAuth) ────────────────────────────────────────────────
JWT_SECRET=string_aleatoria_longa_e_segura
VITE_APP_ID=id_do_app_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=open_id_do_dono

# ── Manus Forge API (LLM, Storage, Notificações) ─────────────────────────────
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=chave_server_side
VITE_FRONTEND_FORGE_API_KEY=chave_frontend
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# ── Push Notifications (VAPID) ────────────────────────────────────────────────
VAPID_PUBLIC_KEY=sua_chave_publica_vapid
VAPID_PRIVATE_KEY=sua_chave_privada_vapid

# ── E-mail (Resend) ───────────────────────────────────────────────────────────
RESEND_API_KEY=sua_chave_resend

# ── Opcional ──────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

> **Como gerar chaves VAPID:**
>
> ```bash
> pnpm exec web-push generate-vapid-keys
> ```

---

## Deploy com o Script Automatizado

O script `deploy.sh` na raiz do repositório realiza todo o processo em um único comando.

### Uso básico

```bash
# 1. Clonar o repositório (se ainda não tiver)
git clone https://github.com/Taiolor/flight_planner.git
cd flight_planner

# 2. Configurar variáveis de ambiente
cp .env.example .env   # se existir, ou criar manualmente
# editar .env com os valores corretos

# 3. Exportar variáveis para o shell
export $(cat .env | grep -v '^#' | xargs)

# 4. Executar o deploy
bash deploy.sh
```

### Opções disponíveis

| Flag          | Descrição                                                             |
| ------------- | --------------------------------------------------------------------- |
| `--skip-db`   | Pula as migrations do banco (útil quando o schema já está atualizado) |
| `--skip-test` | Pula a execução dos testes automatizados                              |

```bash
# Exemplo: deploy rápido sem testes
bash deploy.sh --skip-test

# Exemplo: atualizar apenas o código, sem tocar no banco
bash deploy.sh --skip-db --skip-test
```

---

## Deploy Manual (Passo a Passo)

Caso prefira executar cada etapa individualmente:

```bash
# 1. Clonar / atualizar código
git clone https://github.com/Taiolor/flight_planner.git
cd flight_planner
# ou, se já clonado:
git fetch origin main && git reset --hard origin/main

# 2. Instalar dependências
pnpm install --frozen-lockfile

# 3. Aplicar migrations do banco de dados
pnpm db:push

# 4. Executar testes
pnpm test

# 5. Build de produção
NODE_ENV=production pnpm build

# 6. Iniciar servidor
NODE_ENV=production PORT=3000 node dist/index.js
```

---

## Estrutura do Build

Após `pnpm build`, a pasta `dist/` contém:

```
dist/
  index.js        ← Servidor Express compilado (ESM bundle)
  assets/         ← Frontend React compilado (JS/CSS com hash)
  index.html      ← Entry point do frontend
```

O servidor Express serve o frontend estático automaticamente em produção.

---

## Verificação Pós-Deploy

```bash
# Checar se o servidor está respondendo
curl -s http://localhost:3000/api/trpc/auth.me | python3 -m json.tool

# Checar se o frontend carrega
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Esperado: 200
```

---

## Solução de Problemas

| Problema                      | Causa provável         | Solução                                                |
| ----------------------------- | ---------------------- | ------------------------------------------------------ |
| `DATABASE_URL is required`    | Variável não exportada | `export $(cat .env \| grep -v '^#' \| xargs)`          |
| `ECONNREFUSED` no banco       | Banco não acessível    | Verificar host, porta e credenciais no `DATABASE_URL`  |
| Página em branco após deploy  | Build desatualizado    | Rodar `pnpm build` novamente                           |
| Push notifications não chegam | Chaves VAPID inválidas | Regenerar com `pnpm exec web-push generate-vapid-keys` |
| Erro de CORS no OAuth         | URL de callback errada | Verificar `VITE_OAUTH_PORTAL_URL` e `OAUTH_SERVER_URL` |
| E-mail não enviado            | RESEND_API_KEY inválida | Verificar chave em https://resend.com/api-keys         |

---

## Informações do Projeto

- **Domínio publicado:** https://flightplan-hq655wm9.manus.space
- **Banco de dados:** MySQL/TiDB com 14 migrations aplicadas
- **Autenticação:** Manus OAuth
- **E-mail:** Resend (plano gratuito: 3.000 e-mails/mês)
- **PWA:** Manifesto configurado, Service Worker ativo, ícones em CDN
- **Push Notifications:** VAPID configurado, job agendado a cada hora
