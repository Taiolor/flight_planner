# Auditoria de responsividade das telas administrativas

## Escopo

Foram revisadas as rotas administrativas de **Notificações** e **Locais · Telemetria** em 320 px, 375 px e 390 px, incluindo estados de acesso, cabeçalhos, formulários, listas, histórico, filtros e mapa.

## Ajustes aplicados

| Área | Ajuste para celular |
| --- | --- |
| Cabeçalho compartilhado | Ações administrativas passam a ocupar linha própria em celular, evitando colisão com título e navegação. |
| Próximo alerta e histórico | Resumo de alerta se empilha; histórico usa linhas flexíveis com data em linha própria no celular. |
| Alertas agendados | Legenda extensa fica disponível a partir do breakpoint `sm`, preservando título e chevron em telas estreitas. |
| Formulários de e-mail | Controles de adicionar, testar e voltar tornam-se botões de largura total no celular; envio de teste se empilha. |
| Mapa de telemetria | Filtros de período formam grade de três ações e o mapa reduz a altura para 360 px em celular. |
| Listas de alertas | Linhas adotam alinhamento superior, horário flexível e status fora da competição por largura. |

## Resultado

As auditorias finais das duas rotas em 320 px, 375 px e 390 px confirmaram ausência de overflow horizontal ou interno. Os ajustes preservam tabelas e ações completas em desktop, com arranjos próprios para toque e leitura em celular.
