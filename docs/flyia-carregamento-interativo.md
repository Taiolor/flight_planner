# Carregamento interativo do Fly.IA

## Comportamento

Enquanto uma resposta está pendente, o Fly.IA mantém o esqueleto de três linhas e acrescenta uma mensagem de estado alternada entre análise da pergunta, consulta das informações e organização da resposta. As mensagens descrevem atividade possível, mas **não exibem percentuais ou uma estimativa de progresso**, pois o provedor não fornece progresso real da geração.

O indicador usa pulso suave no ícone e três pontos sequenciais. A animação é desativada para pessoas que ativaram `prefers-reduced-motion`; o texto de status continua disponível para leitores de tela por `role="status"` e `aria-live="polite"`.

## Verificação visual

A página principal permaneceu estável em **1280 px**, **320 px**, **375 px** e **390 px** após a alteração, sem deslocamento horizontal e com a navegação e os cartões preservados. Em 375 px e 390 px, os controles superiores e as ações da central continuaram em fluxo vertical e alcançáveis. O diálogo autenticado do Fly.IA não foi aberto na sessão pública de verificação; o comportamento interno de espera e a alternância de estado foram cobertos por teste renderizado.
