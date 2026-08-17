# Validação visual — Cotações por ano

Em 17 de agosto de 2026, a rota `/cotacoes?ano=2027` foi verificada no ambiente de desenvolvimento. O cabeçalho exibiu o seletor global com os anos de 2026 a 2030 e a página apresentou o estado vazio específico de 2027, sem carregar semanas ou cotações de 2026.

O estado vazio direciona o usuário para `/?ano=2027`, preservando o exercício selecionado para a geração idempotente das semanas. A troca pelo seletor para 2028 também atualizou a URL para `/cotacoes?ano=2028`, os títulos e o link de continuidade, confirmando a sincronização da interface com o contexto anual.
