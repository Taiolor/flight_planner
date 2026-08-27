# Clima do destino nos detalhes de voo

## Escopo

Os detalhes expandidos exibem uma previsão **diária** do aeroporto de destino para cada trecho. O dado previsto é complementar ao bilhete: data, horário, terminal, companhia e status continuam sendo dados do SmartFly.

## Fonte e consulta

A aplicação usa a previsão por coordenadas públicas de aeroportos da Open-Meteo. A consulta envia somente código de aeroporto e data do voo ao servidor; o servidor resolve coordenadas fixas para GRU, CGH, VCP e NVT e consulta a fonte com tempo máximo de quatro segundos e limite de 64 KB de resposta. A previsão disponível possui janela de até 16 dias, de acordo com a documentação do fornecedor.[1]

Não são enviados localizador, nome, e-mail, preço, origem pessoal ou conteúdo de conversa. A resposta é mantida apenas no cache de consulta do navegador por uma hora e não é persistida em banco.

## Apresentação e contingência

O cartão apresenta descrição meteorológica, mínima e máxima, probabilidade máxima de chuva, vento máximo, data e link de atribuição à fonte. Enquanto a consulta está em andamento, há anúncio de carregamento. Para data fora da janela, aeroporto não suportado ou indisponibilidade da fonte, a seção não é exibida e os detalhes do voo continuam disponíveis.

A verificação no navegador confirmou o carregamento do Calendário e a abertura do detalhe da semana 26, com os dados de ida e volta preservados. Na sessão pública de verificação, a previsão não é exibida porque a consulta é protegida pela sessão interna; esse comportamento impede o uso anônimo da fonte externa. A cobertura automatizada valida a apresentação da previsão, o carregamento e a contingência da fonte.

## Referências

[1]: https://open-meteo.com/en/docs "Open-Meteo — Weather Forecast API"
