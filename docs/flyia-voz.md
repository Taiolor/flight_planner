# Entrada por voz do Fly.IA

## Objetivo

A entrada por voz permite que uma pergunta seja ditada no computador ou no celular. A fala é **transcrita para português do Brasil** e inserida como texto editável no campo do chat. A pergunta não é enviada automaticamente: a pessoa pode revisar, corrigir ou complementar o texto antes de acionar o envio normal do Fly.IA.

## Fluxo

1. A pessoa seleciona o botão de microfone do campo de pergunta.
2. O navegador solicita permissão de acesso ao microfone e grava áudio pelo `MediaRecorder`.
3. A gravação é limitada a 60 segundos e a rota de envio aceita até 5 MB.
4. O áudio é enviado à rota protegida `POST /api/flyia/voice-transcribe`, que valida sessão, formato e tamanho antes de encaminhá-lo ao Whisper.
5. O servidor mantém os bytes somente na memória da requisição, chama o serviço Whisper configurado e sobrescreve o buffer recebido ao terminar.
6. O texto transcrito preenche o campo do chat e segue, após confirmação manual, pelo mesmo fluxo de perguntas já existente.

## Formatos e experiência

O cliente tenta priorizar `audio/webm;codecs=opus`, com alternativas compatíveis oferecidas pelo navegador. Caso o recurso não esteja disponível, a interface explica que a pessoa pode digitar a pergunta. Falhas de permissão, captura, envio ou transcrição recebem mensagens em português e não expõem detalhes internos.

Os estados de gravação e transcrição são anunciados no controle do microfone. A ação para finalizar a gravação é distinta e acessível por teclado. O texto resultante permanece inteiramente editável.

## Privacidade e retenção

O áudio não é salvo em tabelas de aplicação nem no armazenamento de objetos, e o modelo Gemini não recebe o arquivo de áudio: recebe apenas a pergunta textual quando a pessoa decide enviá-la. O buffer do upload existe apenas durante a requisição protegida que o encaminha ao Whisper.

> Esta integração mantém o mecanismo Whisper atual, mas não é streaming incremental: o navegador conclui a gravação, envia o bloco de áudio pela conexão segura e o servidor o encaminha ao Whisper sem persistência. Para legendas parciais enquanto a pessoa fala seria necessário um provedor de transcrição em tempo real, diferente do Whisper atual.

## Cobertura de regressão

Os testes verificam sessão, formato permitido, sucesso e falha segura da transcrição em memória, o descarte do buffer, os estados e a prévia editável do controle de voz e a simulação completa de captura, envio e preenchimento da pergunta no widget.
