# Skeleton de carregamento do Fly.IA

O chat Fly.IA expõe o estado pendente por `chatMutation.isPending` e já o repassa ao componente `AIChatBox`. O skeleton de resposta será renderizado no próprio painel durante esse estado, com anúncio acessível de carregamento e usando o primitive compartilhado `Skeleton`, preservando os tokens visuais e evitando deslocamento de layout.

O indicador não representa uma resposta parcial nem registra conteúdo adicional na conversa. Ele desaparece assim que a mutation é concluída, com sucesso ou erro.

O skeleton ocupa o mesmo alinhamento da bolha do assistente, depois da última mensagem e antes do campo de envio. Ele substitui o spinner isolado por linhas de texto simuladas, mantendo `role="status"`, texto para leitor de tela e animação desativada para pessoas que preferem reduzir movimento.

Na prévia de desenvolvimento, o skeleton foi verificado no mesmo alinhamento da mensagem do assistente, abaixo da pergunta do usuário e sem deslocar o campo de envio, tanto em 1280×720 quanto em 375×812. A prévia foi removida antes da entrega.
