# Telemetria de uso e localização aproximada

## Finalidade e escopo

A telemetria de uso mede apenas o funcionamento do Smart Fly e a utilização de recursos, como mudança de rota, interação explícita, consulta tRPC e mutação tRPC. Ela não registra campos digitados, valores de preços, localizadores, conteúdo de formulários, parâmetros de URL, endereço IP, identificação do dispositivo ou localização precisa.

## Consentimento e localização

A coleta é desligada por padrão. O usuário precisa habilitá-la por um controle visível e específico, válido somente para a sessão atual do navegador. Ao consentir, a aplicação solicita a localização do navegador uma única vez e reduz cada coordenada para duas casas decimais antes de transmiti-la, resultando em precisão aproximada de quilômetros, não de metros. Caso a permissão seja negada, os eventos continuam sem coordenadas.

| Dado | Tratamento |
| --- | --- |
| Interação | Tipo técnico limitado, sem texto, campo ou payload |
| Rota | Apenas pathname sem parâmetros |
| Consulta e mutação | Nome do procedimento, sem entradas ou respostas |
| Localização | Latitude e longitude arredondadas a 2 casas decimais |
| Identidade | Nenhum nome, e-mail, IP ou identificador persistente do usuário |
| Consentimento | Efêmero, restrito à sessão do navegador |

## Acesso, retenção e exclusão

Somente a sessão administrativa interna pode consultar o mapa e os agregados. Os dados expiram automaticamente após 30 dias; o painel também oferece exclusão imediata dos eventos da sessão atual. A limpeza periódica é idempotente e roda fora do processo web, por callback autenticado após a publicação da versão que a contém.

> A telemetria não deve ser usada para acompanhamento individual de pessoas. O mapa representa padrões operacionais aproximados de eventos para fins de manutenção e desempenho.

## Validação implementada

O acesso sem sessão interna foi validado na rota administrativa: a página não consulta nem mostra eventos e apresenta somente o acesso interno. Testes automatizados confirmam o arredondamento de coordenadas, o descarte de valores inválidos, a remoção de parâmetros de rota, a pseudonimização do nonce de sessão e o bloqueio do mapa a uma sessão não administrativa.

Após a correção de ordem de hooks, a rota protegida foi reaberta em desenvolvimento sem sessão interna e permaneceu estável, exibindo somente a tela de acesso. A tela autenticada passou a ser montada em componente separado, evitando a alternância de conjuntos de hooks durante a transição de autenticação.
