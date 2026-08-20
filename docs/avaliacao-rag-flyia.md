# Avaliação de RAG para o Fly.IA

## Estado atual

O Fly.IA já reúne, a cada pergunta não determinística, um contexto factual do exercício selecionado: resumo das viagens, segmentos emitidos, dados de compras, orçamento, milhas e voos adicionais. Ele também limita o histórico da conversa a oito mensagens. Perguntas sobre o próximo voo seguem um caminho determinístico que consulta os campos persistidos diretamente, sem chamar o modelo.

Essa estratégia é adequada para dados transacionais que mudam com frequência. Um RAG não deve substituir consultas estruturadas para o próximo voo, datas, horários, status, valores ou milhas, pois a base relacional permanece a fonte de verdade.

## Onde RAG agrega valor

Uma camada de recuperação semântica torna-se útil para conteúdo longo e pouco estruturado: textos do Diário de Bordo, resumos gerados pelo Fly.IA, observações de viagens, documentos de regras de viagem, anexos e, futuramente, legendas ou transcrições de fotos e vídeos. Nesses casos, ela recupera poucos trechos relevantes em vez de enviar todo o acervo à Gemini.

## Recomendação

Adotar primeiro uma arquitetura híbrida, sem RAG na primeira etapa:

1. Manter consultas determinísticas para fatos operacionais de voos e finanças.
2. Persistir um resumo compacto por conversa e reutilizá-lo apenas na sessão e no exercício corretos.
3. Medir `inputTokens`, latência e perguntas sem resposta no painel Gemini.
4. Introduzir RAG somente ao indexar conteúdo textual longo, usando embeddings com metadados obrigatórios de exercício, semana, tipo de fonte e permissões.

Quando o RAG for necessário, o índice deve recuperar no máximo alguns trechos curtos, sempre filtrados pelo exercício selecionado. Isso reduz tokens e melhora a relevância sem sacrificar a precisão de dados estruturados.

## Alternativas técnicas

| Necessidade | Estratégia recomendada |
| --- | --- |
| Próximo voo, horários, status, valores e milhas | Consulta estruturada determinística ao banco |
| Continuidade da conversa curta | Histórico limitado mais resumo de sessão persistido |
| Memórias, observações e documentos longos | RAG com embeddings e filtro de exercício/permissão |
| Contexto grande e repetido | Cache de contexto, após medir tamanho e repetição |

## Fontes

- Google AI for Developers: [Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- Google AI for Developers: [Context caching](https://ai.google.dev/gemini-api/docs/caching)
