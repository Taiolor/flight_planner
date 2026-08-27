# Diagnóstico de produção — ativos e mapa

## Observações verificadas em 27 de agosto de 2026

- A página publicada `https://flightplan-hq655wm9.manus.space/` respondeu com HTTP 200 e CSP que permite as duas origens CloudFront utilizadas pelos ativos e o host `https://*.tile.openstreetmap.org`.
- A URL atual do logo LATAM respondeu com HTTP 200, porém com `Content-Type: application/octet-stream` e `X-Content-Type-Options: nosniff`. Esse MIME genérico não é uma base robusta para exibição de imagens em todos os navegadores e deve ser substituído por ativos publicados com tipo de imagem correto pelo armazenamento do projeto.
- O tile `https://a.tile.openstreetmap.org/4/5/6.png` respondeu com `X-Blocked: Access denied. See https://operations.osmfoundation.org/policies/tiles/`. O mapa administrativo usa esse endpoint no momento; essa é a causa reproduzível da área de mapa sem base cartográfica no ambiente publicado.
- O tile alternativo `https://a.basemaps.cartocdn.com/light_all/4/5/6.png` respondeu com HTTP 200 e `Content-Type: image/png` durante a verificação.

## Decisão de correção

Migrar os logos de companhia para os ativos estáveis do projeto, usando referências `/manus-storage/` e fallback textual, e trocar o provedor base do Leaflet para Carto Positron com atribuição explícita. A política de conteúdo deve permitir o host Carto. O mapa deve informar claramente quando o provedor de tiles estiver indisponível.

## Fontes

- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Carto Basemaps](https://carto.com/basemaps/)
