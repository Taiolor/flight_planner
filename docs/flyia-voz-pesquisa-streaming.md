# Pesquisa: transcrição em fluxo sem armazenamento para o Fly.IA

## Evidências consultadas

| Fonte | Constatação relevante |
| --- | --- |
| [MDN — Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) | O reconhecimento padrão é baseado em servidor; o navegador pode oferecer processamento no dispositivo mediante pacote de idioma, `processLocally` e suporte do navegador. |
| [Especificação Web Speech API](https://webaudio.github.io/web-speech-api/) | `SpeechRecognition` expõe `continuous`, `interimResults`, resultados finais/parciais e `processLocally`; a especificação permanece um relatório comunitário em evolução. |
| `webdev-voice-transcription` | O Whisper retorna uma transcrição completa e não oferece WebSocket nem processamento incremental de bytes no helper integrado. |

## Conclusão preliminar

O requisito de **não armazenar o áudio no SmartFly** é viável com `SpeechRecognition` no navegador. O modo usual pode transmitir áudio ao serviço do navegador e, portanto, não equivale a processamento local. Quando disponível, o modo `processLocally` com pacote `pt-BR` evita o envio a um serviço remoto, mas não tem suporte uniforme.

O Whisper atualmente utilizado pelo servidor não é streaming em tempo real. O helper do SmartFly passou a aceitar o buffer da requisição diretamente, eliminando a URL e o armazenamento de objetos, mas o texto continua sendo devolvido após o término da gravação. Para resultados parciais enquanto a pessoa fala ainda seria necessário trocar de modelo ou provedor.

## Direção candidata

Implementar uma estratégia em camadas:

1. Preferir reconhecimento local do navegador quando `processLocally` e o pacote de ditado `pt-BR` estiverem disponíveis.
2. Usar reconhecimento contínuo do navegador sem armazenamento no SmartFly quando apenas essa API estiver disponível, deixando claro que o processamento é realizado pelo serviço do navegador.
3. Manter Whisper em memória como o caminho atual, sem persistir o áudio, até que seja escolhido um provedor de streaming compatível com a política de privacidade.
