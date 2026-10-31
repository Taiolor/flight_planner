# Fontes externas confiáveis do Fly.IA

## Objetivo

O Fly.IA deve recorrer à web somente para **orientações gerais** que não estejam na base do planejamento, como chegada ao aeroporto, check-in, embarque e antecedência recomendada. Horários, status, terminal, portão, remarcação e cancelamento de cada voo são respondidos exclusivamente com os dados persistidos no SmartFly.

## Evidências técnicas iniciais

>A documentação da Gemini API descreve o grounding com Google Search como um recurso de informações em tempo real que devolve anotações de citação por URL. A resposta traz as consultas executadas e as fontes que sustentam os trechos citados. [1]

O uso deve continuar no servidor, com a chave do projeto FlyAI protegida. A resposta do Fly.IA deverá exibir as fontes retornadas, informar que a recomendação pode mudar conforme companhia, aeroporto e voo, e nunca substituir o horário ou o status persistidos do bilhete.

## Hierarquia proposta de fontes

| Prioridade | Fonte | Uso permitido |
| --- | --- | --- |
| 1 | Companhia aérea do voo | Orientações gerais de check-in, embarque e antecedência. |
| 2 | Aeroporto de origem ou destino | Acesso ao terminal e orientações locais de chegada e embarque. |
| 3 | ANAC | Direitos, documentação e regras regulatórias brasileiras. |
| 4 | Busca fundamentada | Apenas quando não houver fonte oficial específica recuperável. |

## Evidências operacionais consultadas

A LATAM publica orientação específica de chegada ao aeroporto: para voos nacionais, a regra geral é duas horas, mas a página lista três horas para partidas domésticas de GRU e outros aeroportos brasileiros selecionados. A mesma fonte orienta antecipar a entrada na área de embarque quando houver possibilidade de deslocamento maior até o portão. [2]

O GRU Airport mantém uma área oficial de voos e uma seção própria de chegadas e partidas. Essas páginas podem embasar orientações gerais de acesso ao aeroporto, mas não substituem os horários ou detalhes do voo armazenados no SmartFly. [3]

## Limites obrigatórios

O sistema não enviará localizador, e-mail, documento, sessão, conteúdo de memória ou dados brutos do voo à busca. O resultado será sempre tratado como orientação geral. Quando a pergunta tratar de mudança de voo, cancelamento, portão, terminal, status ou qualquer horário, o Fly.IA utilizará apenas a base de dados do SmartFly e explicará a origem interna da informação.

## Recomendação de embarque e deslocamento

Quando a pessoa perguntar pelo horário de embarque, o Fly.IA seleciona o próximo voo emitido na base SmartFly e mostra a data e a hora de partida literalmente como foram cadastradas. Para uma saída doméstica de GRU operada pela LATAM com destino a NVT, a recomendação atual calcula a chegada ao aeroporto três horas antes da partida, conforme a orientação oficial consultada. Essa margem é apresentada como recomendação de chegada, nunca como horário de chamada, portão ou alteração do voo.

Quando a pergunta trouxer explicitamente uma origem — por exemplo, “Quanto tempo eu demoro saindo da Paulista até o aeroporto?” — o Fly.IA consulta rotas de carro com trânsito no Google Maps. A consulta envia somente a origem informada e o endereço público do aeroporto de partida, não persiste a origem e retorna a duração observada no momento. O resultado exibe a data e a hora do voo apenas como referência vinda da base SmartFly.

Cada resposta de deslocamento bem-sucedida também oferece o botão **Ver rota no mapa**. A ação abre uma nova aba para a URL oficial de direções do Google Maps, com os parâmetros de origem, destino e modo carro. O link é validado no cliente para aceitar apenas direções HTTPS em `www.google.com`, abre com `noopener noreferrer` e não aparece em respostas de voo, orçamento ou qualquer outro tema.

## Decisão de fonte de dados

> O SmartFly é a fonte única de dados do voo da pessoa usuária. Nenhum provedor externo de status será integrado ao Fly.IA nesta versão.

As fontes externas serão limitadas a orientações gerais publicadas por companhia aérea, aeroporto ou órgão regulador. A API de status de voo pesquisada anteriormente não será ativada, e nenhuma chave adicional será solicitada ou utilizada.

## Referências

[1]: https://ai.google.dev/gemini-api/docs/google-search "Google AI for Developers — Grounding with Google Search"
[2]: https://www.latamairlines.com/br/pt/central-ajuda/perguntas/check-in/embarque/antecedencia-chegada-aeroporto "LATAM Airlines — Antecedência de chegada ao aeroporto"
[3]: https://www.gru.com.br/pt/passageiro/fale-conosco/perguntas-frequentes "GRU Airport — Perguntas frequentes e informações de voo"
