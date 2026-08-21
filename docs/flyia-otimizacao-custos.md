# Otimização de custos do Fly.IA

## Evidências iniciais

| Fonte | Constatação aplicável |
| --- | --- |
| [Google AI — preços da Gemini API](https://ai.google.dev/gemini-api/docs/pricing) | A modalidade paga permite cache de contexto e Batch API; a página informa redução de 50% no modo batch para cargas que não exigem resposta interativa. |
| Código atual do Fly.IA | O modelo é `gemini-3.6-flash`; a resposta limita a saída a 700 tokens; a memória de sessão reduz o histórico enviado às duas mensagens recentes; e os eventos registram tokens de entrada e saída. |
| Banco de uso — agosto de 2026 | Há 29 chamadas registradas, com 97.294 tokens de entrada e 1.322 de saída. A entrada representa a maior parcela observada e deve ser priorizada. |

## Premissa de trabalho

Esta análise preserva o modelo Gemini atual, a resposta em português, a privacidade da sessão e o uso atual de Whisper para fala concluída. A transcrição atual não é streaming incremental: o áudio é enviado uma vez ao final da gravação e mantido somente em memória do servidor.

## Leitura das métricas atuais

O agregado de agosto de 2026 registra 29 chamadas, média de aproximadamente 3.355 tokens de entrada, 46 de saída e 3.811 tokens totais por chamada. A oportunidade principal está no prompt de entrada, não na resposta: o Fly.IA já limita a saída a 700 tokens, mas o contexto factual completo é serializado a cada pergunta.

## Cache e áudio em tempo real

Para Gemini 3.6 Flash, o cache implícito começa em 4.096 tokens. Assim, o volume médio atual está abaixo desse limiar e não deve ser tratado como uma economia garantida. Para aproveitar cache, o prefixo estável precisa permanecer no início do prompt e superar o mínimo; entretanto, cache explícito traz custo de armazenamento e deve ser comparado com a redução real de tokens antes de ser adotado.

Para perguntas curtas e operacionais, Gemini 3.6 Flash suporta `thinkingLevel: "minimal"`, opção que reduz latência e custo de raciocínio. Ela deve ser aplicada de forma seletiva e avaliada contra um conjunto de perguntas sobre voos, compras e cancelamentos; consultas analíticas ou ambíguas podem continuar em nível `medium`.

Como referência de mercado publicada, transcrição ao vivo custa US$ 0,017 por minuto e transcrição de gravação concluída US$ 0,0045 por minuto no provedor consultado. A modalidade ao vivo é aproximadamente 3,77 vezes mais cara; esses valores **não** devem ser usados como custo contábil do Whisper integrado sem confirmação do faturamento do provedor efetivo.

## Referências

[1]: https://ai.google.dev/gemini-api/docs/pricing "Google AI — Gemini API pricing"
[2]: https://ai.google.dev/gemini-api/docs/caching "Google AI — Context caching"
[3]: https://developers.openai.com/api/docs/pricing "OpenAI API — pricing"
[4]: https://ai.google.dev/gemini-api/docs/generate-content/thinking "Google AI — Gemini thinking"

## Recomendações priorizadas

| Prioridade | Medida | Efeito esperado | Observação |
| --- | --- | --- | --- |
| 1 | Selecionar contexto por intenção | Menor volume de tokens de entrada | Para perguntas de compra, cancelamento ou distância, enviar somente o recorte factual relacionado, não todo o exercício. |
| 2 | Remover `geradoEm` do contexto enviado | Prefixo mais estável e menos tokens | O timestamp não é necessário para a resposta e reduz a repetição idêntica do prompt. |
| 3 | Aplicar `thinkingLevel: "minimal"` em perguntas operacionais | Menos tokens de raciocínio, custo e latência | Usar para dados factuais; manter `medium` em perguntas ambíguas ou analíticas. |
| 4 | Reduzir `maxOutputTokens` de 700 para 250 ou 300 | Limite de risco de saída extensa | A média atual de saída é cerca de 46 tokens; validar o limite contra perguntas mais completas antes de fixá-lo. |
| 5 | Medir duração de áudio e custo por minuto | Base real para decisões de voz | Registrar somente metadados agregados: duração, bytes, resultado e latência; nunca conteúdo de voz. |
| 6 | Aplicar detecção de fala e parada por silêncio | Menos minutos enviados ao Whisper | Encerrar após 1–1,5 s de silêncio, exigir fala mínima e reduzir o limite de 60 s para cerca de 20–30 s em perguntas curtas. |
| 7 | Manter Whisper de gravação concluída | Evita custo de tempo real sem benefício atual | O Fly.IA não precisa de legendas parciais para uma pergunta curta; não migrar para live transcription sem uma necessidade de UX comprovada. |

### Ajuste importante de medição

O painel atual estima o custo de cada requisição e arredonda o resultado para centavos antes de somar. Em chamadas pequenas, isso pode resultar em zero centavo por evento mesmo quando há consumo real. O cálculo deve ser movido para micros de centavo, ou realizado sobre o total mensal de tokens, para que o orçamento seja um controle confiável.

### Ordem de implementação sugerida

Primeiro, corrigir a precisão da telemetria de custo e adicionar métricas de duração de áudio. Em seguida, criar o seletor de contexto por intenção e testar a qualidade com um conjunto de perguntas reais do Fly.IA. Por último, aplicar `thinkingLevel: "minimal"` e o novo teto de saída somente às perguntas operacionais. Cache de contexto deve ficar em observação: com média de entrada abaixo de 4.096 tokens, ele não é a primeira alavanca de economia.

## Telemetria implementada

O custo de Gemini passou a ser persistido em **microcentavos** por evento e por ciclo mensal. Dessa forma, uma chamada de baixo volume não é mais arredondada para zero antes de compor o total do mês. O painel continua exibindo reais com duas casas decimais, mas o percentual de orçamento, os alertas e o saldo estimado usam a soma precisa.

A telemetria de voz registra somente duração, quantidade de bytes, resultado e latência da transcrição. Ela não registra áudio, texto transcrito, tipo de arquivo, endereço de e-mail, chave de sessão ou qualquer identificador de pessoa. A duração é limitada a 60 segundos e o painel administrativo apresenta apenas agregados dos últimos 30 dias.

## Série temporal do painel

O painel administrativo inclui uma série diária dos últimos 14 dias para comparar o total de tokens do Gemini e a duração agregada de áudio. As duas linhas usam escalas independentes, pois tokens e segundos possuem unidades diferentes. Dias sem atividade permanecem visíveis com valor zero, evitando que períodos silenciosos pareçam ausentes.

> A consulta é protegida por papel administrativo e retorna somente data, rótulo curto, total de tokens e duração total de áudio. Ela não retorna prompts, respostas, transcrições, nomes, sessões ou arquivos de áudio.
