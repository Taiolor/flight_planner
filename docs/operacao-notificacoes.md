# Operação de notificações push

O envio automático de alertas de voo está ativo no site publicado por meio de um callback autenticado. A tarefa é idempotente: uma repetição da plataforma não reenvia a mesma notificação para o mesmo voo, trecho e janela de aviso.

| Item | Configuração |
| --- | --- |
| Nome | `flight-notifications` |
| Identificador da tarefa | `VEiGK3igrK6ekWF3SoQYFi` |
| Frequência | A cada hora, no minuto zero (UTC) |
| Callback | `POST /api/scheduled/flight-notifications` |
| Escopo de dados | Ano atual; inclui o próximo ano nos últimos três dias de dezembro |

Para consultar, pausar ou remover a tarefa, utilize o painel de agendamentos do projeto ou a administração da plataforma com o identificador acima.
