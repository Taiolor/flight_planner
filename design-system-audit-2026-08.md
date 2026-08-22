# Auditoria de Design System — Smart Fly

**Data:** 22 de agosto de 2026  
**Escopo:** Home, Gestão de Passagens, Calendário, Cotações, Financeiro, Novidades, Memórias, estados protegidos de Administração, Telemetria, Gemini e página 404.  
**Linguagem recomendada:** azul-marinho como base de produto, superfícies neutras, acentos semânticos pontuais e tipografia Roboto.

> **Conclusão executiva:** a plataforma já possui uma identidade forte e profissional. O azul-marinho atual é o elemento unificador correto. A próxima evolução não deve criar uma nova estética, e sim **reduzir variações locais**, formalizar componentes compartilhados e tornar os fluxos densos mais fáceis de operar no mobile.

## 1. Diagnóstico por tela

| Tela / fluxo | Estado atual observado | Principal oportunidade | Prioridade |
| --- | --- | --- | --- |
| Home | Boa hierarquia operacional e identidade de marca clara. Em mobile, o bloco “Resumo Anual” repete o título no gatilho e no conteúdo. | Reduzir a repetição do título e fortalecer a ação seguinte no painel expandido. | Alta |
| Gestão de Passagens | Estrutura, filtros e navegação por meses estão organizados. | Transformar filtros longos em resumo compacto com abertura progressiva no mobile. | Alta |
| Calendário | Excelente leitura anual e estados de voo reconhecíveis. Em 320 px, a grade de dois meses reduz demais os dias e badges. | Usar uma coluna abaixo de 360 px e manter duas colunas a partir de 375 px. | Crítica |
| Cotações | Hierarquia de rota e status é boa; a lista semanal é funcional. | Aumentar a separação entre metadados, ações e cards para reduzir densidade cognitiva. | Média |
| Financeiro | O contraste dos KPIs foi consolidado em azul-marinho. | Estender o padrão a envelopes, projeções e comparativos, usando acentos apenas para significado. | Média |
| Novidades | Linha do tempo e métricas são claras e têm boa presença editorial. | Criar uma versão mais compacta das métricas e um padrão de release-card reutilizável. | Média |
| Memórias | Estado protegido está claro e seguro. | Unificar o componente de acesso protegido com Financeiro e Administração. | Média |
| Administração, Telemetria e Gemini | Estados protegidos têm boa mensagem e CTA único. | Padronizar tamanho, espaçamento, ícone e linguagem dos cards de acesso. | Média |
| 404 | Cumpre a função, mas foge da linguagem em português e da superfície azul-marinho do produto. | Localizar para PT-BR e usar o mesmo padrão de estado vazio/protegido. | Alta |

## 2. Pontos fortes a preservar

| Elemento | Por que funciona | Diretriz de preservação |
| --- | --- | --- |
| Azul-marinho #071A36 | Comunica confiança, profundidade e organização sem parecer genérico. | Manter como cor de superfície primária, cabeçalhos e cards estratégicos. |
| Navegação inferior mobile | Facilita uso com uma mão e destaca os destinos de maior frequência. | Preservar quatro destinos e garantir área segura para o Fly.IA. |
| Acentos semânticos | Verde, âmbar, violeta e roxo de cancelamento aceleram leitura operacional. | Aplicar sempre com rótulo, ícone ou texto de apoio — nunca apenas pela cor. |
| Cabeçalhos de página | A barra azul-marinho já cria continuidade entre módulos. | Consolidar em um único componente compartilhado. |
| Cards e raios generosos | A interface transmite produto premium e mantém separação visual clara. | Padronizar raios, sombras e espaçamentos em tokens. |

## 3. Recomendações de design system

### 3.1 Consolidar tokens de superfície e contraste

Hoje, o azul-marinho aparece em gradientes e valores locais em diversas telas. A recomendação é criar tokens semânticos em `index.css`, evitando depender de classes de cor isoladas.

| Token proposto | Uso | Valor de referência |
| --- | --- | --- |
| `--surface-app` | Fundo principal de áreas protegidas | `#020617` |
| `--surface-navy` | Cabeçalhos e cards estratégicos | `#071A36` |
| `--surface-navy-raised` | Hover, seleção e superfícies elevadas | `#102F61` |
| `--border-navy` | Bordas em superfícies escuras | `#315C99` |
| `--text-on-navy` | Texto principal em azul-marinho | `#FFFFFF` |
| `--text-on-navy-muted` | Texto secundário em azul-marinho | `#CBD5E1` |
| `--status-cancelled` | Estado cancelado | `#4B0082` |

**Recomendação:** substituir gradientes ciano/roxo decorativos fora de estados semânticos por superfícies navy sólidas ou gradientes navy discretos. Isso reduz ruído e deixa os estados realmente importantes mais visíveis.

### 3.2 Criar componentes compartilhados de alto impacto

| Componente | Aplicação | Benefício |
| --- | --- | --- |
| `AppPageHeader` | Calendário, Cotações, Financeiro, Novidades e telas administrativas | Elimina variações de altura, botão Voltar, seletor anual e ações. |
| `MetricCard` | Home, Financeiro, Telemetria e Novidades | Padroniza contraste, valor numérico, rótulo, ícone e acento semântico. |
| `StatusPill` | Calendário, Gestão, Cotações e Telemetria | Uniformiza Emitido, Cancelado, Remarcado, Futuro e Passado. |
| `AccessGate` | Financeiro, Memórias, Administração, Telemetria e Gemini | Uma experiência de login consistente, segura e reconhecível. |
| `FilterBar` / `FilterDrawer` | Gestão, Calendário, Cotações e Telemetria | Mantém filtros alcançáveis e reduz altura em mobile. |
| `EmptyState` | 404, dados ausentes e telas filtradas | Consistência de linguagem, ilustração, CTA e tom. |

### 3.3 Especificação de navegação mobile

O rodapé atual é sólido, mas deve ser tratado como uma zona de segurança de interação.

1. Reservar **80–88 px** de espaço inferior para navegação e safe area.
2. Manter o Fly.IA fora do centro óptico do último item da navegação; em telas estreitas, preferir uma distância mínima de 12 px do grupo de tabs.
3. Usar rótulos de navegação com, no mínimo, 11 px e ícones de 20 px.
4. Garantir que filtros, accordions e cards não escondam ações atrás do rodapé fixo.

## 4. Melhorias por fluxo

### Home

O resumo anual deve ter apenas uma expressão de título por contexto. Quando o painel estiver aberto, o gatilho pode mudar para um resumo curto, como **“Visão anual”**, enquanto o conteúdo mantém **“Resumo Anual 2026”**. Isso reduz a repetição e libera atenção para a próxima ação operacional.

No cabeçalho com imagem, convém estabilizar o contraste com um overlay navy um pouco mais consistente atrás dos controles. A foto pode continuar como assinatura de marca, mas não deve competir com ano, ações e preferências.

### Gestão de Passagens

No mobile, os filtros já estão funcionais, porém longos. A recomendação é oferecer uma faixa-resumo com chips ativos — por exemplo, **“Todos os meses · Todas as companhias · Semana”** — e abrir os filtros completos em um bottom sheet. Isso reduz a altura inicial e acelera a chegada aos meses.

Preservar a legenda roxa de cancelamento e estendê-la a todos os pontos em que o status aparece, sempre acompanhada do texto **Cancelado**.

### Calendário

Esta é a melhoria de maior retorno de UX. Em 320 px, o grid com dois meses torna dias e marcadores pequenos demais para uma leitura confortável. A recomendação é:

| Largura | Layout recomendado |
| --- | --- |
| Até 359 px | Um mês por linha, maior área para dias e badges. |
| 360–767 px | Dois meses por linha, mantendo o espaçamento atual. |
| 768 px ou mais | Três ou quatro meses conforme a largura disponível. |

Adicionar uma legenda compacta de status acima da grade: **Emitido**, **Cancelado**, **Remarcado**, **Feriado**. Isso evita que o usuário precise inferir o significado dos pontos apenas pela cor.

### Cotações

O fluxo tem conteúdo informativo suficiente, mas pode ganhar escaneabilidade. Recomenda-se separar a seção de fontes de preço da sequência de semanas com uma divisória mais forte e transformar os metadados de cada semana em uma linha de chips: ida, volta, status e menor preço. A ação principal deve ficar sempre na mesma posição no card.

### Financeiro

Os quatro KPIs devem seguir o mesmo fundo navy; a semântica fica em acentos de ícone e tendências, como já iniciado. Para os próximos blocos, usar três níveis de superfície: canvas neutro, card branco/escuro para conteúdo tabular e navy para síntese financeira ou atenção prioritária.

Valores monetários devem usar algarismos tabulares quando possível, para melhorar a comparação vertical de centavos, totais e variações.

### Estados protegidos e administrativos

Os cartões de acesso são claros, mas ainda variam entre branco sobre canvas navy e superfícies claras. Recomenda-se consolidar o `AccessGate` com:

* ícone de 56 px;
* título objetivo em português;
* uma frase de contexto e privacidade;
* CTA navy único;
* ação secundária “Voltar ao planejamento”;
* largura máxima de 440 px e espaçamento fixo.

### Novidades e 404

As métricas da tela de Novidades funcionam, mas podem ser compactadas como uma faixa horizontal no desktop e dois pares no mobile. Na página 404, trocar **“Page Not Found”**, **“Sorry”** e **“Go Home”** por português e aplicar o componente `EmptyState` com o mesmo tom do restante da plataforma.

## 5. Acessibilidade e qualidade de interação

| Tema | Recomendação | Critério de aceite |
| --- | --- | --- |
| Contraste | Texto normal com relação mínima de 4,5:1. | Nenhum texto de produção fica ilegível sobre branco, imagem ou navy. |
| Cor de status | Cor nunca é o único indicador. | Status têm texto, ícone ou forma complementar. |
| Toque | Alvos móveis com pelo menos 44 × 44 px. | Filtros, tabs e chevrons são acionáveis sem precisão excessiva. |
| Foco | Anel de foco navy claro ou branco visível em todo componente interativo. | Navegação por teclado não perde localização. |
| Movimento | Transições de opacidade e transformação, sob 300 ms. | `prefers-reduced-motion` elimina animação não essencial. |
| Dados densos | Tabelas e calendários respondem ao viewport. | Não há conteúdo crítico comprimido abaixo do limiar de leitura. |

## 6. Roteiro recomendado

| Horizonte | Entrega | Impacto esperado |
| --- | --- | --- |
| **Agora** | Calendário de uma coluna em 320 px; localização do 404; tokenização de superfícies navy. | Maior legibilidade mobile e consistência imediata. |
| **Próxima iteração** | `AppPageHeader`, `AccessGate`, `StatusPill` e `MetricCard` compartilhados. | Menos variação entre telas e manutenção mais simples. |
| **Evolução seguinte** | Filtros compactos/bottom sheets e padrão de cards de Cotações. | Menos fricção em fluxos operacionais. |
| **Maturidade** | Auditoria de contraste automatizada, catálogo de componentes e Storybook. | Governança durável do design system. |

## 7. Recomendação principal

O melhor próximo investimento é **transformar o Calendário em uma experiência mobile adaptativa de uma coluna em 320 px e, em paralelo, criar os tokens e componentes de superfície compartilhados**. Essa combinação corrige o ponto de maior densidade visual percebida e evita que a consistência azul-marinho dependa de ajustes manuais página a página.

## Limites da auditoria

As rotas públicas e os estados protegidos foram avaliados visualmente em desktop e nas larguras de 320 px, 375 px e 390 px. Os conteúdos internos de Financeiro, Memórias, Administração, Telemetria e Gemini exigem sessão autenticada; nesses casos, a auditoria visual avaliou o gate de acesso e a análise de código considerou os componentes renderizados após autenticação. Recomenda-se uma segunda rodada com sessão interna ativa para validar dados reais, estados vazios, erros e tabelas administrativas.
