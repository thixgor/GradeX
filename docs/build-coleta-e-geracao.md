# "Collecting page data" e "Generating static pages" no Next 16

Investigação das duas fases do `next build` que vêm depois da compilação, na
branch do Next 16.4.2 + Turbopack. Pergunta: dá para cortar Build CPU da Vercel
nelas sem mudar o site?

## Resposta curta

Quase nada. A medida anterior estava inflada pela própria máquina de teste:

- Preso a 4 núcleos numa máquina de 20, o Next sobe **19 workers** — o padrão é
  `os.cpus().length - 1`, e `os.cpus()` não enxerga a afinidade. Na Vercel,
  `os.cpus()` é o número de núcleos da máquina (um projeto em máquina de 2
  núcleos registra "using 1 worker" no log), então a Standard roda com
  **3 workers**.
- Com 3 workers, as duas fases levam **~13,5 s** com cache, e não ~30 s. O
  `next build` inteiro com cache fica em ~23 s, dos quais ~3,5 s são de apagar
  o `.next` antigo no Windows — passo que na Vercel não tem o que apagar.
- 13,5 s × 4 vCPU ≈ 0,9 CPU-min ≈ **US$ 0,003 por build**. Mesmo zerando as
  duas fases, a economia seria essa.

Ficaram duas mudanças no `next.config.js`, nenhuma com efeito nas funções nem
no HTML gerado:

1. `experimental.cpus` passa a ser `os.availableParallelism() - 1`. Na Vercel
   dá o mesmo número do padrão (3); aqui, com afinidade, passa a dar 3 também.
   Isso faz a medida local valer para a Vercel. Também protege se o build um
   dia rodar num contêiner que enxergue os núcleos do hospedeiro.
2. `enablePrerenderSourceMaps: false`: os workers deixam de ler o `.map` de
   cada chunk do servidor que carregam. **−1,4 s por build com cache** (−10%
   nas duas fases), cerca de 0,1 CPU-min por build.

## Medidas

Mesmo método da migração: `next build` preso a 4 núcleos
(`cmd /c start "" /affinity F /b /wait node node_modules\next\dist\bin\next build`),
`MONGODB_URI` apontando para um Mongo local e `JWT_SECRET` falso. "Antes"
é a configuração da branch do Next 16 com 3 workers, que é como a Vercel roda
hoje. Para reproduzir, use `MAPAS_NO_PRERENDER=1`, que religa os mapas. As
rodadas foram intercaladas (antes, depois, antes…).

### Com cache, sem mudança de código

| | 19 workers (medida anterior) | Antes, 3 workers | Depois |
| --- | --- | --- | --- |
| Processo inteiro | 40,3 s · 36,4 s | 23,5 · 24,1 · 23,8 · 24,3 s | 22,4 · 21,9 · 22,4 · 23,8 s |
| Collecting page data | 18,5 s · 16,4 s | 6,9 s (média de 4) | 6,05 s |
| Generating static pages (352) | 9,7 s · 10,1 s | 6,6 s | 6,1 s |
| Compilação (Turbopack) | 5,8 s · 4,6 s | 5,1 s | 5,0 s |
| Limpeza do `.next` (só local) | 3,5 s | 3,6 s | 3,6 s |

CPU somada dos 3 workers (instrumentada, 2 builds de cada): 36,1 s → 31,6 s
(−12%). Na coleta, 15,1 → 12,35 s; na geração, 21,0 → 19,25 s.

### A frio (sem `.next`)

| 19 workers | Antes, 3 workers | Depois |
| --- | --- | --- |
| 91,3 s | 84,1 · 77,6 s | 84,4 · 78,3 s |

A frio a diferença fica dentro do ruído. A gravação do cache do Turbopack
(~7 s, no processo principal) roda junto com a coleta e embaralha as duas
fases.

### Número de workers

Com cache e 4 núcleos: 3 workers dão 22,0–22,7 s; 4 workers, 23,2–23,3 s.
O padrão (núcleos − 1) já é o melhor. Concorrência de páginas por worker
(`staticGenerationMaxConcurrency` 1 contra o padrão 8, os dois sem mapas) não
muda a CPU da geração (19,7 s contra 19,25 s).

## Para onde vai o tempo

Perfil de CPU dos 3 workers, num build com cache (37,5 s amostrados):

- **Carregar módulos**: são 809 rotas, das quais 537 são de API. Para cada uma,
  o worker carrega o bundle só para ler a configuração. A mediana é 8 ms por
  rota; 11 s de CPU no total. No perfil inteiro, ~9,7 s são chamadas de disco
  do loader do Node (`getNearestParentPackageJSON`, `stat`, `lstat`,
  `readFile`), que no Windows custam bem mais que no Linux da Vercel. A
  compilação do V8 leva 2,7 s e a instanciação dos módulos do Turbopack 2,4 s.
- **Renderizar as 352 páginas**: ~8 s no runtime do React/Next, ~50 ms de CPU
  por página. Nenhuma página destoa; as maiores são as primeiras de cada
  worker, que pagam o aquecimento.
- **Source maps**: ler, decodificar e indexar os `.map` (~210 MB para ~130 MB
  de JS do servidor) a cada chunk carregado. É o que a mudança 2 tira.
- Coletor de lixo: 1,4 s.

## Avaliado e descartado

- **Mais páginas sob demanda.** Os 167 caminhos SSG que sobraram (incidências
  e casos de Raio-X, séries de TC, exames e doenças do Lab, Semiologia,
  ferramentas) custam 7,9 s de CPU no build, ~2,6 s de relógio com 3 workers:
  ~US$ 0,0006 por build. Gerados sob demanda, cada um sairia da função na
  primeira visita depois de cada deploy, com 60–100 KB de HTML e RSC sem
  compressão no Fast Origin Transfer, e ainda custaria a invocação. Sai mais
  caro do que fica. A regra do CLAUDE.md continua valendo (catálogo novo nasce
  sob demanda), mas estes devem ficar como estão.
- **Conexão do Mongo só no primeiro uso.** `lib/mongodb.ts` conecta na
  importação, e cada worker do build abre uma conexão. No perfil, quase todo o
  custo daquele chunk (~400 ms por worker) é carregar o pacote `mongodb` do
  disco, e esse custo continua de qualquer jeito. Mudar a semântica do
  `clientPromise` exportado não compensa.
- **4 workers em vez de 3**: mais lento (ver acima).

## Conferido

- **Tabela de rotas** idêntica à da branch do Next 16 (863 linhas: mesmos
  ○/●/ƒ, mesmos caminhos pré-gerados), com cache e a frio.
- **Saída pré-gerada**: os 2.241 arquivos de página (`.html`, `.rsc`,
  `.meta`, segmentos) e as listas do `prerender-manifest.json` saem
  byte a byte iguais entre antes e depois, com o BUILD_ID normalizado. A
  exceção é o `sitemap.xml`, cujo único diferente é o `<lastmod>` (a hora do
  build).
- Nenhum aviso novo no build. Os testes que carregam o `next.config.js`
  (`apg-pagina`, `cover-image-hosts`) passam.

## Onde procurar o resto do Build CPU

O `next build` com cache, na Vercel, deve ficar em ~20 s, ou seja ~1,3 CPU-min.
Se o build inteiro está em 10–13 CPU-min (estimativa da migração), o grosso
fica **fora do `next build`**: instalação, restaurar e enviar o cache de build
(~1,5 GB, contando o `node_modules`), empacotar as ~800 funções. O próximo
passo é ler a linha do tempo de um log de build real da Vercel antes de mexer em
mais nada. Duas pistas que não foram medidas aqui:

- `experimental.turbopackSourceMaps`: os 210 MB de `.map` do servidor não
  entram em nenhuma função, mas são gerados e guardados no cache do Turbopack.
  Desligá-los só no build pode encolher a emissão a frio (~15 s) e o cache que
  a Vercel sobe e desce. Vale também para o `next dev`, então teria de ser
  condicionado ao `next build`.
- Compactação do cache do Turbopack: no primeiro build com cache depois de um a
  frio, ela levou 18 s em paralelo com a coleta, disputando os 4 núcleos.
