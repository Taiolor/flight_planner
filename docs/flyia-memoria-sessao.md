# Memória de sessão do Fly.IA

## Objetivo

O Fly.IA mantém uma memória compacta por **sessão autenticada** e **exercício selecionado** para dar continuidade a conversas longas sem reenviar todo o histórico à Gemini. Esta etapa antecede uma eventual camada RAG e não substitui as consultas factuais ao banco.

## O que é persistido

Após uma resposta não determinística, o SmartFly acrescenta somente o texto já devolvido pelo assistente a um resumo temporário. Perguntas brutas do usuário não são persistidas. Antes de salvar, e-mails e localizadores identificados são redigidos. A memória é limitada a 2.400 caracteres, recebe uma chave hash da sessão e expira após 8 horas.

Dados operacionais como próximo voo, data, horário, status, valor e milhas continuam no caminho determinístico do banco de dados. Assim, não dependem da memória nem da Gemini para permanecerem exatos.

## Uso no prompt

Quando existe memória válida, o Fly.IA envia o resumo e apenas as duas mensagens mais recentes. Sem memória, envia o histórico recente já limitado pela aplicação. O contexto factual do exercício continua sendo a fonte de verdade.

## Observabilidade

O painel **Gemini · Orçamento** exibe, para administradores e em janela de 30 dias:

- sessões temporárias ativas;
- conversas medidas;
- caracteres médios poupados no histórico enviado;
- latência e tokens médios;
- conversas sem resposta.

O painel armazena somente métricas agregáveis; não exibe conteúdos de perguntas ou respostas.

## Gatilho para RAG

RAG será considerado quando o Diário de Bordo, observações, documentos ou mídias transcritas acumularem conteúdo textual suficiente para que enviar o acervo inteiro se torne caro ou pouco relevante. O índice deverá usar embeddings com filtros obrigatórios de exercício, tipo de fonte e permissão. Consultas estruturadas continuam obrigatórias para fatos transacionais.
