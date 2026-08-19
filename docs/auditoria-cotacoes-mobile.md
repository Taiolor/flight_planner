# Auditoria de responsividade de Cotações

## Escopo

A página Cotações foi verificada em 320 px, 375 px e 390 px, incluindo cabeçalho, filtros, lista de semanas, ações e detalhes de cada cotação.

## Achados e correções

| Elemento | Achado em 320 px | Correção aplicada |
| --- | --- | --- |
| Badge de semana | O badge e o marcador de semana atual excediam a largura de cards compactos | Redução de espaçamento/padding, prevenção de quebra e rótulo “atual” progressivo a partir de 360 px. |
| Cabeçalho da semana | A área de datas podia competir com o badge em cards estreitos | Inclusão de largura mínima zero e crescimento controlado na região textual. |
| Detalhes de ida e volta | A composição em duas colunas ficava comprimida no celular | Uma coluna abaixo de 380 px e duas colunas a partir dessa largura. |

## Resultado da validação

Após as correções, a auditoria final em 320 px, 375 px e 390 px confirmou equivalência entre a largura do documento e a largura do viewport, sem elementos com overflow interno. Filtros, cards e tabelas detalhadas mantêm leitura e interação adequadas sem rolagem lateral.
