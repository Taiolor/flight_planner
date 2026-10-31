# Validação das extensões de geolocalização

## Escopo

A localização atual agora registra a precisão aproximada quando o navegador fornece `coords.accuracy`, desenha um círculo de precisão no mapa e oferece um controle acessível para remover o marcador pessoal. A precisão é apresentada em metros ou quilômetros, sem persistência em navegador ou banco.

## Validações executadas

- Teste focado de `OpenStreetMap`: 5 testes aprovados.
- Suíte completa: 801 testes aprovados e 2 ignorados intencionalmente.
- TypeScript: aprovado.
- Build de produção: aprovado.
- Revisão estrutural do controle: foco visível, alvo mínimo de 44 px, nomes acessíveis e remoção reversível.

## Limitação da revisão visual

A rota administrativa `/admin/telemetria` exigiu sessão interna durante a captura visual e exibiu a mensagem de proteção quando não autenticada. A renderização autenticada do mapa deve ser confirmada em um dispositivo móvel com permissão de localização concedida. O recurso não solicita nem armazena a localização sem a ação explícita do usuário.
