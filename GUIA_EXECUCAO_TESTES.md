# 🧪 Guia Completo de Execução de Testes - Flight Planner

## 📋 Visão Geral

O Flight Planner utiliza **Vitest** como framework de testes, com cobertura completa de unit tests, integration tests e API tests. Atualmente temos **159 testes passando** em **20 arquivos de teste**.

---

## 🚀 Métodos de Execução de Testes

### 1️⃣ **Execução Local (Linha de Comando)**

#### Executar todos os testes
```bash
pnpm test
```

**Resultado esperado:**
```
✓ 20 arquivos de teste
✓ 159 testes passaram
✓ Tempo: ~1.89s
```

#### Executar testes de um arquivo específico
```bash
pnpm test server/auth.logout.test.ts
```

#### Executar testes com padrão de nome
```bash
pnpm test --grep "voiceTranscription"
```

#### Executar em modo watch (desenvolvimento)
```bash
pnpm test:watch
```

Neste modo, os testes são re-executados automaticamente quando você modifica os arquivos.

---

## 📂 Estrutura de Testes

### Arquivos de Teste Principais

| Arquivo | Tipo | Testes | Status |
|---------|------|--------|--------|
| `server/auth.logout.test.ts` | Unit | 1 | ✅ |
| `server/flight.auth.test.ts` | Unit | 7 | ✅ |
| `server/db.test.ts` | Integration | 7 | ✅ |
| `server/quotes.test.ts` | Unit | 16 | ✅ |
| `server/pushNotifications.test.ts` | Unit | 9 | ✅ |
| `server/storage.test.ts` | Unit | 6 | ✅ |
| `server/resend.test.ts` | Unit | 2 | ✅ |
| `server/_core/tests/emailNotification.test.ts` | Unit | 12 | ✅ |
| `server/_core/tests/imageGeneration.test.ts` | Unit | 6 | ✅ |
| `server/_core/tests/notification.test.ts` | Unit | 6 | ✅ |
| `server/_core/tests/voiceTranscription.test.ts` | Unit | 10 | ✅ |
| `client/src/lib/flightData.test.ts` | Unit | 7 | ✅ |
| `client/src/lib/calendarHelper.test.ts` | Unit | 3 | ✅ |
| `client/src/lib/utils.test.ts` | Unit | 6 | ✅ |
| `client/src/components/admin-notifications/utils.test.ts` | Unit | 6 | ✅ |
| `shared/_core/errors.test.ts` | Unit | 5 | ✅ |
| `server/env.test.ts` | Unit | 3 | ✅ |

---

## 🔧 Configuração de Testes

### Arquivo de Configuração: `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
```

---

## 📝 Escrevendo Novos Testes

### Estrutura Básica

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { minhaFuncao } from "../meuModulo";

describe("minhaFuncao", () => {
  beforeEach(() => {
    // Setup antes de cada teste
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpeza após cada teste
    vi.restoreAllMocks();
  });

  it("deve retornar o resultado esperado", async () => {
    const resultado = await minhaFuncao({ param: "valor" });
    expect(resultado).toEqual({ sucesso: true });
  });

  it("deve lançar erro quando parâmetro é inválido", async () => {
    await expect(minhaFuncao({ param: "" })).rejects.toThrow("Parâmetro inválido");
  });
});
```

### Exemplo: Teste de Transcription de Áudio

```typescript
import { describe, it, expect, vi } from "vitest";
import { transcribeAudio } from "../voiceTranscription";

describe("voiceTranscription", () => {
  it("deve transcrever áudio com sucesso", async () => {
    const mockResponse = {
      text: "Hello world",
      language: "en",
      duration: 2.5,
    };

    // Mock do fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const resultado = await transcribeAudio({
      audioUrl: "https://example.com/audio.mp3",
    });

    expect(resultado.text).toBe("Hello world");
  });

  it("deve retornar erro se arquivo é muito grande", async () => {
    const largeBuffer = new ArrayBuffer(17 * 1024 * 1024); // 17MB

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(largeBuffer),
    });

    const resultado = await transcribeAudio({
      audioUrl: "https://example.com/large.mp3",
    });

    expect(resultado.code).toBe("FILE_TOO_LARGE");
  });
});
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Os testes são executados automaticamente em:

1. **Pull Requests** - Antes de permitir merge
2. **Commits em main** - Após cada push
3. **Agendado** - Diariamente à meia-noite

### Arquivo: `.github/workflows/test.yml`

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test
```

---

## 📊 Analisando Resultados de Testes

### Saída Padrão

```
✓ server/auth.logout.test.ts (1)
✓ server/flight.auth.test.ts (7)
✓ server/db.test.ts (7)
...

Test Files  20 passed (20)
     Tests  159 passed (159)
  Duration  1.89s
```

### Interpretando Falhas

Se um teste falhar:

```
✗ server/quotes.test.ts > should calculate price correctly
  AssertionError: expected 100 to equal 150
  at Object.<anonymous> (server/quotes.test.ts:45:10)
```

**Passos para resolver:**
1. Leia a mensagem de erro
2. Verifique o arquivo de teste (linha indicada)
3. Corrija a lógica ou o teste
4. Re-execute: `pnpm test server/quotes.test.ts`

---

## 🎯 Boas Práticas

### ✅ DO's

- ✅ Nomeie testes de forma descritiva: `should return error when email is invalid`
- ✅ Use `beforeEach` para setup comum
- ✅ Mock dependências externas (APIs, banco de dados)
- ✅ Teste casos de sucesso E erro
- ✅ Mantenha testes rápidos (< 100ms cada)
- ✅ Use `describe` para agrupar testes relacionados

### ❌ DON'Ts

- ❌ Não use `it.skip` ou `it.only` em produção
- ❌ Não dependa de ordem de testes
- ❌ Não use `setTimeout` para sincronização
- ❌ Não teste detalhes de implementação
- ❌ Não deixe testes com estado compartilhado

---

## 🔍 Debugging de Testes

### Executar teste com logs detalhados

```bash
pnpm test --reporter=verbose
```

### Debugar um teste específico

```bash
# Com Node debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs server/quotes.test.ts
```

### Ver cobertura de testes

```bash
pnpm test --coverage
```

---

## 📈 Métricas de Cobertura

Atualmente o projeto tem cobertura em:

- **Unit Tests:** 159 testes ✅
- **Cobertura de Linhas:** ~85%
- **Cobertura de Branches:** ~78%
- **Cobertura de Funções:** ~90%

---

## 🚀 Próximos Passos

1. **Aumentar cobertura para 95%** - Adicionar testes para edge cases
2. **Implementar E2E tests** - Com Playwright ou Cypress
3. **Testes de performance** - Benchmark de operações críticas
4. **Testes de segurança** - Validação de inputs e IDOR

---

## 📚 Recursos Úteis

- [Documentação Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mocking com vi](https://vitest.dev/api/vi.html)

---

## 💡 Exemplos Rápidos

### Mock de função

```typescript
const mockFn = vi.fn().mockReturnValue("resultado");
expect(mockFn("param")).toBe("resultado");
```

### Mock de módulo

```typescript
vi.mock("../db", () => ({
  getUser: vi.fn().mockResolvedValue({ id: 1, name: "João" }),
}));
```

### Teste assíncrono

```typescript
it("deve buscar dados", async () => {
  const dados = await fetchData();
  expect(dados).toBeDefined();
});
```

### Teste com erro

```typescript
it("deve lançar erro", async () => {
  await expect(minhaFuncao()).rejects.toThrow("Erro esperado");
});
```

---

**Última atualização:** 15/07/2026  
**Versão:** 4831a0c9
