# Diagnóstico de produção — ativos e mapa

## Observações verificadas em 27 de agosto de 2026

- A página publicada `https://flightplan-hq655wm9.manus.space/` respondeu com HTTP 200 e CSP que permite as duas origens CloudFront utilizadas pelos ativos e o host `https://*.tile.openstreetmap.org`.
- A URL atual do logo LATAM respondeu com HTTP 200, porém com `Content-Type: application/octet-stream` e `X-Content-Type-Options: nosniff`. Esse MIME genérico não é uma base robusta para exibição de imagens em todos os navegadores e deve ser substituído por ativos publicados com tipo de imagem correto pelo armazenamento do projeto.
- O tile `https://a.tile.openstreetmap.org/4/5/6.png` respondeu com `X-Blocked: Access denied. See https://operations.osmfoundation.org/policies/tiles/`. O mapa administrativo usa esse endpoint no momento; essa é a causa reproduzível da área de mapa sem base cartográfica no ambiente publicado.
- O tile alternativo `https://a.basemaps.cartocdn.com/light_all/4/5/6.png` respondeu com HTTP 200 e `Content-Type: image/png` durante a verificação.

## Decisão de correção

Migrar os logos de companhia para os ativos estáveis do projeto, usando referências `/manus-storage/` e fallback textual, e trocar o provedor base do Leaflet para Carto Positron com atribuição explícita. A política de conteúdo deve permitir o host Carto. O mapa deve informar claramente quando o provedor de tiles estiver indisponível.

## Evidência adicional — falha persistente em produção

- A estratégia anterior não corrigiu a publicação. Na Home publicada, todos os elementos `<img>` que usam `/manus-storage/` finalizaram com `complete: true`, mas `naturalWidth: 0` e `naturalHeight: 0`; o mesmo logo na pré-visualização de desenvolvimento decodificou como `180 × 180`.
- A rota `/manus-storage/*` não entrega bytes pelo domínio da aplicação: ela responde `307` para uma URL assinada no CloudFront. Embora uma requisição de terminal consiga seguir o redirecionamento e encontre `Content-Type: image/png`, o navegador publicado reporta erro de imagem e uma leitura `fetch` com redirecionamento seguido falha por CORS.
- O problema não é o cache do PWA: após remover o service worker da sessão de diagnóstico, os recursos redirecionados continuaram falhando. Um `data:` image de controle decodificou normalmente.
- Um tile Carto que responde `200 image/png` em terminal também falhou no navegador publicado. Assim, a correção precisa evitar recursos visuais que dependam de origem externa ou de redirecionamento, servindo bytes e MIME pelo próprio domínio da aplicação.

## Causa final e correção aplicada

- O domínio publicado reserva o prefixo `/manus-storage/*`: mesmo após o servidor do projeto passar a transmitir bytes nesse caminho, a URL pública continuou respondendo `307` para o CloudFront. Por isso a correção não poderia permanecer nesse prefixo.
- A entrega same-origin foi mantida no endpoint próprio `/smartfly-assets/*`, que não é reservado pela publicação. Logos, ícones PWA, favicons, metadados sociais, imagens de fundo, notificações push e novas mídias passam a usar essa rota.
- A rota transmite os bytes obtidos da URL assinada, preserva `Content-Type`, tamanho, cache seguro e suporte a `Range`; assim o navegador só recebe conteúdo visual sob o domínio da aplicação.
- Os tiles do mapa também continuam sob o domínio da aplicação em `/map-tiles/*`, removendo dependência de imagens externas no cliente.

## Fontes

- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Carto Basemaps](https://carto.com/basemaps/)
