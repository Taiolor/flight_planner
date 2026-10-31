# Clima do destino nos detalhes de voo

## Escopo

Os detalhes expandidos exibem uma previsão **diária** do aeroporto de destino para cada trecho. O dado previsto é complementar ao bilhete: data, horário, terminal, companhia e status continuam sendo dados do SmartFly.

## Fonte e consulta

A aplicação usa a previsão por coordenadas públicas de aeroportos da Open-Meteo. A consulta envia somente código de aeroporto e data do voo ao servidor; o servidor resolve coordenadas fixas para GRU, CGH, VCP e NVT e consulta a fonte com tempo máximo de quatro segundos e limite de 64 KB de resposta. A previsão disponível possui janela de até 16 dias, de acordo com a documentação do fornecedor.[1]

Não são enviados localizador, nome, e-mail, preço, origem pessoal ou conteúdo de conversa. A consulta é pública para não gerar erro ao abrir o Calendário sem sessão, mas aceita somente um código IATA de três letras e uma data no formato ISO; no servidor, somente os aeroportos conhecidos e a janela de 16 dias resultam em chamada externa. A resposta é mantida apenas no cache de consulta do navegador por uma hora e não é persistida em banco.

## Apresentação e contingência

O cartão apresenta descrição meteorológica, mínima e máxima, probabilidade máxima de chuva, vento máximo, data e link de atribuição à fonte. Enquanto a consulta está em andamento, há anúncio de carregamento. Para data fora da janela, aeroporto não suportado ou indisponibilidade da fonte, a seção não é exibida e os detalhes do voo continuam disponíveis.

A verificação no navegador confirmou o carregamento do Calendário e a abertura do detalhe da semana 26, com os dados de ida e volta preservados. A previsão é acessível também sem sessão interna porque a consulta aceita somente dados públicos e estritamente validados. A cobertura automatizada valida a apresentação da previsão, o carregamento e a contingência da fonte.

Após a correção, o Calendário público é carregado sem disparar consulta meteorológica até que a pessoa abra os detalhes de um voo. Isso evita erros de autenticação durante a renderização inicial da página.

Na abertura pública de um detalhe de voo após a alteração, a interface manteve os dados de ida e volta e não exibiu erro de autenticação. Quando a fonte não disponibiliza previsão para a data, o bloco meteorológico é omitido sem afetar o restante do cartão.

## Referências

[1]: https://open-meteo.com/en/docs "Open-Meteo — Weather Forecast API"
