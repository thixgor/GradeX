# Custos na Vercel — o que foi medido e o que foi feito

Referência: fatura de agosto/2026, plano Pro. **US$ 31,94** de infraestrutura,
US$ 20 cobertos pelo crédito incluído, US$ 11,91 pagos.

## Onde o dinheiro estava

| Item | Quantidade | Custo | % |
|---|---|---|---|
| **Build CPU Minutes** | 4d 13h | **US$ 22,09** | **69%** |
| Fast Origin Transfer | 10,49 GB | US$ 3,72 | 12% |
| Fluid Provisioned Memory | — | US$ 1,79 | 6% |
| Fluid Active CPU | 7h 41m | US$ 1,68 | 5% |
| Observability Events | 874.962 | US$ 1,05 | 3% |
| Blob Data Transfer | 10,64 GB | US$ 0,78 | 2% |
| Todo o resto somado | — | US$ 0,83 | 3% |

Dois terços da conta eram build. Não porque o build seja lento — porque ele
**nunca aproveitava cache**.

## A causa principal: o cache de build não cabia no limite

O cache de filesystem do webpack deste projeto ocupava **1,9 GB** sem
compressão (1,4 GB só do `server-production`, que carrega as 429 rotas de API).
O cache de build da Vercel tem **teto de 1 GB**: acima disso ele não é guardado.

Consequência: todo deploy do mês recompilou o projeto inteiro do zero.

Medições feitas nesta máquina (4 núcleos, igual à máquina de build padrão do
plano Pro):

| | antes | depois |
|---|---|---|
| Cache do webpack | 1,9 GB — acima do teto, descartado | **352 MB** — cabe |
| Build a frio | 140 s | 149 s (+9 s da compressão) |
| Build com cache | *não existia* | **66 s** |

`compression: 'gzip'` no cache do webpack (`next.config.js`). Nove segundos a
mais no build frio compram builds incrementais de 66 s no lugar de 140 s — que
é o que a Vercel passa a fazer em todo deploy.

## As demais mudanças

**Não gastar build com commit que não muda o site** — `ignoreCommand` em
`vercel.json`. Commit que só toca `.md`, `.txt`, `docs/`, `__tests__/` ou
configuração de editor não vira build. Nos 75 commits dos últimos 60 dias a
regra ignoraria 4 e construiria 71.

O comando é `git diff --quiet` com pathspecs de exclusão, escrito direto no
`vercel.json`:

```
git rev-parse HEAD~1 >/dev/null 2>&1 && git diff --quiet HEAD~1 HEAD -- ':(exclude)*.md' ... || exit 1
```

`git diff --quiet` já usa a convenção da Vercel: sai 0 quando não há diferença
(ignora o build) e 1 quando há (constrói). O `git rev-parse` na frente cobre o
clone raso sem `HEAD~1`, e o `|| exit 1` no fim garante que **qualquer** falha
— pathspec inválido, git ausente, o que for — vire "constrói", nunca um código
de saída que a Vercel interprete como build quebrado.

> Duas armadilhas custaram um deploy vermelho antes de acertar. A primeira: a
> Vercel trata exit 127 como **falha do build**, não como "construa" — a regra
> de "qualquer código diferente de 0 constrói" não vale para todos os códigos.
> A segunda: a primeira versão vivia em `scripts/vercel/ignorar-build.sh`, e o
> `.vercelignore` exclui `scripts/`. Re-incluir com `!scripts/vercel/` não
> funciona, porque a regra é a mesma do `.gitignore` — não se re-inclui o que
> está dentro de um diretório já excluído. O comando inline não depende de
> arquivo nenhum e some com as duas.

**Índices do Mongo fora do caminho da requisição** — `lib/mongodb.ts` disparava
114 chamadas de `createIndex` **em toda instância fria de toda função**,
recriando índices que existiam desde a primeira partida. Fluid Compute cobra
memória provisionada pelo tempo em que a instância está ativa. Agora a lista
vive em `lib/mongodb-indexes.ts` e roda por `npm run db:indexes` (ou com
`MONGODB_ENSURE_INDEXES=1`); em desenvolvimento continua automático.

> A lista estava **duplicada** dentro de `lib/mongodb.ts` — uma cópia para
> desenvolvimento, outra para produção — e as duas tinham divergido: produção
> não criava `users.cpf` nem os três de `medicamentos`; desenvolvimento não
> criava nenhum dos de pagamento. O arquivo único é a união das duas (114
> índices). **Rode `npm run db:indexes` uma vez contra produção** para criar os
> quatro que faltavam lá.

**Cache nos acervos estáticos** — arquivo em `public/` sem `Cache-Control` sai
da Vercel como `max-age=0, must-revalidate`: o navegador revalida a cada visita
e a revalidação atravessa até a origem. São ~370 MB servidos assim (240 MB do
Atlas de Anatomia, 106 MB das séries de tomografia, modelos 3D, catálogo de
patologia). Agora têm cache imutável, como `/img/` já tinha.

**As três páginas HTML grandes** (`/apg`, `/ecorj-ebook`,
`/prescricao-real-no-sus`) são arquivos de 8–11 MB lidos do disco e devolvidos
pela função. Estavam com `s-maxage=3600`: cada região da borda voltava à origem
de hora em hora para buscar os mesmos megabytes. Agora `s-maxage=31536000` —
seguro porque cada deploy da Vercel tem chave de cache própria e a borda parte
fria.

**Middleware fora dos estáticos** — o matcher agora exclui `atlas-anatomia/`,
`models/`, `fonts/`, `pwa/`, `patologia/`, ícones e manifesto. Foram 442.643
requisições de borda em agosto; verificar sessão numa prancha de anatomia só
gastava CPU. O matcher está coberto por teste de mesa nos 27 caminhos reais.

**Memória das funções** — o catch-all `app/api/**/*.ts` não declarava `memory` e
herdava os 2048 MB padrão do Fluid. Passou para 1024 MB. As nove rotas que
manipulam arquivo (upload, PDF, exportação) receberam `memory: 2048`
explicitamente, que é o que já tinham por herança — nenhuma regride.

## O que ainda depende do painel (não dá para fazer por arquivo)

1. **Máquina de build** — Settings → Build & Deployment. Build CPU é cobrado por
   núcleo × minuto; com o cache funcionando, uma máquina menor pode sair mais
   barata. Vale medir depois de um mês com as mudanças acima.
2. **Deploys de preview** — cada push em qualquer branch constrói. Se as branches
   `claude/*` e afins não são revisadas por preview, desligar previews para elas
   corta builds direto.
3. **Observability** — 874.962 eventos por US$ 1,05. Há controle de amostragem
   no painel.
4. **Spend Management** — vale configurar um teto com aviso, para não descobrir
   o gasto só na fatura.
5. **Speed Insights e Analytics** estão montados em `app/layout.tsx`. Não
   aparecem como linha própria nesta fatura, mas se os dados não são usados,
   removê-los tira JS do cliente e eventos da conta.
