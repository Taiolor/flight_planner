# Desempenho e fontes de dados do Fly.IA

## Como o Fly.IA responde

O Fly.IA **não é treinado nem retreinado** com os dados do SmartFly. A Gemini recebe um contexto novo a cada pergunta elegível; a continuidade temporária vem apenas de um resumo sanitizado da conversa na sessão atual. A lógica do servidor decide primeiro se a resposta pode ser determinística, evitando uma chamada ao modelo quando isso é possível.

| Pergunta | Fonte usada | Chamada à Gemini |
| --- | --- | --- |
| Próximo voo, horário, terminal, companhia, status e bilhete | Base SmartFly | Não |
| Embarque e antecedência | Partida cadastrada + orientação fixa | Não |
| Clima, chuva, vento, UV e bagagem | Previsão pública por aeroporto e data | Não |
| Tempo até o aeroporto | Serviço de rotas e trânsito | Não |
| Compra, cancelamento, distância ou questão geral sem regra determinística | Contexto factual SmartFly | Sim |

## Contexto enviado à Gemini

Quando uma pergunta realmente precisa da Gemini, o servidor envia o exercício selecionado, o resumo agregado de viagens, voos emitidos com origem/destino, data e hora, companhia, número, distância e situação; o resumo financeiro agregado e voos adicionais com dados operacionais mínimos. O histórico é limitado a oito mensagens e, quando existir memória de sessão, somente às duas últimas mensagens, acompanhadas do resumo temporário.

O prompt proíbe invenções, alterações de reserva e exposição de localizadores, e-mails, sessões, senhas ou tokens. Terminais e localizadores não são incluídos no contexto da Gemini. A geração usa temperatura 0,2, teto de 350 tokens e raciocínio mínimo para respostas operacionais.

## Clima e dados externos

Clima não é pesquisado pela Gemini. O servidor consulta diretamente o Open-Meteo com **somente** o código público de aeroporto, suas coordenadas públicas, a data e, para o Fly.IA, a hora de partida já cadastrada. A consulta aceita GRU, CGH, VCP e NVT, limita a previsão a 16 dias e não envia nome, e-mail, localizador ou texto da conversa. [1]

Para reduzir espera e falhas repetidas, previsões bem-sucedidas são reutilizadas por dez minutos para a mesma combinação de aeroporto, data e horário. A chamada externa tem limite de 2,5 segundos; se a fonte não responder, o Fly.IA informa indisponibilidade sem recorrer à Gemini e sem alterar o voo. Perguntas sobre sol, céu nublado, frio, calor, UV, rajadas e visibilidade também são classificadas como clima antes da Gemini.

## Leitura das métricas observadas

> As métricas agregadas recentes registraram 129 respostas determinísticas, com média de 58 ms, e três respostas geradas pela Gemini, com média de 18,4 segundos. Dois erros de provedor chegaram perto do limite anterior de 45 segundos.

Por esse motivo, o timeout da Gemini foi reduzido para 20 segundos. A alteração não torna a Gemini mais rápida, mas evita que uma indisponibilidade prolongada mantenha o chat bloqueado. As perguntas de clima agora usam o caminho determinístico e a hora real do trecho, reduzindo tanto a latência quanto o risco de obter um resumo diário pouco relevante.

## Referências

[1]: https://open-meteo.com/en/docs "Open-Meteo — Weather Forecast API"
