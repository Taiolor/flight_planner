# Disponibilidade de Passagens Adicionais por Mês

O painel de passagens adicionais é renderizado ao final de cada cartão semanal visível para usuários autenticados. A lista de cartões é originada de `sortedWeeks`, que deriva dos filtros de mês, status do bilhete, companhia, preço e horário. A ampliação deve preservar os filtros de consulta, mas expor um ponto de inclusão de passagem adicional também nos cartões de semanas já emitidas e tornar a ação visível no cabeçalho de cada agrupamento mensal disponível.

Os meses são apresentados como agrupamentos recolhíveis e os cartões semanais também possuem expansão própria. Portanto, a ação atual fica descoberta somente após abrir o mês e o cartão da semana. A interface deve oferecer a inclusão diretamente no cabeçalho de cada semana exibida, sem depender do status de emissão do bilhete principal.
