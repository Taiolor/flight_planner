# Verificação da regressão do mapa

Em 05/09/2026, a rota `/admin/telemetria` foi capturada em 1280×720 e 390×844. O ambiente exibiu corretamente a tela protegida de Telemetria, sem a mensagem `API Key Required`; a verificação autenticada do mapa fica condicionada à sessão administrativa.

O endpoint local `/map-tiles/4/5/6.png` respondeu HTTP 200, `Content-Type: image/png`, 313 bytes e `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.

A implementação usa exclusivamente o proxy `/map-tiles/:z/:x/:y.png` para `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. O service worker foi versionado para `smartfly-v8`, registra `/sw.js?v=20260905-map-osm` e não reutiliza respostas antigas para `/map-tiles/`, evitando cache de tiles legados.

Validações concluídas: testes focados 10/10; suíte 796 testes aprovados e 2 ignorados; TypeScript e build de produção aprovados.

Observação: referências textuais encontradas com `carto` são falsos positivos da palavra portuguesa `cartográfica` em mensagem de fallback, não URLs nem configurações do Carto.
