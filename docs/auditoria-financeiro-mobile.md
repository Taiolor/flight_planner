# Auditoria de responsividade do Financeiro

## Escopo

O Financeiro foi verificado em 320 px, 375 px e 390 px, cobrindo o cabeçalho, KPIs, abas, gráficos, tabelas de milhas, comparativo por companhia, detalhe semanal e projeções.

## Ajustes aplicados

| Elemento | Ajuste para celular |
| --- | --- |
| Eixos e legendas de gráficos | Fonte menor, menor intervalo de rótulos, largura reservada para eixo Y e legendas compactas. |
| Gráfico de distribuição | Rótulos externos removidos do gráfico de pizza e legenda posicionada abaixo para evitar colisões. |
| Detalhes de milhas | Tabela trocada por cartões abaixo de 640 px; tabela preservada no desktop. |
| Comparativo por companhia | Cartões móveis apresentam viagens, valores, média, milhas e participação sem rolagem lateral. |
| Projeção mensal | Cartões móveis mostram fatores, viagens, preço, projetado e variação; tabela detalhada permanece a partir de 640 px. |

## Resultado

As verificações em 320 px, 375 px e 390 px confirmaram que a largura do documento corresponde à largura do viewport e não há overflow horizontal ou interno. As tabelas extensas passam a ter uma leitura própria para celular, sem perda de dados relevantes.
