# Auditoria de loading e hover — 16/09/2026

A revisão visual dos componentes integrados confirmou que a Home mantém a hierarquia azul/navy e que os controles do cabeçalho continuam acessíveis em desktop e mobile. A página de Cotações mantém o skeleton e o fade-in de conteúdo, com cards semanais legíveis e sem overflow horizontal observado em 390 px.

As novas microinterações usam transformações curtas, sombras leves, feedback de estado de mutação e `motion-reduce` para desativar movimento quando solicitado. O popup de notificações expõe `aria-busy` durante o salvamento; o botão de compartilhamento por e-mail comunica envio em andamento; e as cotações comunicam busca, salvamento e exclusão por semana ou registro.

As capturas de 1280 px e 390 px não substituem testes funcionais de autenticação nem interação hover real em dispositivo touch. A validação automatizada cobre o skeleton, o estado acessível do popup e a responsividade existente de Cotações.


As capturas adicionais de 320 px e 375 px mantiveram os títulos quebrados de forma legível, o seletor de ano acessível e os cards semanais dentro da largura disponível. Não foi observado overflow horizontal nos estados públicos da página de Cotações.
