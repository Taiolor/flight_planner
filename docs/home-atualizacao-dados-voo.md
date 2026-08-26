# Atualização suave dos dados de voo

## Comportamento

Quando a Home refaz em segundo plano consultas de semanas, preços públicos ou privados e trechos adicionais, os dados já exibidos **permanecem visíveis**. A área de última atualização troca temporariamente seu texto por um indicador compacto com a mensagem **“Atualizando dados de voo...”**.

Esse comportamento cobre invalidações após edição, atualização manual e refetch automático. O carregamento inicial continua utilizando o estado de carregamento existente, para não confundir a ausência inicial de dados com uma atualização de conteúdo já disponível.

## Acessibilidade e movimento

O indicador é um estado `status` com anúncio educado para leitores de tela. A animação do ícone é curta, não altera a altura reservada da área e recebe `motion-reduce:animate-none`; assim, pessoas que preferem menos movimento veem o mesmo estado informativo sem rotação contínua.

## Cobertura

A regressão renderizada confirma que um refetch ativa o indicador, mantém a Home montada e inclui a proteção para redução de movimento.
