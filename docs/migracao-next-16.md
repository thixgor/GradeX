# Migração para Next 16 + Turbopack

Branch `claude/next16-turbopack` (local, sem push). De Next 14.2.33 + React 18 +
webpack para **Next 16.4.2 + React 19.3.1 + Turbopack**, com o objetivo de cortar
o Build CPU da Vercel. Já inclui o `master` até `ab3772e4` (merge `db9fb419`).

## Ganho medido

`next build` na mesma máquina, preso a 4 núcleos (afinidade `0xF`, herdada pelos
workers — o equivalente às 4 vCPUs da máquina Standard da Vercel), com o mesmo
ambiente de mentira (`MONGODB_URI`/`JWT_SECRET` falsos) nos dois lados.

| Cenário | Next 14 + webpack | Next 16 + Turbopack | Redução |
| --- | --- | --- | --- |
| A frio (sem `.next`) | 210 s · 199 s | 93 s · 91 s · 89 s | **−55%** |
| Com cache, sem mudança de código | 110 s · 103 s | 38 s · 38 s · 39 s | **−64%** |
| Com cache, mudança em `lib/utils.ts` (230 importadores) | 130 s · 125 s | 51 s · 51 s · 51 s | **−60%** |

- Pico de memória do build: ~5,7 GB (webpack) → ~5,0 GB (Turbopack). A máquina
  Standard da Vercel tem 8 GB.
- Mesmo sem cache nenhum, o Turbopack (≈91 s) é mais rápido que o webpack com
  cache (≈106 s).
- Por fase, no Turbopack: compilação 58 s a frio e **5,7 s com cache**. O que
  sobra dos ~38 s é "Collecting page data" e a geração das 352 páginas
  estáticas — igual nos dois empacotadores, e o próximo lugar onde cortar.

**Na Vercel (estimativa, a confirmar):** hoje são ~22 CPU-min por build. Se o
`next build` cair na mesma proporção e instalação/upload ficarem como estão, o
build vai para algo em torno de 10–13 CPU-min (≈ US$ 0,03–0,04 a menos por build
a US$ 0,0035/CPU-min). O número real aparece em Usage → Build CPU a partir do
segundo deploy — o primeiro é a frio.

## O que mudou

| Commit | O quê |
| --- | --- |
| `f8970a92` | `next` 16.4.2, `react`/`react-dom` 19.3.1, `@types/react(-dom)` 19, `react-hook-form` 7.90 (não é usado no código). `lucide-react` fica na 0.303 — nenhum ícone muda —, com `overrides` porque o peer dele só declara React ≤ 18. |
| `f0ec5d02` | `params`/`searchParams` assíncronos: codemod oficial `next-async-request-api` em 216 arquivos, devolvido ao estilo do repo (sem `;`, aspas simples, LF). À mão: default `searchParams = {}` que o codemod perdeu em `webpath-utah/[capitulo]`; tipo do helper `idDe` em `estudos/[id]`; três testes passando `params` em `Promise`; saiu `app/api/aulas/modulos/[id]/layout.ts` (arquivo só de comentário numa pasta só de rotas de API — o validador de tipos do 16 exige `default` em todo layout). `cookies()`/`headers()` já eram todos `await`. |
| `6278fb7d` | `next.config.js`: sem `webpack()` e sem as flags de worker do webpack; `outputFileTracingIncludes` no topo; a libvips do `sharp` declarada no trace das rotas do leitor de PDF e do upload (ver "Achados"); `staleTimes.dynamic = 30` (o padrão do Next 14; o 15 baixou para 0); sai a chave `eslint`. `tailwind.config.ts`: `blocklist` para `[-:.TZ]` (regex de `lib/comms/email-campaigns.ts` que o scanner transformava em CSS inválido, e o parser de CSS do Turbopack recusa o arquivo inteiro). `tsconfig.json`: `jsx: react-jsx` e `.next/dev/types`, exigidos pelo 16. Tipos do React 19: `RefObject<T \| null>` em 9 hooks/componentes e `useRef` com valor inicial. |
| `9d177af8` | Lint: o `next lint` saiu do 16. `npm run lint` = `eslint app components lib` (os diretórios que o `next lint` olhava), ESLint 9 + `eslint-config-next` 16 em `eslint.config.mjs`. As regras do React Compiler que o `eslint-plugin-react-hooks` 7 liga ficam desligadas (eram ~570 erros novos sobre compatibilidade com um compilador que o projeto não usa). |
| `62942af2` | `.vercelignore`: `eslint.config.mjs` fora do upload, como o `.eslintrc`. |
| `aa423969` | `prepararCacheDeBuild` no `next.config.js`, só no `next build`: apaga o `.next/cache/webpack` órfão e reinicia o cache do Turbopack acima de 800 MB (ver "Achados"). |
| `db9fb419` | Merge do `master` (`5d916535`, `ab3772e4`). Um conflito em `app/manual-clinico/[slug]/layout.tsx`; os arquivos novos já vinham com `params` assíncrono. |

E o `CLAUDE.md` ganhou duas regras: o cache de build do Turbopack e a conferência
do trace quando uma função carrega binário nativo ou lê arquivo do disco.

## Achados que teriam quebrado algo

1. **`sharp` sem a libvips nas funções do leitor de PDF.** O trace do Turbopack
   leva o `.node` mas não a biblioteca nativa (o webpack levava). Copiando só os
   arquivos do trace da rota `pdf-viewer/page` para uma pasta vazia — como a
   Vercel monta a função —, o `sharp` não carrega; com a declaração, carrega.
   O sintoma em produção seria silencioso: `lib/material-pdf-enxugar.ts` cai no
   plano B e serve as páginas sem reduzir as imagens (mais Fast Origin Transfer).
2. **Chave `[id]` em `outputFileTracingIncludes` não casa no Turbopack** (é
   classe de caracteres no glob dele). As duas regras da Histopatologia
   deixavam de valer sem erro; hoje os `.json.gz` só entravam pelo rastreio
   natural. Agora as chaves usam `*`.
3. **Cache de build acima do teto.** O teto da máquina Standard é 1,5 GB e
   inclui o `node_modules` (871 MB no Next 16). O cache do Turbopack começa em
   ~610 MB, não comprime e cresce ~12 MB por build com mudança (medido: 607 →
   654 MB em 4 builds); no primeiro deploy viriam junto os 520 MB do cache do
   webpack restaurado. Acima do teto a Vercel não guarda o cache, e todo build
   seria a frio. Resolvido por `prepararCacheDeBuild` — conferir no log do
   primeiro deploy.
4. **CSS inválido gerado pelo Tailwind** (`.\[-\:\.TZ\]{-:.TZ}`) derrubava o
   build do Turbopack logo de saída.

## O que foi conferido

- **Tipos:** `tsc --noEmit` sem erros (a base tinha 1).
- **Testes:** `vitest run` com os mesmos 4 arquivos / 27 testes falhando que já
  falham no Windows (ecg/gestos, histopatologia/webpath-utah,
  manual-clinico/integracao/indice-gerado, vercel-ignore-build); 4.759 passam.
- **Lint:** 79 erros / 117 avisos contra 76 / 105 na base — as mesmas 99
  `exhaustive-deps`, 75 `no-unescaped-entities` e 6 `alt-text`; a diferença é
  das duas regras novas do Next 16 (`no-html-link-for-pages`,
  `no-location-assign-relative-destination`). Nos 251 arquivos alterados, o
  mesmo resultado da base mais 1 aviso de regra nova.
- **Tabela de rotas:** mesma classificação estática / SSG / dinâmica nas ~800
  rotas, salvo duas rotas GET de API que o Next 15+ deixa de congelar no build:
  `/api/display-settings` (passa a ser função atrás do `s-maxage=300` que ela já
  mandava — a configuração do admin vale em até 5 min, e não só no próximo
  deploy) e `/api/admin/games/error-hunt/topics` (lista do admin, congelada no
  build até hoje).
- **Traces:** 806 funções comparadas com a base, 307 mil caminhos, todos
  existentes; os HTML lidos com `readFileSync` (APG, landings, e-books) e o
  catálogo da Histopatologia continuam entrando.
- **`next start` lado a lado** (Next 14 na 3200, Next 16 na 3201, mesmo Mongo
  descartável, aluno e admin de teste): 60+ rotas como visitante, aluno e admin
  com os mesmos status, redirecionamentos e títulos; página sob demanda gera na
  1ª visita e vem do cache na 2ª (MISS → HIT); slug inexistente dá 404;
  `sitemap.xml` idêntico (fora `lastmod`). Login, `/dashboard`, `/provas`,
  `/banco-questoes`, `/exam/[id]`, Icterícia (Manual sob demanda), navegação no
  cliente e a casca do leitor de PDF conferidos no navegador.
- **Bytes que saem da função** (sem compressão, que é como a Vercel conta o
  Fast Origin Transfer): nas 73 rotas dinâmicas, HTML −0,6% e navegação RSC
  −10,6%. Comprimido o payload fica um pouco maior (os nomes de chunk do
  Turbopack se repetem menos), o que não pesa na origem.
- **Hidratação:** 1 erro #418 na sequência dashboard → prova → Icterícia, contra
  11+ (#418, #422, #423) no Next 14 — o descompasso já existia; o React 19 o
  reporta menos.
- **`npm ci`** limpo a partir do lockfile; binários linux-x64 (gnu e musl) do
  Next e do `sharp` registrados.

## Mudanças de comportamento que ficam

- **Prefetch do roteador novo:** cada `<Link>` visível vira 2 pedidos (árvore
  da rota + dados) em vez de 1 com a página inteira. Abrindo o `/dashboard`:
  31 pedidos e 215 KB contra 15 pedidos e 424 KB. Com os cascos estáticos que
  entraram no `master`, todas as rotas desse prefetch são estáticas — saem do
  CDN, sem invocar função. Vale olhar Function Invocations nos primeiros dias.
- `/auth/register` passa a mandar o `Location` no 307 (antes redirecionava só no
  cliente).
- `Cache-Control` que o `next start` manda nas páginas estáticas perdeu o
  `stale-while-revalidate` sem prazo (mudança do Next 15). Na Vercel quem decide
  o cache das páginas pré-geradas é a plataforma.

## Mantido de propósito

- **`middleware.ts` continua `middleware.ts`** (Edge). O Next 16 o marca como
  deprecado em favor de `proxy.ts`, mas `proxy` só roda em Node.js — trocar
  muda runtime, latência e cobrança do portão de autenticação, que roda em toda
  requisição. É decisão à parte.
- As 2 rotas em Edge Runtime (`/api/image-proxy` e o tile do zoom da
  histologia) seguem em Edge; o build avisa que o Edge Runtime está deprecado.
- `next-themes` 0.2.1, `lucide-react` 0.303, `typescript.ignoreBuildErrors`.
- React Compiler e Cache Components desligados.

## Não testado aqui

- **Leitor de PDF ponta a ponta:** ele lê o PDF do Vercel Blob, que precisa de
  token real. O ponto de risco da migração (empacotamento do `sharp`) foi
  testado isolado.
- **O comportamento do cache de build na Vercel** (se o teto conta tamanho
  comprimido ou não) e o Build CPU real.
- `next dev` com Turbopack (só `build` e `start` foram exercitados).
- Node na Vercel precisa ser ≥ 20.9.

## Como publicar

1. (Recomendado) Um deploy de preview antes de mexer em produção: subir a branch
   com um nome que **não** comece com `claude/` (a regra 1 do
   `vercel-ignore-build.sh` pula preview dessas branches). Custa um build e
   mostra o Build CPU real, a linha do cache no log, e permite abrir um PDF de
   verdade no leitor.
2. Merge em `master` e **um push só** (CLAUDE.md). O primeiro build de produção
   é a frio.
3. Voltar atrás é reverter o merge.
