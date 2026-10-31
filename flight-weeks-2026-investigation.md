# Diagnóstico: consulta de semanas de 2026

- A Home foi recarregada em `/?from_webdev=1` após o erro reportado e respondeu sem erro no console, exibindo as semanas de 2026.
- A projeção SQL completa usada por `flights.getWeeks` executou com sucesso diretamente contra `flight_weeks` para `year = 2026`.
- A tabela contém 44 registros para 2026 e expõe todos os campos projetados pela consulta.
- A correção deve preservar a consulta tipada atual e reforçar a recuperação de uma falha transitória, sem ocultar divergências de schema.

Após a atualização, a Home foi carregada novamente em `/?from_webdev=1`. O Resumo Anual e as semanas 25, 26 e 27 foram renderizados normalmente, sem erro registrado no console do navegador.
