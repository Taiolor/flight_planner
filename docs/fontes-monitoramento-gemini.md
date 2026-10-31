# Fontes — Monitoramento de Consumo do Gemini

O painel administrativo do SmartFly exibirá uma **estimativa interna**, calculada a partir dos tokens efetivamente retornados pelas respostas do Gemini. O painel não substitui a cobrança oficial da Google, que permanece a fonte de verdade para saldo pré-pago, limites de gasto e valores faturados.

| Tema | Uso no SmartFly | Fonte oficial |
|---|---|---|
| Metadados de tokens | Registrar tokens de entrada, saída e total de cada resposta bem-sucedida do Fly.IA. | [Guia de tokens](https://ai.google.dev/gemini-api/docs/tokens) |
| Precificação | Manter taxas de entrada e saída configuráveis para gerar custo estimado por consulta e por mês. | [Tabela de preços](https://ai.google.dev/gemini-api/docs/pricing) |
| Orçamento pré-pago | Mostrar o orçamento interno como proteção complementar; o saldo e o gasto oficiais continuam no AI Studio. | [Faturamento e pré-pago](https://ai.google.dev/gemini-api/docs/billing) |
| Limites do projeto | Orientar a configuração de teto mensal no AI Studio; a Google informa possível atraso de processamento de aproximadamente 10 minutos. | [Limites de gasto por projeto](https://ai.google.dev/gemini-api/docs/billing#project-spend-caps) |

> O SmartFly deve evitar prometer que seu teto interno coincide exatamente com a cobrança da Google. Ele é um controle preventivo local e usa tokens observados pela própria aplicação.
