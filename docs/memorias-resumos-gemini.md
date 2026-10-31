# Resumos de voo com Fly.IA

## Funcionamento

No **Diário de Bordo**, cada cartão de viagem possui a seção **Resumo Fly.IA**. Ao abrir essa seção pela primeira vez em uma viagem que ainda não possui texto salvo, o SmartFly solicita um resumo ao Gemini 3.6 Flash e o persiste por exercício e semana. A ação **Atualizar resumo** permite gerar uma nova versão quando necessário.

O resumo já existente é reutilizado nas próximas visualizações. Assim, abrir novamente o mesmo voo não causa outra chamada à API, exceto quando o usuário escolhe atualizá-lo.

## Contexto e privacidade

O Gemini recebe somente a rota, o período, companhia quando informada, distância e situação de cada trecho. O processo não encaminha localizadores, e-mails, terminais, dados de sessão, identificadores internos, preços ou milhas.

> O resumo é uma narrativa factual curta. O modelo é instruído a não inventar acontecimentos, atrasos, experiências pessoais ou qualquer informação ausente no contexto fornecido.

## Persistência e custo

O texto, o modelo utilizado, a impressão criptográfica do contexto e a data de geração são armazenados em `flight_memory_summaries`. As anotações e mídias do usuário continuam em suas tabelas próprias, sem serem alteradas pelo resumo automático.

Cada geração bem-sucedida registra apenas a contagem de tokens no monitoramento do orçamento Gemini. As regras de orçamento interno, alertas e bloqueio preventivo aplicam-se também a essa funcionalidade.

## Operação

| Situação | Comportamento |
|---|---|
| Primeiro acesso ao resumo de uma viagem | Gera e salva automaticamente. |
| Resumo já disponível | Exibe o texto persistido, sem nova chamada. |
| Atualização manual | Gera uma nova versão e substitui o texto salvo. |
| Orçamento interno atingido | Informa o bloqueio e não realiza a chamada. |
| Falha temporária do Gemini | Exibe mensagem de indisponibilidade; o usuário pode tentar novamente. |
