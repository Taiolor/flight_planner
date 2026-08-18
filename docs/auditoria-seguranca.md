# Auditoria profunda de segurança da informação — Smart Fly

**Data:** 18 de agosto de 2026  
**Escopo:** código cliente e servidor, contratos tRPC, autenticação, autorização, dependências, segredos, integrações externas, tarefas automáticas, cabeçalhos e validações dinâmicas não invasivas do domínio publicado.

## Síntese executiva

O Smart Fly possui uma base de segurança funcional: sessões internas protegidas por cookie `HttpOnly` com `SameSite=Lax`, HTTPS com HSTS, limites de taxa, validação Zod em contratos relevantes, mascaramento de erros internos em produção e controle anual de dados. A validação dinâmica confirmou que rotas protegidas rejeitam acessos sem sessão e que campos de voo mais sensíveis são redigidos no endpoint público. [1](#evidências-da-auditoria)

O risco prioritário está na **cadeia de dependências**. A auditoria encontrou **3 vulnerabilidades altas, 20 moderadas e 5 baixas** em dependências de produção transitivas. Também há oportunidades concretas de endurecimento: a política CSP permite incorporação por qualquer origem, procedimentos administrativos usam a sessão funcional em vez de uma autorização administrativa explícita, e alguns fluxos de API aceitam campos livres que são posteriormente interpolados em HTML de e-mail. [1](#evidências-da-auditoria)

> Esta é uma auditoria defensiva de SAST, revisão de API e DAST passivo. Ela não realizou exploração, força bruta, enumeração agressiva, alteração de dados nem teste de penetração autenticado por múltiplos perfis.

## Metodologia e cobertura

O trabalho combinou revisão estática de código, análise de dependências com `pnpm audit --prod`, busca sem exposição de valores para padrões de segredo, leitura dos controles de autenticação e autorização, inspeção de rotas e contratos, e verificações HTTP passivas no ambiente publicado. O escopo de API abrangeu `flightAuth`, `flights`, `push`, `adminNotifications`, `quotes`, `financial` e callbacks de agendamento.

| Domínio | Técnica | Cobertura | Limite da verificação |
| --- | --- | --- | --- |
| Dependências | SCA/SAST | 560 dependências totais, incluindo transitivas de produção | Não substitui monitoramento contínuo de CVEs |
| Segredos | Varredura estática | Arquivos versionados e regras de `.gitignore` | Não inspeciona valores de variáveis de ambiente |
| Autenticação e API | Revisão estática + DAST passivo | Sessões, rate limit, contratos, dados públicos e rotas protegidas | Não simulou um segundo usuário legítimo |
| Navegador | DAST passivo | TLS, HSTS, CSP, XFO, referrer policy, CORS e cache | Não executou payloads de injeção |
| Integrações | Revisão estática | Resend, RapidAPI, push, storage e heartbeat | Não rotacionou chaves nem alterou provedores |
| Banco e dados | Revisão de schema/helpers | Dados de voo, destinatários, logs e isolamento anual | Não fez dump ou alteração de dados |

O mapeamento usa o **OWASP Top 10:2025**, que inclui controle de acesso, configuração, cadeia de suprimentos, criptografia, injeção, design, autenticação, integridade, logging e tratamento de exceções. Para APIs, a análise também usa o OWASP API Security Top 10:2023, que destaca autorização por objeto/propriedade/função, consumo de recursos, fluxos de negócio e consumo inseguro de serviços externos. [2](#referências) [3](#referências)

## Resultados consolidados

| Severidade | Quantidade | Situação | Ação recomendada |
| --- | ---: | --- | --- |
| Crítica | 0 | Nenhum achado confirmado | Manter revisões preventivas |
| Alta | 3 | Dependências transitivas vulneráveis | Corrigir antes da próxima publicação |
| Média | 5 | CSP, autorização administrativa, encoding de e-mail, consumo de API e dados públicos | Planejar correção no próximo ciclo curto |
| Baixa | 4 | Hardening de erros, proxy, push e observabilidade | Corrigir progressivamente |
| Informativa | 6 | Controles adequados já presentes | Manter e automatizar verificação |

## Achados priorizados

### SEC-01 — Dependências transitivas com vulnerabilidades altas

**Severidade: Alta.** A execução de `pnpm audit --prod` identificou três vulnerabilidades altas, sem críticas. Os componentes atingidos são `path-to-regexp@0.1.12`, usado por Express e express-rate-limit, e `lodash`/`lodash-es@4.17.21`, trazidos por Recharts e pelo caminho `streamdown → mermaid`. As versões corrigidas indicadas pelo relatório são `path-to-regexp >=0.1.13` e `lodash/lodash-es >=4.17.24`. [1](#evidências-da-auditoria)

O risco é majoritariamente de disponibilidade, injeção e poluição de protótipo em bibliotecas transitivas. Mesmo que os caminhos vulneráveis não estejam diretamente expostos pela interface atual, dependências de produção devem permanecer dentro de versões corrigidas. A correção deve começar por uma atualização controlada ou `pnpm.overrides`, seguida de TypeScript, Vitest e nova auditoria de dependências.

| Pacote | Severidade máxima | Origem transitiva | Remediação |
| --- | --- | --- | --- |
| `path-to-regexp@0.1.12` | Alta | Express / express-rate-limit | Atualizar cadeia Express compatível ou aplicar override validado |
| `lodash@4.17.21` | Alta | Recharts | Forçar versão corrigida e testar gráficos |
| `lodash-es@4.17.21` | Alta | Streamdown → Mermaid | Atualizar Streamdown/Mermaid ou aplicar override validado |
| `dompurify@3.3.3` | Moderada | jsPDF e Mermaid | Atualizar para versão corrigida; revalidar PDF e markdown |
| `mermaid@11.16.0` | Moderada | Streamdown | Atualizar/remover se o componente não for usado em produção |

**OWASP:** A03:2025 — Software Supply Chain Failures. [2](#referências)

### SEC-02 — CSP permite incorporação por qualquer origem

**Severidade: Média.** O domínio publicado retorna `X-Frame-Options: SAMEORIGIN`, porém a CSP contém `frame-ancestors *`. Em navegadores modernos, `frame-ancestors` é o controle de referência e a diretiva permissiva pode neutralizar a intenção do cabeçalho de frame. A configuração atual também aceita `connect-src` para qualquer `https:`, `http:`, `ws:` e `wss:`.

A correção recomendada é substituir `frame-ancestors *` por `'self'` — ou por uma allowlist mínima, caso exista uma necessidade comprovada de incorporação — e reduzir `connect-src` aos domínios efetivamente usados. `script-src` e `style-src` devem ser mantidos no menor conjunto possível, documentando exceções como `blob:`, `data:` e `unsafe-inline` quando inevitáveis.

**OWASP:** A02:2025 — Security Misconfiguration. [2](#referências)

### SEC-03 — Funções administrativas não exigem papel administrativo explícito

**Severidade: Média.** O router de notificações administrativas usa `flightProtectedProcedure`, que valida a sessão interna, mas não uma capacidade ou papel administrativo. No modelo atual de uma única conta interna isso não produz uma escalada prática confirmada; entretanto, a separação entre usuário autenticado e administrador não está codificada. Se futuramente houver outro usuário ou compartilhamento de sessão, funções como configuração de notificações, destinatários, histórico e disparos de teste poderão ser acessadas além do necessário.

A correção é introduzir um `flightAdminProcedure` que valide uma allowlist de e-mails administrativos ou uma role persistida, e aplicá-lo a todos os procedimentos de `adminNotifications` e a ações de teste global. Esse controle deve ser validado com testes de autorização negativa.

**OWASP:** A01:2025 — Broken Access Control; API5:2023 — Broken Function Level Authorization. [2](#referências) [3](#referências)

### SEC-04 — Dados de voo públicos devem ser uma decisão explícita de privacidade

**Severidade: Média.** O endpoint público `flights.getWeeks` comprovadamente redige localizadores, números de voo, terminais e pontos quando não há sessão. A verificação dinâmica confirmou os campos redigidos como `null`. Porém, ele ainda expõe semanas, status de emissão, companhias, aeroportos e horários. Para um planejador pessoal, essas informações podem revelar padrões de deslocamento.

Não se trata de bypass confirmado: é uma política atual de produto. Recomenda-se decidir formalmente se o planejamento deve ser público. Se a resposta for não, tornar `getWeeks` protegido elimina exposição de cronograma. Se a resposta for sim, reduzir a resposta pública a dados agregados e documentar a decisão de privacidade.

**OWASP:** API3:2023 — Broken Object Property Level Authorization; A04:2025 — Cryptographic Failures, sob a ótica de proteção de dados. [2](#referências) [3](#referências)

### SEC-05 — Campos livres são interpolados em HTML de e-mail

**Severidade: Média.** A mutation `flights.updateWeekStatus` aceita diversos textos livres e os usa para construir HTML de compartilhamento e notificações. O serviço Resend recebe o HTML diretamente. Como essa mutation requer sessão interna, o risco depende de comprometimento de conta ou erro operacional autorizado, mas a ausência de encoding permite que conteúdo operacional altere o corpo de uma mensagem enviada a destinatários configurados.

A remediação é aplicar encoding contextual de HTML a todos os valores de voo, limitar tamanho e conjunto de caracteres de companhia, localizador, terminal e número de voo, e preferir um renderer de template que faça escaping por padrão. A função que compartilha bilhetes deve receber o mesmo tratamento.

**OWASP:** A05:2025 — Injection; API10:2023 — Unsafe Consumption of APIs. [2](#referências) [3](#referências)

### SEC-06 — Consumo de RapidAPI depende de contador não transacional

**Severidade: Média.** O fluxo de cotações lê o uso mensal, chama o provedor externo, incrementa o contador e grava o resultado. Em concorrência, duas requisições autenticadas podem observar saldo disponível e ultrapassar a franquia paga antes que o contador seja atualizado. Há proteção de sessão e rate limit geral, mas não há reserva atômica de quota nem limite específico por procedimento caro.

A correção recomendada é realizar uma reserva condicional e transacional antes da chamada externa, com rollback/registro de falha quando aplicável. Acrescente um rate limit específico para `quotes.fetchFromApi`, um timeout/abort controller para o fetch externo e limite de tamanho na resposta bruta persistida.

**OWASP:** API4:2023 — Unrestricted Resource Consumption; API6:2023 — Unrestricted Access to Sensitive Business Flows. [3](#referências)

### SEC-07 — Callback de tarefa automática devolve mensagem interna em erros

**Severidade: Baixa.** O callback agendado autentica o chamador pela identidade cron e exige `taskUid`, o que é um controle positivo. Em caso de exceção, porém, a resposta 500 inclui a mensagem original e contexto de URL. Embora o endpoint seja destinado ao scheduler, falhas de autenticação ou caminhos inesperados não deveriam devolver detalhes operacionais ao cliente.

A remediação é registrar o erro detalhado apenas no servidor e retornar um objeto genérico, por exemplo `{ error: "scheduled-job-failed" }`, com um identificador de correlação. O comportamento deve seguir o mesmo princípio já aplicado ao formatter tRPC em produção.

**OWASP:** A10:2025 — Mishandling of Exceptional Conditions; A09:2025 — Security Logging and Alerting Failures. [2](#referências)

### SEC-08 — Assinaturas push possuem operações públicas por endpoint

**Severidade: Baixa.** `push.unsubscribe` e `push.checkSubscription` são públicos e aceitam endpoint de assinatura. Um terceiro que obtenha o endpoint poderia consultar a existência da assinatura ou removê-la. O endpoint não é normalmente adivinhável, então o risco é limitado, mas o fluxo não vincula assinaturas a uma sessão/usuário no banco.

Recomenda-se proteger desinscrição e verificação com a sessão interna ou associar a assinatura a um identificador de dispositivo gerado pelo cliente e validado no servidor. Esse ajuste também melhora auditoria e suporte a múltiplos usuários no futuro.

**OWASP:** API1:2023 — Broken Object Level Authorization; API3:2023 — Broken Object Property Level Authorization. [3](#referências)

## Controles positivos confirmados

| Controle | Evidência | Relevância |
| --- | --- | --- |
| Sessão interna | Cookie `HttpOnly`, `SameSite=Lax`, `Secure` condicionado ao proxy HTTPS e expiração de 8 horas | Protege sessão contra leitura por JavaScript e reduz CSRF comum |
| Login | Comparação com `timingSafeEqual`, validação Zod e limitador específico | Reduz enumeração e tentativas repetidas |
| API protegida | `getPrices` e `adminNotifications.getStatus` devolveram `UNAUTHORIZED` sem sessão | Confirma o caminho de controle de acesso |
| Redação pública | Localizadores e números de voo foram devolvidos como `null` sem sessão | Reduz exposição de PNR e identificadores de viagem |
| Transporte | HSTS, `nosniff`, `no-referrer`, HTTPS e Helmet ativos | Reduz risco de downgrade e MIME sniffing |
| Erros tRPC | Produção remove stack e mascara `INTERNAL_SERVER_ERROR` | Limita vazamento de detalhes internos |
| Segredos | Não foram encontrados padrões fortes em arquivos versionados; `.env*` está ignorado | Reduz risco de vazamento no repositório |
| Agendamento | Callback exige identidade cron e tarefa válida; logs de execução mostram funcionamento idempotente | Protege o job contra chamadas públicas diretas |

## Matriz OWASP

| Referência | Estado | Achados ou controles |
| --- | --- | --- |
| A01:2025 — Broken Access Control | Atenção | SEC-03, SEC-04, SEC-08; sessões protegem mutações principais |
| A02:2025 — Security Misconfiguration | Atenção | SEC-02; Helmet, HSTS e `nosniff` presentes |
| A03:2025 — Software Supply Chain Failures | Prioridade alta | SEC-01; 3 altas e 20 moderadas em dependências transitivas |
| A04:2025 — Cryptographic Failures | Parcialmente adequado | HTTPS/HSTS e cookies seguros; decisão de privacidade dos dados públicos pendente |
| A05:2025 — Injection | Atenção | SEC-05; não foram encontrados `eval` ou execução dinâmica |
| A06:2025 — Insecure Design | Atenção | Papel administrativo, política de dados públicos e reserva de quota precisam ser explícitos |
| A07:2025 — Authentication Failures | Adequado com evolução | Rate limit, Zod e comparação timing-safe; migrar senha única para hash forte/gestão de identidade ao ampliar usuários |
| A08:2025 — Software or Data Integrity Failures | Atenção | Integridade da supply chain exige atualização; callback cron autentica origem |
| A09:2025 — Security Logging and Alerting Failures | Parcialmente adequado | Há logs e job idempotente; adicionar correlação e retenção operacional |
| A10:2025 — Mishandling of Exceptional Conditions | Atenção | SEC-07; tRPC já mascara erros internos em produção |

## Plano de remediação

| Prazo | Ação | Critério de aceite |
| --- | --- | --- |
| Imediato | Atualizar/forçar dependências corrigidas de `path-to-regexp`, `lodash`, `lodash-es`, `dompurify`, Mermaid e árvore Streamdown | `pnpm audit --prod` sem vulnerabilidades altas; TypeScript e Vitest aprovados |
| Imediato | Restringir `frame-ancestors` e `connect-src` na CSP | Cabeçalhos confirmam allowlist mínima e iframe externo é bloqueado |
| Curto | Criar `flightAdminProcedure` e aplicá-lo às funções administrativas | Teste com sessão não administrativa retorna `FORBIDDEN` |
| Curto | Fazer escaping/validação de campos interpolados em e-mails | Testes comprovam que texto com caracteres HTML é renderizado literalmente |
| Curto | Criar reserva atômica e rate limit próprio para RapidAPI | Chamadas concorrentes não excedem quota mensal configurada |
| Médio | Escolher política de privacidade para semanas públicas | Endpoint público reduzido ou protegido, com teste de regressão |
| Médio | Proteger operações de push por sessão/dispositivo | Endpoint de terceiro não remove ou enumera assinaturas |
| Médio | Padronizar erros de callbacks e criar IDs de correlação | Resposta externa genérica; log interno rastreável |
| Contínuo | Integrar SCA, secret scan e DAST passivo na CI | PR bloqueado quando introduzir alta criticidade ou segredo |

## Programa mínimo de segurança recomendado

O OWASP ASVS fornece uma base de requisitos verificáveis para aplicações web e serviços. Para o Smart Fly, o objetivo realista é usar ASVS como checklist de evolução, sem declarar certificação: autenticação e sessões, controle de acesso, validação/encoding, logging, dependências e configuração devem ter casos de teste automatizados. [4](#referências)

A cada release, execute TypeScript, Vitest, `pnpm audit --prod`, varredura de segredos sem expor valores e revisão de cabeçalhos publicados. A cada alteração de rota ou integração, inclua teste de autorização negativa. A cada trimestre, reavalie dependências e faça uma DAST passiva autenticada com conta de menor privilégio, quando esse modelo de conta existir.

## Evidências da auditoria

| Fonte | Resultado |
| --- | --- |
| SCA | `pnpm audit --prod`: 3 altas, 20 moderadas, 5 baixas, 0 críticas; 560 dependências totais |
| Segredos | Nenhum padrão forte encontrado em arquivos versionados; `.env`, `.env.local`, `.env.*.local` ignorados |
| SAST | Sem `eval`, `new Function`, `document.write` ou SQL bruto interpolado encontrados; dois sinks analisados de HTML estão no PDF e no componente de gráficos |
| DAST passivo | `flights.getPrices` e `adminNotifications.getStatus` retornaram `UNAUTHORIZED` sem sessão; `flights.getWeeks` redigiu localizador e número de voo |
| Cabeçalhos | HSTS, CSP, `nosniff`, `no-referrer` e XFO presentes; CSP com `frame-ancestors *` e fontes de conexão amplas |
| Código | Rate limiting geral e de login, cookies seguros, formatter tRPC, autenticação cron e isolamento anual confirmados |

## Referências

[1]: Evidências internas desta auditoria: comandos SCA/SAST/DAST não invasivos, revisão de código e cabeçalhos capturados em 18 de agosto de 2026.
[2]: [OWASP Top 10:2025](https://owasp.org/Top10/2025/en/) — categorias atuais de riscos de aplicações web.
[3]: [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — riscos de autorização, consumo de recursos e integrações de API.
[4]: [OWASP Application Security Verification Standard 5.0](https://owasp.org/www-project-application-security-verification-standard/) — base de requisitos verificáveis de segurança.
