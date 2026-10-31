# Validação do alerta de cancelamento

O alerta de teste foi disparado pelo serviço já integrado **Resend**, reutilizando `sendTicketNotificationEmail`. A resposta do serviço confirmou a aceitação do envio para um destinatário ativo configurado no sistema.

| Aspecto | Resultado |
| --- | --- |
| Provedor de envio | Resend |
| Tipo de alerta | Cancelamento de voo de ida |
| Conteúdo | Semana de teste, trecho, alteração de status de Ativo para Cancelado |
| Aceitação pelo serviço | Confirmada |

Nenhuma consulta ou integração com Gmail foi utilizada na validação final.
