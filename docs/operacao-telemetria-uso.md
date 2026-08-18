# Operação da telemetria de uso

Os eventos consentidos de uso são retidos por no máximo 30 dias. A limpeza é feita por callback autenticado no site publicado e é idempotente: caso a plataforma repita uma execução, somente registros já expirados são considerados.

| Item | Configuração |
| --- | --- |
| Nome | `usage-telemetry-cleanup` |
| Identificador da tarefa | `Pq8C7gpCKyqjZp3F4AWRkm` |
| Frequência | Diariamente às 03:30 UTC |
| Callback | `POST /api/scheduled/usage-telemetry-cleanup` |
| Retenção | 30 dias |
| Proteção | Identidade cron validada pelo servidor |

O agendamento pode ser consultado, pausado ou removido pelo painel de agendamentos do projeto usando o identificador registrado acima.
