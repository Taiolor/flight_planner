# Auditoria de responsividade do Calendário

## Escopo

O Calendário foi inspecionado em 320 px, 375 px e 390 px de largura, contemplando o cabeçalho, os filtros, o painel da Copa, a grade anual de meses, o resumo e a lista de semanas sem passagem.

## Achados e correções

| Elemento | Achado em 320 px | Correção aplicada |
| --- | --- | --- |
| Indicador de voos por mês | O selo de quantidade excedia poucos pixels em cards compactos | Redução proporcional de ícone, espaçamento e padding, preservando o texto completo. |
| Painel da Copa | Nomes de adversários longos eram truncados | Substituição do truncamento por quebra de palavra dentro da área disponível. |
| Grade, filtros e resumos | Nenhum overflow horizontal de documento foi identificado | Mantida a composição atual de duas colunas, adequada à visão anual compacta. |

## Resultado da validação

A auditoria final confirmou, em 320 px, 375 px e 390 px, que `documentWidth` e `bodyWidth` correspondem à largura do viewport e que não há elementos com overflow interno. Os controles e informações permanecem acessíveis sem rolagem lateral.
