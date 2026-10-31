# Diagnóstico de carregamento da Home

## Ocorrência

Após a sincronização da versão que desativou os controles de layout da Home, o resumo anual, o planejamento de três semanas, o progresso anual, a central de atenção e a variação de preços deixaram de aparecer.

## Causa raiz

A flag `LAYOUT_CONTROLS_ENABLED = false` foi aplicada ao bloco inteiro de conteúdo da visão inicial, e não somente ao componente `HomeDashboardControls`. Portanto, a renderização dos dados ficou condicionada a uma flag destinada exclusivamente a ocultar controles de organização visual.

## Correção aplicada

O `HomeDashboardControls` continua protegido pela flag reversível, mas o restante da visão inicial voltou a ser condicionado somente a `!isManagementView`. Nenhum dado de banco, calendário, semana ou resumo foi alterado.

## Evidência de verificação

A pré-visualização da Home voltou a exibir o resumo anual, as semanas anterior, atual e próxima, o progresso anual e a central de atenção. A rota de calendário também exibiu os doze meses e os voos previstos normalmente.
