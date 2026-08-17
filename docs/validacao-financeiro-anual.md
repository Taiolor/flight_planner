# Validação visual — Gestão financeira por ano

Em 17 de agosto de 2026, a rota `/financeiro?ano=2027` foi verificada no ambiente de desenvolvimento. O cabeçalho, títulos dos painéis, KPIs, tabelas e projeção apresentaram 2027 como exercício base e 2028 como ano projetado, sem exibir dados de 2026.

O seletor global disponibilizou os anos de 2026 a 2030. Para 2027, que ainda não possui semanas emitidas, a interface exibiu estados vazios específicos do exercício, preservando a separação anual.

A seleção de 2028 atualizou a URL para `/financeiro?ano=2028`, todos os textos financeiros para 2028 e a projeção para 2029, confirmando que os dados derivados acompanham o exercício global.
