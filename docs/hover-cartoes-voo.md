# Interatividade dos cartões de voo

Os cartões do bloco **Planejamento por semanas** recebem uma elevação leve, sombra ampliada, borda azul e destaque da rota quando o cursor passa sobre eles. A seta de continuidade avança de forma curta para reforçar a possibilidade de abrir a semana no Calendário.

Em teclados, a ligação interna preserva o anel de foco visível. Em dispositivos com redução de movimento, as transições e os deslocamentos são removidos. Em telas táteis, onde não há hover persistente, a composição permanece estável e a ação continua disponível pelo toque no cartão.

As verificações visuais confirmaram que a estrutura dos cartões preserva hierarquia e legibilidade nos layouts desktop e móvel. A regressão de componente cobre as classes de hover, o estado de redução de movimento e a grade responsiva.
