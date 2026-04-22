#!/usr/bin/env bash
# =============================================================================
#  Smart Fly — Script de Deploy Completo
#  Repositório: https://github.com/Taiolor/flight_planner
#  Uso: bash deploy.sh [--skip-db] [--skip-test]
# =============================================================================
set -euo pipefail

# ─── Cores para output ───────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}━━━ $* ━━━${RESET}"; }

# ─── Flags ───────────────────────────────────────────────────────────────────
SKIP_DB=false
SKIP_TEST=false
for arg in "$@"; do
  case $arg in
    --skip-db)   SKIP_DB=true ;;
    --skip-test) SKIP_TEST=true ;;
  esac
done

# ─── Diretório do projeto ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Diretório do projeto: $SCRIPT_DIR"

# =============================================================================
# PASSO 1 — Verificar pré-requisitos
# =============================================================================
step "Verificando pré-requisitos"

command -v node  >/dev/null 2>&1 || error "Node.js não encontrado. Instale Node.js >= 20."
command -v pnpm  >/dev/null 2>&1 || error "pnpm não encontrado. Execute: npm install -g pnpm"
command -v git   >/dev/null 2>&1 || error "git não encontrado."

NODE_VER=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[[ "$NODE_MAJOR" -ge 20 ]] || error "Node.js >= 20 necessário. Versão atual: $NODE_VER"

success "Node.js $(node --version) | pnpm $(pnpm --version) | git $(git --version | awk '{print $3}')"

# =============================================================================
# PASSO 2 — Verificar variáveis de ambiente obrigatórias
# =============================================================================
step "Verificando variáveis de ambiente"

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "VITE_APP_ID"
  "OAUTH_SERVER_URL"
  "VITE_OAUTH_PORTAL_URL"
  "OWNER_OPEN_ID"
  "BUILT_IN_FORGE_API_URL"
  "BUILT_IN_FORGE_API_KEY"
  "VITE_FRONTEND_FORGE_API_KEY"
  "VITE_FRONTEND_FORGE_API_URL"
  "VAPID_PUBLIC_KEY"
  "VAPID_PRIVATE_KEY"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  error "Variáveis de ambiente ausentes:\n$(printf '  • %s\n' "${MISSING[@]}")\n\nCrie um arquivo .env na raiz do projeto com esses valores e execute:\n  export \$(cat .env | xargs)"
fi

success "Todas as variáveis de ambiente estão configuradas."

# =============================================================================
# PASSO 3 — Atualizar código do repositório
# =============================================================================
step "Atualizando código do repositório Git"

REPO_URL="https://github.com/Taiolor/flight_planner.git"
BRANCH="main"

if [[ -d ".git" ]]; then
  info "Repositório já existe. Fazendo pull da branch $BRANCH..."
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  success "Código atualizado para o commit: $(git rev-parse --short HEAD)"
else
  info "Clonando repositório $REPO_URL..."
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" .
  success "Repositório clonado. Commit: $(git rev-parse --short HEAD)"
fi

# =============================================================================
# PASSO 4 — Instalar dependências
# =============================================================================
step "Instalando dependências (pnpm install)"

pnpm install --frozen-lockfile
success "Dependências instaladas."

# =============================================================================
# PASSO 5 — Migrations do banco de dados
# =============================================================================
if [[ "$SKIP_DB" == false ]]; then
  step "Executando migrations do banco de dados (drizzle-kit)"

  info "Gerando migrations..."
  pnpm exec drizzle-kit generate

  info "Aplicando migrations..."
  pnpm exec drizzle-kit migrate

  success "Banco de dados atualizado com sucesso."
else
  warn "Migrations ignoradas (--skip-db)."
fi

# =============================================================================
# PASSO 6 — Executar testes
# =============================================================================
if [[ "$SKIP_TEST" == false ]]; then
  step "Executando testes (vitest)"

  pnpm test
  success "Todos os testes passaram."
else
  warn "Testes ignorados (--skip-test)."
fi

# =============================================================================
# PASSO 7 — Build de produção
# =============================================================================
step "Gerando build de produção"

NODE_ENV=production pnpm build
success "Build gerado em ./dist/"

# =============================================================================
# PASSO 8 — Iniciar servidor (produção)
# =============================================================================
step "Iniciando servidor em modo produção"

PORT="${PORT:-3000}"
info "Iniciando na porta $PORT..."

NODE_ENV=production PORT="$PORT" node dist/index.js &
SERVER_PID=$!

# Aguardar o servidor subir (até 15 segundos)
RETRIES=15
until curl -sf "http://localhost:$PORT/api/trpc/auth.me" -o /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    error "Servidor não respondeu após 15 segundos. Verifique os logs acima."
  fi
  sleep 1
done

success "Servidor rodando na porta $PORT (PID: $SERVER_PID)"

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   Smart Fly — Deploy concluído com sucesso!  ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}URL:${RESET}    http://localhost:$PORT"
echo -e "  ${BOLD}Commit:${RESET} $(git rev-parse --short HEAD)"
echo -e "  ${BOLD}PID:${RESET}    $SERVER_PID"
echo ""
echo -e "  Para parar o servidor: ${YELLOW}kill $SERVER_PID${RESET}"
echo -e "  Para logs em tempo real: ${YELLOW}NODE_ENV=production node dist/index.js${RESET}"
echo ""
