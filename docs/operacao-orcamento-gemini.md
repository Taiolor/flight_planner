# Operação — Orçamento do Gemini no Fly.IA

## Finalidade

O painel **Gemini · Orçamento**, disponível em `/admin/gemini`, acompanha o consumo estimado do Fly.IA no projeto Google AI Studio **FlyAI**. O painel exige a sessão interna do SmartFly com papel de administrador.

> O painel é uma proteção operacional interna. O AI Studio continua sendo a fonte de verdade para saldo pré-pago, faturamento e preços efetivamente cobrados pela Google.

## O que é registrado

Após cada resposta bem-sucedida do Gemini 3.6 Flash, o SmartFly salva somente: mês do ciclo, nome do modelo, tokens de entrada, tokens de saída, total de tokens e custo estimado. Prompts, respostas, localizadores, e-mails e dados pessoais **não** são persistidos no monitoramento.

As taxas são configuráveis no painel em **centavos de real por 1 milhão de tokens**. Os valores iniciais são uma referência de operação e devem ser revisados pelo administrador quando a precificação oficial ou a conversão usada pelo projeto mudar.

## Limites e bloqueio

O administrador configura um orçamento mensal e três faixas ordenadas: aviso, crítico e teto. Quando uma consulta registrada faz o consumo ultrapassar uma faixa, o alerta correspondente é enviado uma única vez no ciclo. Ao atingir o teto, o Fly.IA bloqueia as **próximas** perguntas; a resposta que cruzou o limite é concluída e registrada para não interromper uma requisição em andamento.

## Alertas

Cada evento é identificado pela combinação `mês:faixa`, impedindo mensagens duplicadas. Os canais configuráveis são:

| Canal | Destinatário | Implementação |
|---|---|---|
| E-mail | Administrador configurado em `AUTH_EMAIL` | Serviço Resend já integrado ao SmartFly |
| Push | Proprietário do projeto | Serviço de notificação do proprietário, sem expor alertas a usuários comuns |

O histórico do painel informa o estado de entrega de cada canal, mas não armazena o conteúdo de conversas.

## Rotina administrativa sugerida

1. Compare a estimativa mensal do painel ao saldo e aos relatórios do AI Studio.
2. Atualize orçamento, taxas e faixas antes de ampliar o uso do Fly.IA.
3. Se o teto for atingido, reveja o saldo pré-pago no Google e aumente o orçamento interno somente quando apropriado.
4. Mantenha e-mail e push ativos para que o primeiro cruzamento de cada faixa seja comunicado imediatamente.
