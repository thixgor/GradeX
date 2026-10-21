# Build sem source maps do servidor

Medida de `experimental.serverSourceMaps: false` só no `next build`, na branch do
Next 16.4.2 + Turbopack (a partir de `eed8bb12`, com os 3 workers e o pré-render
sem mapas de `docs/build-coleta-e-geracao.md`). Pergunta: deixar de gerar os
`.map` do servidor encurta o build e o cache de build sem mudar o site?

## Resposta curta

Sim, pouco no relógio e bastante no cache:

- **Cache do Turbopack: 614 → 484 MB (−130 MB, −21%)**, e o `.next/server`
  de 446 para 245 MB. São 5.273 arquivos `.map` (201 MB) que deixam de existir.
- **A frio: −4,9 s** (77,7 → 72,8 s). Com cache, sem mudança: −2,6 s; com
  mudança em `lib/utils.ts`: −2,2 s. Desses dois, ~0,8 s são da limpeza do
  `.next` antigo, que só existe na máquina local; na Vercel sobra **~1,5 s por
  build com cache**.
- O JS das funções, o HTML/RSC pré-gerados, os estáticos do cliente, os traces
  e a tabela de rotas saem iguais.
- Em dinheiro, direto: ~US$ 0,0004 por build com cache e ~US$ 0,001 por build a
  frio (a US$ 0,0035/CPU-min × 4 vCPU). O que pesa mais é o cache caber com
  folga no teto da Vercel (ver "Cache de build").

Ficou no `next.config.js` como `serverSourceMaps: false`, só quando o processo é
um `next build` e `MAPAS_NO_PRERENDER` não está ligado.

## Medidas

Método do repo: `next build` preso a 4 núcleos
(`cmd /c start "" /affinity F /b /wait node node_modules\next\dist\bin\next build`),
3 workers, `MONGODB_URI` num Mongo local e `JWT_SECRET` falso. Cada variante com
o seu próprio `.next` (trocado por rename entre os builds), para intercalar
também os builds com cache. "Com mapas" é o `next.config.js` de `eed8bb12`. As
fases são do `.next/trace`; algumas se sobrepõem (a gravação do cache roda junto
com a coleta).

### A frio (sem `.next`), 2 de cada

| | Com mapas | Sem mapas |
| --- | --- | --- |
| Processo inteiro | 77,8 · 77,6 s | 75,1 · 70,5 s |
| `run-turbopack` (compilação) | 57,6 s | 52,8 s |
| ↳ `turbopack-emit` | 14,2 s | 12,8 s |
| ↳ `turbopack-persistence` | 7,7 s | 6,0 s |
| `static-check` (coleta) | 11,1 s | 10,2 s |
| `static-generation` | 6,5 s | 6,4 s |
| Cache do Turbopack depois | 614 MB | 484 MB |
| `.next/server` | 446 MB (5.273 `.map`, 201 MB) | 245 MB (nenhum `.map`) |

### Com cache, sem mudança de código, 3 de cada

| | Com mapas | Sem mapas |
| --- | --- | --- |
| Processo inteiro | 24,7 · 23,2 · 24,7 s | 23,9 · 20,4 · 20,6 s |
| `clean` (só local) | 3,7 s | 2,8 s |
| `run-turbopack` | 5,3 s | 4,3 s |
| `static-check` | 6,6 s | 6,4 s |
| `static-generation` | 6,5 s | 6,2 s |
| Cache do Turbopack depois | 607 · 617 · 628 MB | 479 · 489 · 498 MB |

O primeiro de cada série inclui a compactação do cache (`turbopack-compaction`,
5,1 s com mapas e 3,8 s sem, em paralelo).

### Com cache, mudança em `lib/utils.ts`, 3 de cada

Cada par recebeu a mesma linha nova (`export const marcaDaMedida = '…'`).

| | Com mapas | Sem mapas |
| --- | --- | --- |
| Processo inteiro | 37,1 · 37,2 · 35,8 s | 35,4 · 34,1 · 33,9 s |
| `clean` (só local) | 3,6 s | 2,9 s |
| `run-turbopack` | 18,5 s | 17,7 s |
| `static-check` | 6,7 s | 6,0 s |
| Cache do Turbopack depois | 640 · 651 · 663 MB | 509 · 520 · 530 MB |

O cache cresce no mesmo ritmo nas duas variantes: ~10 MB por build sem mudança
e ~11 MB com mudança. A diferença de ~130 MB fica constante.

## Cache de build

O cache que a Vercel guarda tem teto de 1,5 GB na máquina Standard, contando o
`node_modules` (871 MB). Com mapas, o cache do Turbopack nasce em 614 MB:
1.485 MB no total, já encostado no teto, e passa dele em 4 ou 5 builds se a
Vercel contar o tamanho sem compressão (se contar 1,5 × 10⁹ bytes, já nasce
acima). Sem mapas: 1.355 MB, ~180 MB de folga, uns 16 builds.

`prepararCacheDeBuild` reinicia o cache do Turbopack acima de 800 MB. Com os
números de agora, isso é um build a frio a cada ~17 builds com mapas e a cada
~29 sem. E 871 + 800 MB passa do teto se ele contar o tamanho sem compressão —
a linha do cache no log do primeiro deploy é o que diz qual é o caso. Se for,
o teto de `prepararCacheDeBuild` terá de baixar para ~660 MB: com mapas, isso
seria reiniciar o cache a cada 4 ou 5 builds; sem mapas, a cada ~16.

Menos 130 MB também é menos a restaurar no começo e a subir no fim de cada
build da Vercel. Isso não dá para medir aqui.

## Conferido

Comparando os dois `.next` depois do último par de builds (mesmo código):

- **Tabela de rotas**: as 864 linhas iguais nos 16 builds, a frio e com cache.
  Nenhum aviso novo.
- **Pré-gerados** em `.next/server/app` (`.html`, `.rsc`, `.meta`, segmentos,
  `.body`): 5.189 arquivos, iguais com o BUILD_ID normalizado. O único diferente
  é o `sitemap.xml`, só no `<lastmod>`, e os `middleware-manifest.json`, só nas
  chaves sorteadas a cada build (BUILD_ID, chave das Server Actions, preview).
- **JS do servidor**: 6.085 arquivos, os mesmos nomes. Tirando a linha
  `//# sourceMappingURL=` do fim, só o runtime do Turbopack (`[turbopack]_runtime.js`,
  do Node e do SSR) difere: perde um comentário `/*#__PURE__*/` e duas linhas em
  branco. Nenhum chunk de rota muda.
- **Traces** (`.nft.json`): 809 funções, 307.767 caminhos, listas idênticas.
  Nenhum `.map` aparece neles nem antes.
- **Estáticos do cliente** (`.next/static`): 550 arquivos, iguais. Os mapas do
  navegador já não eram gerados (`productionBrowserSourceMaps: false`).
- **Manifestos** (`prerender`, `routes`, `app-paths`, `build`, `images`) iguais.
  O `required-server-files.json` difere só em `experimental.serverSourceMaps`.
- **`serverSourceMaps` contra `turbopackSourceMaps`**: a medida foi feita com
  `turbopackSourceMaps: false`; um build com a configuração final
  (`serverSourceMaps: false`) sobre o mesmo cache saiu com o mesmo JS do
  servidor, os mesmos traces e estáticos e nenhum `.map`. Num desses builds o
  `admin/analytics.html` veio com os metadados em outra posição do HTML (o
  `.rsc` igual): corrida do streaming de metadados no pré-render, entre duas
  variantes sem mapas.
- **`next start`**: o mesmo erro (POST em `/api/auth/login` com JSON malformado,
  que cai no `console.error`) imprime a mesma pilha com e sem mapas, apontando
  para `.next/server/chunks/…js:1:309`. O servidor de produção do Next só liga
  `--enable-source-maps` no `next dev` e nos workers de pré-render, e o
  `findSourceMap` do Node não devolve nada sem essa flag. Nenhum
  `NODE_OPTIONS` no projeto, nenhum Sentry ou similar, nada no código lê `.map`.
- **`next dev`**: não recebe a chave (o `argv` não tem `build`), gera os mapas
  (49 `.map` em `.next/dev/server` depois de abrir `/`) e a mesma pilha sai como
  `app\api\auth\login\route.ts:30:18`, com o trecho do código.
- Os testes que carregam o `next.config.js` (`apg-pagina`, `cover-image-hosts`)
  passam.

## O que muda de fato: as funções Edge

O construtor da Vercel (`@vercel/next`, `getMiddlewareBundle` →
`getNextjsEdgeFunctionSource` → `fileToSource` em `sourcemapped.ts`) lê o
`.map` ao lado de cada chunk das funções Edge e monta um `index.js.map` para a
função. São o `middleware.ts` (1 MB de mapas hoje) e as duas rotas Edge
(`/api/image-proxy` e o tile do zoom da histologia, ~1,6 MB cada). Sem os
`.map`, ele monta o mapa a partir do próprio chunk compilado. O código da função
não muda (ele já tira o comentário `sourceMappingURL`); muda que uma pilha de
erro dessas funções, se aparecer no log da Vercel, aponta para o código
compilado e não para o `.ts`. As funções Node não são afetadas: o trace não leva
os `.map` e o construtor cria as funções Node com `shouldAddSourcemapSupport:
false`.

## Por que `serverSourceMaps` e não `turbopackSourceMaps`

No Turbopack (`crates/next-core/src/next_config.rs`), os mapas do servidor são
`turbopackSourceMaps ?? serverSourceMaps ?? true`, e os do navegador
`turbopackSourceMaps ?? productionBrowserSourceMaps` no build. No build as duas
chaves dão o mesmo resultado, mas `turbopackSourceMaps: false`:

- desligaria também os mapas do navegador se alguém ligar
  `productionBrowserSourceMaps` para depurar, sem aviso;
- passaria por cima do `next build --debug-prerender`, que liga
  `serverSourceMaps`.

## Para depurar

`MAPAS_NO_PRERENDER=1 npm run build` volta a gerar os `.map` do servidor e faz o
pré-render usá-los — as duas coisas juntas, porque uma sem a outra não serve.
`next build --debug-prerender` também gera os mapas.
