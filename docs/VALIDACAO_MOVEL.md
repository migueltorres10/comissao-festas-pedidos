# Validação móvel — 20 de outubro de 2026

Versão da cache: `pedidos-v12`. Testes sobre a build de produção com o subdiretório do GitHub Pages.

## Resultado

- 6 testes unitários aprovados (totais, migração, preços guardados e valores recebidos em cêntimos).
- 12 testes de interface aprovados, sem falhas nem testes ignorados.
- WebKit com emulação de iPhone: duas colunas, cartões sem sobreposição, cabeçalho e total estáveis, scroll, painéis, campo de recebimento focado, troco, vários pedidos, persistência, administração e offline.
- Chromium com input tátil: gestos verticais deslocam categorias e artigos; último cartão acessível.
- Capturas analisadas antes e após a correção. Removida a transparência da animação dos painéis, que deixava o texto de fundo visível.

## Medição real da lista de 30 artigos (WebKit)

Valores em píxeis CSS. A página mantém a altura do viewport; a lista é o contentor que se desloca.

| Viewport | Altura visível da lista | Conteúdo total | scrollTop no fim | Borda direita da lista |
| --- | ---: | ---: | ---: | ---: |
| 320 × 568 | 353 | 1962 | 1609 | 320 |
| 375 × 667 | 452 | 1990 | 1538 | 375 |
| 390 × 844 | 629 | 1990 | 1361 | 390 |
| 430 × 932 | 717 | 1990 | 1273 | 430 |
| 768 × 1024 | 809 | 1990 | 1181 | 768 |
| 1280 × 800 | 616 | 802 | 186 | 896 (painel de pedido à direita) |

O catálogo sintético usa 12 categorias e 30 artigos. Em telemóveis as categorias também excedem a área visível e o scroll muda efetivamente de posição. Em tablet/computador as categorias podem caber sem precisar de scroll.

## Recebimento

O teste verifica foco imediato, `inputmode="decimal"`, impossibilidade de concluir com valor insuficiente e troco de 7,60 € para um total de 2,40 € com 10,00 € recebidos. A confirmação retira só o pedido ativo. Cancelar preserva-o. Não se usam `prompt`/`confirm` do navegador no recebimento ou na limpeza.

## Limites da emulação

Não foi utilizado um iPhone físico. O formato visual exato do teclado do iOS e o efeito das barras do Safari/Chrome iOS precisam de confirmação no dispositivo. Foram verificados o motor WebKit, atributos do teclado, foco e utilização do painel com altura reduzida.

Repetir: `npm test` e `npm run test:ui`. Capturas e relatório JSON em `test-results/` (ignorado pelo Git).
