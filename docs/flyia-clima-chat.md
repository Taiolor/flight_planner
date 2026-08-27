# Clima no Fly.IA

## Perguntas sugeridas

O Fly.IA passa a oferecer, no estado inicial e após respostas meteorológicas, perguntas rápidas sobre **tempo no destino**, **chance de chuva na chegada**, **temperatura** e **vento no aeroporto**. As perguntas de clima são reconhecidas antes da chamada ao Gemini, evitando consumo desnecessário de tokens quando há um próximo voo emitido elegível.

## Fonte e escopo

A resposta seleciona o destino do próximo voo emitido na base do SmartFly e consulta o mesmo adaptador meteorológico usado no detalhe expandido. A consulta contém somente o código público do aeroporto de destino e a data do trecho. Não inclui e-mail, localizador, preço, número de bilhete ou conteúdo de conversa.

A previsão é diária e pode ser exibida somente dentro da janela suportada pela fonte. Quando estiver indisponível, o Fly.IA informa isso de forma explícita e não altera os dados de data, hora ou status persistidos no planejamento.

## Cartão visual acessível

Além da resposta textual, o chat exibe um cartão com ícone de condição, cidade, data, temperatura mínima e máxima, chuva, vento e um link seguro para a fonte. Os indicadores não dependem apenas de cor: todos os valores têm rótulos textuais e descrições para leitores de tela. O ícone acompanha o resumo meteorológico, incluindo céu limpo, nuvens, chuva e trovoadas.

> A previsão orienta o preparo da viagem. Informações operacionais do voo, como horário, terminal, portão, atraso e cancelamento, continuam tendo como fonte exclusiva a base SmartFly e os canais da companhia aérea.

## Referência

[1]: https://open-meteo.com/en/docs "Open-Meteo — Weather Forecast API"
