# Direção da apresentação

Estética Smart Fly: azul-marinho profundo, superfícies claras, alto contraste, tipografia Roboto, grids generosos e acentos semânticos discretos. Tom executivo, pragmático e orientado à decisão. A narrativa mostra como a Central de decisão complementa o Centro operacional já existente: a Home prioriza o agora; o Controle operacional resolve e acompanha o detalhe.

## Cover

Smart Fly

Central de decisão na Home

Do planejamento anual à próxima ação operacional

## Slide 1

### Smart Fly já organiza a jornada completa

- Planejamento anual e Gestão de Passagens conectam semanas, emissão e status dos bilhetes.
- Calendário oferece a leitura diária das viagens, com estados de registrado, remarcado e cancelado.
- Financeiro consolida investimento, médias e milhas; notificações, histórico e Centro operacional reforçam a execução.
- A próxima evolução é reduzir a distância entre “ver informação” e “tomar a decisão certa”.

## Slide 2

### O produto passou de planejador a sistema operacional

- A Home entrega visão anual, próximas semanas, metas, pendências e tendências de preço.
- A rota Controle operacional aprofunda decisões, preparação, créditos e relatórios executivos.
- Gestão, Calendário e Financeiro mantêm os contextos especializados para edição e auditoria.
- O desafio de UX: a Home precisa revelar primeiro o que muda a ação de hoje.

## Slide 3

### A decisão ainda está dispersa

- Uma compra pendente pode aparecer em um card semanal, enquanto a variação de preço está em outro painel.
- A próxima viagem exige cruzar calendário, emissão, checklist e possíveis alterações.
- Métricas são úteis, mas não indicam por si só qual ação deve ocorrer agora.
- O custo é tempo de leitura, alternância entre telas e risco de perder prazos operacionais.

## Slide 4

### A Central transforma sinais em ação

- Um frame único, logo após o Resumo Anual, resume urgências, próxima viagem e impacto financeiro.
- Até três prioridades são ordenadas por risco, prazo, impacto financeiro e status do bilhete.
- Cada sinal explica por que importa e oferece um único CTA contextual.
- A Home vira uma camada de comando; os módulos existentes continuam sendo os locais de aprofundamento.

## Slide 5

### A nova Home segue uma hierarquia operacional

- **Camada 1 — Ações de hoje:** faixa com três decisões prioritárias e contador de itens restantes.
- **Camada 2 — Próxima viagem:** rota, datas, emissão, companhia, status e CTA para abrir a semana no Calendário.
- **Camada 3 — Impacto:** investimento mensal, variação, milhas e pendências em quatro MetricCards compactos.
- **Camada 4 — Fila secundária:** itens não urgentes recolhíveis com atalho para Gestão de Passagens.

## Slide 6

### Desktop e mobile preservam a mesma prioridade

- Desktop usa grade 8/4: próxima viagem domina a leitura; métricas compõem a coluna de impacto.
- Mobile empilha: prioridade crítica, próxima viagem, métricas e fila secundária.
- Cada CTA mantém área de toque mínima de 44 px e rótulo orientado a tarefa.
- A fila secundária pode ser recolhida por preferência local, sem ocultar itens críticos.

## Slide 7

### Regras explicáveis evitam alertas genéricos

- **Crítico:** voo cancelado, retorno ausente perto da data ou compra que excede o prazo definido.
- **Atenção:** bilhete não emitido, preço em alta, remarcação, crédito próximo do vencimento ou checklist atrasado.
- **Planejamento:** metas mensais, semanas futuras sem preço e oportunidades de milhas.
- A prioridade é sempre acompanhada de justificativa legível e origem navegável.

## Slide 8

### O ranking nasce de dados já existentes

- Flight weeks, voos adicionais, preços, metas, créditos e checklist alimentam uma função pura de classificação.
- `DecisionItem` padroniza: severidade, tipo, semana, título, explicação, destino e peso de prioridade.
- A função ordena por severidade, proximidade temporal, impacto financeiro e estado de emissão.
- Nenhum dado é duplicado: a Central é uma composição confiável das fontes atuais.

## Slide 9

### Componentes reutilizáveis aceleram a implementação

- `DecisionCenter` coordena dados e estados; `DecisionPriorityList` renderiza prioridades explicáveis.
- `NextTripCard` reutiliza StatusPill, contexto semanal e atalho direto ao Calendário.
- `DecisionMetricGrid` reaproveita MetricCard; `SecondaryDecisionQueue` mantém o backlog operacional compacto.
- Tokens navy, foco visível, motion reduzido e estados de loading/erro preservam o design system atual.

## Slide 10

### Home decide; Controle operacional executa

- A Central de decisão mostra a síntese e direciona a ação mais relevante no momento.
- O Centro operacional recebe o usuário para checklist, anexos, créditos, metas e relatório executivo.
- Um CTA como “Preparar semana 27” abre a viagem correta no contexto detalhado, sem nova busca.
- A separação evita transformar a Home em uma tela densa, mantendo velocidade e foco.

## Slide 11

### O fluxo reduz passos até a resolução

- Sinal: “Semana 27 ainda sem emissão; viagem em 10 dias”.
- Decisão: CTA **Emitir passagem** abre Gestão já filtrada pela semana e pelo estado pendente.
- Confirmação: ao registrar a emissão, a Central se atualiza e reduz a urgência automaticamente.
- Alternativa: CTA **Abrir no Calendário** preserva a navegação espacial para conferência de datas e trechos.

## Slide 12

### Confiabilidade e acessibilidade são parte da decisão

- Loading usa skeleton; falha persistente mostra **Tentar novamente** e não bloqueia a Home inteira.
- Cada prioridade é uma lista semântica, com foco visível, leitor de tela e mensagens de estado claras.
- Preferências locais guardam apenas apresentação, como fila recolhida; regras e dados permanecem no servidor.
- Métricas sensíveis continuam protegidas conforme o estado de autenticação já adotado no Smart Fly.

## Slide 13

### MVP em três etapas controladas

- **Etapa 1:** ranking de três prioridades, próxima viagem e links profundos para Calendário e Gestão.
- **Etapa 2:** impacto financeiro mensal, fila secundária recolhível e explicações de regra mais detalhadas.
- **Etapa 3:** preferências de relevância, telemetria minimizada de uso e refinamento por feedback real.
- Cada etapa entrega valor isolado, é reversível por feature flag e recebe testes de regra, interface e responsividade.

## Slide 14

### Métricas validam se a Home decide melhor

- Tempo entre abrir a Home e iniciar uma ação prioritária.
- Percentual de compras emitidas antes do prazo e redução de semanas pendentes próximas da viagem.
- Uso dos CTAs para Calendário, Gestão e Controle operacional; taxa de resolução após a ação.
- Feedback qualitativo: “entendi o que preciso fazer agora” como critério central de clareza.

## Slide 15

### Decisão recomendada

- Aprovar o MVP com três prioridades, próxima viagem e quatro métricas de impacto.
- Posicionar a Central imediatamente após o Resumo Anual, antes dos painéis analíticos da Home.
- Reutilizar o Centro operacional como destino de execução detalhada, evitando sobreposição funcional.
- Iniciar com regras transparentes e evoluir apenas com evidência de uso.

## Slide 16

### Próximo passo

Central de decisão: menos leitura, mais clareza, ação no momento certo.
