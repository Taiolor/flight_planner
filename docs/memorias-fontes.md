# Referências de distância das Memórias

As distâncias da área Memórias serão calculadas localmente pela fórmula de Haversine, a partir de coordenadas de referência de aeroportos. Para a rota principal, foram registradas as seguintes coordenadas:

| Aeroporto | Coordenada de referência |
| --- | --- |
| GRU — São Paulo/Guarulhos | -23.43556, -46.47306 |
| NVT — Navegantes | -26.87861, -48.65083 |

As fontes consultadas indicam as coordenadas de GRU e NVT e a distância aérea aproximada da rota. A aplicação exibirá quilometragem geodésica estimada, não a distância operacional de uma rota aérea específica.

## Implementação

As Memórias calculam quilômetros por trecho com a fórmula de Haversine e classificam cada voo emitido como concluído, futuro ou cancelado. A área mostra os totais do exercício selecionado e aceita fotos ou vídeos de até 25 MB vinculados à passagem semanal. Os arquivos ficam no armazenamento de objetos; o banco guarda somente metadados e referências de mídia.

## Referências

[1]: [São Paulo/Guarulhos International Airport](https://en.wikipedia.org/wiki/S%C3%A3o_Paulo/Guarulhos_International_Airport) — coordenadas de referência de GRU.
[2]: [Navegantes Airport](https://en.wikipedia.org/wiki/Navegantes_Airport) — coordenadas de referência de NVT.
[3]: [Distance from São Paulo to Navegantes (GRU – NVT)](https://www.airmilescalculator.com/distance/gru-to-nvt/) — referência independente da rota aérea.
