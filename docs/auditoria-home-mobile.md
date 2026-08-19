# Auditoria de responsividade da Home

## Inspeção inicial

A pré-visualização disponível foi verificada em um viewport de 1280 × 1100 px. Não foi encontrado overflow horizontal nessa largura (`documentWidth = 1265 px`), mas essa visualização não representa um celular e não permite confirmar os breakpoints apenas por inspeção do navegador.

## Resultados em celular

Foram geradas capturas em 320 px, 375 px e 390 px. O cabeçalho, o resumo anual, os controles de horário, os cards de planejamento e o seletor de empresas se reorganizam verticalmente e permanecem utilizáveis. A auditoria encontrou overflow interno nos seguintes blocos:

| Faixa | Bloco | Causa observada | Correção planejada |
| --- | --- | --- | --- |
| 320–390 px | Filtros e Controles | A grade de duas colunas força o seletor de Companhia além de sua célula em larguras estreitas | Usar uma coluna abaixo de 375 px e garantir `min-w-0` nos itens e gatilhos. |
| 320–390 px | Filtro de empresas do gráfico | Título e ações “Selecionar todas/Limpar” dividem uma linha rígida | Empilhar ações abaixo do título no celular e permitir quebra de linha. |
| 320 px | Card do gráfico | O conteúdo interno excede poucos pixels a largura disponível | Aplicar largura máxima e contenção horizontal aos controles internos. |

## Validação após correções

Após os ajustes, uma segunda auditoria em 320 px, 375 px e 390 px confirmou que `documentWidth` e `bodyWidth` são iguais à largura do viewport e não identificou elementos com overflow interno. Os filtros passam a usar uma coluna abaixo de 480 px; as ações do gráfico se empilham quando necessário; e o estado vazio reduz o espaçamento e permite que seus botões quebrem texto sem ultrapassar o card.
