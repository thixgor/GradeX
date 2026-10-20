# DomineAqui — regras de custo para quem mexe neste repositório

O site roda na Vercel, região São Paulo (gru1), cobrado por uso. Os preços que
mais pesam: **Fast Origin Transfer US$ 0,41/GB** (todo byte que sai de uma
função), **Build CPU** (todo push em `master` é um build de produção) e memória
provisionada das funções (tempo de parede de cada requisição).

## Push e deploy

- **Agrupe os commits e dê um push só** no fim do trabalho. Cada push em
  `master` constrói o site inteiro — uma rajada de 15 pushes de conteúdo são 15
  builds para publicar o mesmo site.
- Precisa dar push no meio do caminho? Ponha **`[sem deploy]`** na mensagem do
  commit da ponta. O próximo push sem a marca publica tudo junto (ver
  `vercel-ignore-build.sh`).
- Mudança só em `*.md`, `docs/`, `__tests__/`, `scripts/`, `server/` não
  constrói (regra 4 do mesmo script).
- Catálogo novo com uma página por item (sinal, caso, marcador…):
  `generateStaticParams` devolve `[]` e a página nasce na primeira visita. Só
  pré-gere no build o que é pequeno e muito visitado (ver "Páginas sob
  demanda" em `next.config.js`). Página `force-dynamic` não leva
  `generateStaticParams`: o build visitaria cada item à toa.

## Código que sai das funções

- Layout ou página da área logada não lê sessão no servidor (`getSession`,
  `cookies()`): a árvore inteira vira `ƒ` e cada visita sai da função (60–80
  KB de HTML sem compressão). O casco é estático, o portão de seção é no
  cliente (`components/portao-de-secao.tsx`) e quem decide o acesso ao dado é a
  API. Rota com id (`[id]`) ganha `generateStaticParams` devolvendo `[]`.
- Resposta grande em JSON: use `jsonComprimido` (`lib/resposta-comprimida.ts`).
  No Vercel o Next não comprime dentro da função, e o CDN não comprime
  `application/pdf`.
- Leitor de PDF: a página entregue é a derivada enxuta
  (`lib/material-pdf-enxugar.ts`, `lib/material-pdf-pages.ts`); a miniatura é
  outra variante, mais leve. Não sirva a página bruta. Rota chamada por página
  checa o acesso com `validateMaterialPdfAccessComMemoria`.
- Imagem que não passa pelo `next/image` (e-mail, PDF gerado, JSON-LD) vai no
  tamanho em que é exibida: `public/logo.png` tem 512 px e 71 KB; o original
  fica em `img/`.
- Polling no cliente: `useIntervaloVisivel` / `agendarEnquantoVisivel`
  (`hooks/use-intervalo-visivel.ts`) — nada de `setInterval` que roda com a
  aba oculta.
- Nada de `createIndex` a cada requisição: garanta uma vez por instância
  (ver `garantirIndicesDoProgresso` em
  `app/api/flashcards/manual/[id]/reviews/route.ts`).
- Consultas independentes ao Mongo saem num `Promise.all`, não em fila.
- Dado igual para todo mundo (configuração, catálogo) lido a cada requisição:
  `memoizarPorTempo` (`lib/cache-de-servidor.ts`), invalidado por quem grava.
- `checkRateLimit` já conta na memória antes de ir ao banco (tetos ≥ 20 por
  minuto); não acrescente um segundo limitador por cima.
