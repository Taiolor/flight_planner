# Entrada por voz do Fly.IA

## Objetivo

A entrada por voz permite que uma pergunta seja ditada no computador ou no celular. A fala é **transcrita para português do Brasil** e inserida como texto editável no campo do chat. A pergunta não é enviada automaticamente: a pessoa pode revisar, corrigir ou complementar o texto antes de acionar o envio normal do Fly.IA.

## Fluxo

1. A pessoa seleciona o botão de microfone do campo de pergunta.
2. O navegador solicita permissão de acesso ao microfone e grava áudio pelo `MediaRecorder`.
3. A gravação é limitada a 60 segundos e a rota de envio aceita até 5 MB.
4. O áudio é enviado à rota protegida `POST /api/flyia/voice-upload`, associado a um prefixo derivado do hash da sessão interna de voo.
5. O procedimento protegido `flyIa.transcribeVoice` valida a propriedade da chave, obtém uma URL temporária de leitura e solicita a transcrição pelo serviço de voz configurado no servidor.
6. O texto transcrito preenche o campo do chat e segue, após confirmação manual, pelo mesmo fluxo de perguntas já existente.

## Formatos e experiência

O cliente tenta priorizar `audio/webm;codecs=opus`, com alternativas compatíveis oferecidas pelo navegador. Caso o recurso não esteja disponível, a interface explica que a pessoa pode digitar a pergunta. Falhas de permissão, captura, envio ou transcrição recebem mensagens em português e não expõem detalhes internos.

Os estados de gravação e transcrição são anunciados no controle do microfone. A ação para finalizar a gravação é distinta e acessível por teclado. O texto resultante permanece inteiramente editável.

## Privacidade e retenção

O áudio não é salvo em tabelas de aplicação, e o modelo Gemini não recebe o arquivo de áudio: recebe apenas a pergunta textual quando a pessoa decide enviá-la. A chave temporária é restrita à sessão que realizou o envio.

> A exclusão física automática dos objetos `flyia-voice/` ainda depende de uma política de ciclo de vida do armazenamento ou de uma operação de remoção suportada pelo provedor. Essa configuração deve ser concluída antes de classificar a retenção como descarte garantido.

## Cobertura de regressão

Os testes verificam a propriedade da chave de áudio, o sucesso e a falha segura da transcrição no servidor, os estados e a prévia editável do controle de voz e a simulação completa de captura, upload e preenchimento da pergunta no widget.
