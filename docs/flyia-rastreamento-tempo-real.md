# Rastreamento de voo externo no Fly.IA

## Escopo

O **SmartFly continua sendo a fonte exclusiva** para data, hora, terminal, status registrado e demais dados do planejamento. O rastreamento externo é apenas uma ação complementar para abrir uma página pública do Flightradar24; o SmartFly não consulta, importa, armazena ou replica posições de aeronaves.

## Implementação aprovada

Quando o Fly.IA identifica o próximo voo emitido e o número do voo tem formato compatível, ele oferece a ação **Rastrear no Flightradar24**. O link abre uma nova aba em:

```text
https://www.flightradar24.com/data/flights/{número-do-voo}
```

Por exemplo, `LA 3000` abre a página pública do voo `la3000`. A página do Flightradar24 aceita o número de voo no caminho e apresenta histórico e, quando disponível, informações de rastreamento. [1]

O Fly.IA valida o endereço antes de exibir a ação: exige HTTPS, o domínio `www.flightradar24.com` e o caminho `/data/flights/{número}`. O link usa `noopener noreferrer` e não aparece quando não há número de voo válido.

> A posição ou situação exibida pelo Flightradar24 é externa e transitória. Ela não altera a data, a hora, o status ou qualquer dado persistido no SmartFly.

## Privacidade e licenciamento

Esta versão não chama API, não usa token, não automatiza a página pública e não salva conteúdo do rastreador. O usuário abre a página diretamente no navegador. Caso haja evolução futura para dados dentro do SmartFly, será necessária uma API oficial licenciada; os termos do Flightradar24 proíbem automação e scraping da interface pública. [2]

## Referências

[1]: https://www.flightradar24.com/data/flights/la3000 "Flightradar24 — Página pública de voo"
[2]: https://www.flightradar24.com/terms-of-service "Flightradar24 — Termos de Serviço"
