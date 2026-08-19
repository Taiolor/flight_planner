# Arquitetura do Fly.IA

O **Fly.IA** é o assistente conversacional do SmartFly. A primeira versão usa o **Gemini 2.5 Flash** pelo backend da aplicação, sem expor a chave de API ao navegador. O assistente tem finalidade exclusivamente informativa: responde a perguntas sobre o exercício de planejamento selecionado e não altera compras, reservas, bilhetes ou qualquer dado operacional.

## Fluxo de uma pergunta

| Etapa | Responsabilidade | Controle aplicado |
|---|---|---|
| Interface | O botão flutuante abre uma janela de chat acessível em qualquer rota. | Visitantes veem o atalho, mas precisam entrar antes de abrir a conversa. |
| Autorização | A mutation `flyIa.chat` exige a sessão interna de passagens. | Usuários sem sessão recebem `UNAUTHORIZED`; a chave Gemini nunca chega ao cliente. |
| Contexto | O servidor consulta agregados de memórias, finanças e voos adicionais para o ano escolhido. | O recorte não contém localizadores, e-mails, tokens, terminais ou identificadores internos. |
| Modelo | O backend envia somente histórico recente e contexto factual ao Gemini 2.5 Flash. | O prompt determina português do Brasil, proíbe invenção de dados e ignora instruções inseridas nos dados. |
| Resposta | O conteúdo é devolvido à janela de chat como texto. | Há limite de 10 perguntas por minuto por sessão e falhas do provedor são traduzidas para erro seguro. |

## Dados enviados ao modelo

O contexto contém trechos emitidos com data/hora, aeroportos, companhia, número de voo, status e distância; totais de compras, milhas e companhias; e voos adicionais resumidos. Ele permite responder a perguntas sobre próximo voo, cancelamentos, cidades, distâncias, compras e planejamento anual sem transferir o banco inteiro.

> **Dados excluídos:** localizadores de ida e volta, endereços de e-mail, credenciais, cookies, identificadores de sessão, terminais e campos internos de banco.

## Operação e privacidade

O projeto precisa usar a chave `GEMINI_API_KEY` criada em um projeto Google AI Studio com faturamento ativo. A modalidade paga da Gemini API declara que prompts e respostas não são usados para melhorar produtos da Google; ainda assim, o SmartFly minimiza o contexto enviado e evita recursos de busca externa.[1]

O Fly.IA não deve ser interpretado como fonte independente de dados. As respostas devem refletir exclusivamente o contexto do exercício selecionado; se um dado estiver ausente, a orientação do sistema é declarar a limitação em vez de inferir ou inventar uma resposta.

## Verificação

Os testes automatizados cobrem validação da credencial, redução do histórico, limitação de uso, redação de localizadores, construção do prompt e tratamento de resposta ou falha do provedor. A suíte deve ser executada com `pnpm test`, e a compilação de produção com `pnpm build`.

## Referências

[1]: [Google — Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms)
[2]: [Google — faturamento e modalidade paga da Gemini API](https://ai.google.dev/gemini-api/docs/billing)
[3]: [Google — preços do Gemini API](https://ai.google.dev/gemini-api/docs/pricing)
