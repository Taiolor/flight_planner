# Validação do controle de localização do mapa

A tela `/admin/telemetria` foi verificada em 1280×720 e 390×844. O controle de localização integra o componente do mapa e permanece disponível quando a sessão administrativa está autenticada; no estado não autenticado, a página exibe corretamente a mensagem de telemetria protegida.

O botão usa um alvo mínimo de 44 px, nome acessível, tooltip nativo, estado `aria-busy` durante a leitura do GPS e feedback de sucesso/erro em região `role=status`. A centralização utiliza `navigator.geolocation.getCurrentPosition` com baixa precisão, cache de 15 minutos e timeout de 10 segundos. A animação de `flyTo` é desativada quando `prefers-reduced-motion` está ativo.

Testes focados: 4 aprovados. Suíte completa: 798 aprovados e 2 ignorados. TypeScript e build de produção aprovados.

Observação: a captura visual não acionou o GPS porque o ambiente de preview estava sem sessão administrativa; a permissão, sucesso e erro foram exercitados no teste unitário do componente.
