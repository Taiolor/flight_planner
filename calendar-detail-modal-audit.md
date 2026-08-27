# Auditoria do modal de detalhe do bilhete

## Evidência inicial — 27/08/2026

O detalhe de um bilhete de ida e volta pode renderizar, em cada trecho, resumo do destino, métricas diárias, leitura horária, comparação origem-destino, nascer e pôr do sol, alertas e link da fonte. Em conjunto, os dois blocos tornam o modal mais alto que a área disponível em telas compactas e deslocam o controle de fechamento para uma posição de difícil alcance.

O botão **Ocultar alertas / Ver alertas** apenas alterna a renderização dos avisos meteorológicos; ele não reduz as métricas, a previsão horária nem a comparação. Como esse objetivo não está claro no próprio controle e duplica a intenção de reduzir detalhes, ele deve ser removido. A solução deve preservar o resumo de condição, o controle **Ocultar detalhes** por trecho, a informação essencial do bilhete e um botão de fechar fixo dentro do cabeçalho do modal.

## Validação local — 27/08/2026

O card agora apresenta somente **Ocultar detalhes / Ver detalhes**. A ação conserva o resumo da condição e alterna apenas o conteúdo complementar do respectivo trecho; alertas relevantes aparecem junto ao conteúdo detalhado quando este estiver aberto. O modal usa altura máxima baseada no viewport e corpo com rolagem interna. Seu cabeçalho não participa da rolagem e contém um botão de fechar de 40 px, preservando acesso por toque, foco e teclado.

Após remover a preferência local e abrir um bilhete de ida e volta, os dois trechos iniciaram compactos, com resumo e ação **Ver detalhes**. Não houve controle de alertas no modal. O botão de fechar permaneceu visível no canto superior do cabeçalho enquanto todo o conteúdo essencial e os atalhos de agenda permaneceram disponíveis no corpo.

## Ordem operacional — 27/08/2026

Em cada trecho, a sequência passa a ser identificação do voo, status, **localizador**, **rastrear voo** e, somente então, **clima no destino**. Assim, as informações necessárias para localizar e acompanhar a passagem permanecem próximas entre si, enquanto a previsão fica disponível logo abaixo como contexto de viagem.

## Auditoria móvel — 27/08/2026

Em **320 px** e **375 px**, o cabeçalho mantém o controle de valores visível como ícone independente na segunda linha, ao lado de Preferências, sem comprimir o seletor de ano ou as ações primárias. O modal passa a se alinhar no início da área segura da tela, usa a altura visual segura (`svh`) e permite rolagem no contêiner externo e no corpo interno. Com isso, o cabeçalho do diálogo e seu botão de fechar de 40 px não deixam a área clicável em telas baixas ou com barras do navegador móveis.
