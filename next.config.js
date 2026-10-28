// Ver `serverSourceMaps`, em `experimental`.
const semMapasDoServidor =
  process.argv.includes('build') && process.env.MAPAS_NO_PRERENDER !== '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Otimização de imagens para Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Acervo do Manual da Histologia. As lâminas são JPEG de ~1 MB servidos
      // por um servidor único nos EUA; passá-las pelo otimizador as converte
      // para AVIF e as coloca atrás do edge cache.
      {
        protocol: 'https',
        hostname: 'digitalhistology.org',
      },
    ],
    // WebP, e não AVIF.
    //
    // Medido na mesma lâmina de 903 KB do acervo de histologia: WebP a 1920 px
    // dá 234 KB e codifica em 0,65 s; AVIF dá 186 KB e codifica em 8,4 s. São
    // 20% a menos de bytes por 13× mais tempo de codificação — e essa espera
    // recai inteira sobre o primeiro aluno a abrir cada uma das 1.318 lâminas,
    // porque o cache só existe depois da primeira transformação.
    //
    // WebP é suportado por praticamente todo navegador em uso, então a troca
    // não deixa ninguém com o JPEG original.
    formats: ['image/webp'],
    // 1920 existe para as lâminas de histologia: elas são exibidas em tamanho
    // natural dentro do microscópio virtual e o aluno amplia sobre elas, então
    // limitar a 1200 destruiria o detalhe justamente no uso principal.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 384 serve as miniaturas do catálogo de Raio-X: é a maior largura que um
    // card ocupa em qualquer breakpoint, e fixá-la mantém uma única variante em
    // cache por radiografia em vez de uma por viewport.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Desde o Next 16 o otimizador recusa com 400 todo `q` fora desta lista (o
    // padrão é só [75]). Estes são os valores que o código pede montando a URL
    // de `/_next/image` à mão: `urlOtimizada` (lib/histologia/midia.ts),
    // `urlFilme` e `qualidade` do Raio-X (components/radiologia/) e o PDF de
    // flashcards (lib/flashcard-manual-pdf.ts). Quem passar a pedir outra
    // qualidade acrescenta aqui — sem isso a imagem sai quebrada, em silêncio.
    qualities: [45, 58, 60, 62, 65, 66, 70, 72, 75, 78, 82, 90],
    // Minimizar reprocessamento no build
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Compressão automática
  compress: true,

  /**
   * Páginas sob demanda.
   *
   * O build gerava 1.801 páginas, e "Generating static pages" era um terço do
   * tempo de um build com cache. Quase tudo vinha de oito catálogos em código
   * com uma página por item: 485 sinais da Semiologia, 248 marcadores e 47
   * alterações do Lab, 188 casos de Raio-X, 155 de TC, 54 com apontamentos, 98
   * modelos 3D e 37 quizzes de Raio-X — 283 MB de HTML e RSC refeitos e
   * reenviados a cada push, para páginas que em boa parte ninguém abre entre
   * um deploy e o próximo.
   *
   * Nesses oito, `generateStaticParams` devolve `[]`: a página é gerada na
   * primeira visita e fica no cache da Vercel até o próximo deploy (ISR sem
   * prazo — o conteúdo só muda com código novo). Slug inexistente continua 404,
   * pelo `notFound()` de cada página. Os catálogos pequenos e centrais (as 28
   * incidências, as 20 séries de TC, os quizzes curtos) seguem pré-gerados.
   * Pré-gerar de novo é só devolver a lista.
   */
  /**
   * Catálogo da Histopatologia no bundle das funções que o leem.
   *
   * `lib/histopatologia/acervo.ts` descompacta os fragmentos `.json.gz` do
   * catálogo em tempo de requisição, para servir o inventário das 2.892
   * entradas que ainda não têm curadoria editorial. Arquivos em `public/` são
   * servidos estaticamente, mas **não entram** no bundle das funções
   * serverless — sem esta declaração o `readFile` funcionaria em
   * desenvolvimento e devolveria ENOENT em produção.
   *
   * São 5,7 MB de texto comprimido. A alternativa — expandir as 202.593
   * referências em derivados JSON versionados — custaria dezenas de megabytes
   * de dado duplicado no repositório.
   *
   * As chaves são globs. No Turbopack, `[id]` escrito por extenso é classe de
   * caracteres (um `i` ou um `d`) e não casa com o segmento da rota — a regra
   * deixava de valer sem erro nenhum. Por isso o segmento dinâmico vai como
   * `*`, que casa nos dois empacotadores.
   *
   * A página da entrada do atlas virou casco estático: quem lê os fragmentos
   * agora é a rota de dados das páginas da Histopatologia
   * (`/api/manual-clinico/histologia/histopatologia/[...rota]`). A chave casa
   * por trecho do caminho: `histopatologia/*` pegava também a rota da home e
   * as pastas irmãs `zoom/` e `doencas/` (5,7 MB a mais em cada função, sem
   * uso). `*rota*` só casa com o segmento `[...rota]` — o `zoom/[[...rota]]`
   * fica um nível abaixo e o `*` não atravessa a barra. Conferido no
   * `.nft.json` de cada rota.
   */
  outputFileTracingIncludes: {
    '/api/manual-clinico/histologia/histopatologia/*rota*': [
      './public/patologia/catalogo/**/*.json.gz',
    ],
    '/api/manual-clinico/histopatologia/acervo/*': [
      './public/patologia/catalogo/**/*.json.gz',
    ],
    /**
     * As bibliotecas nativas do `sharp` nas funções do leitor de PDF.
     *
     * O rastreio do Turbopack leva o `sharp-<plataforma>.node`, mas não a
     * libvips que ele carrega ao abrir (`libvips-cpp.so.*`, num pacote
     * `@img/sharp-libvips-*` à parte no Linux; DLLs ao lado do `.node` no
     * Windows). O webpack levava. Sem ela o `import('sharp')` falha na função,
     * e `lib/material-pdf-enxugar.ts` cai no plano B em silêncio: a página
     * sai sem regravar as imagens — o leitor funciona, só que entregando a
     * página gorda que a derivada enxuta existe para evitar.
     *
     * O glob pega só o que o `npm install` da máquina baixou (na Vercel, os
     * pacotes linux-x64).
     */
    ...Object.fromEntries(
      [
        '/api/materiais/upload',
        '/api/materiais/*/pdf-viewer/{access,page,thumb}',
      ].map((rota) => [rota, ['./node_modules/@img/sharp-*/lib/**/*']]),
    ),
    /**
     * A fonte Inter e o logo reduzido do PDF do baralho de flashcards.
     *
     * `lib/pdf/marca-servidor.ts` os lê do disco com caminho montado em
     * execução, e o rastreio não segue isso: sem esta linha o PDF sai em
     * Helvetica e sem logo — em silêncio, e com qualquer `β` ou `→` do cartão
     * soletrado (a Helvetica do PDF não tem esses glifos).
     */
    '/api/flashcards/manual/*/pdf': [
      './public/fonts/Inter-Regular.ttf',
      './public/fonts/Inter-Bold.ttf',
      './public/fonts/Inter-Italic.ttf',
      './public/fonts/Inter-BoldItalic.ttf',
      './public/logo-pdf.png',
    ],
  },

  // Habilitar otimização de pacotes pesados
  experimental: {
    /**
     * Cache do roteador no navegador para páginas dinâmicas: 30 s, como era.
     *
     * O Next 14 guardava por 30 s o RSC de uma página dinâmica já visitada; o
     * 15 baixou o padrão para 0. Com 0, voltar a `/provas` vindo de uma prova
     * ou alternar entre duas abas do painel refaz a requisição à função toda
     * vez — invocação e Fast Origin Transfer a mais para mostrar o que o aluno
     * acabou de ver. Voltar/avançar do navegador reaproveita a cópia de
     * qualquer jeito; isto vale para o clique num link.
     */
    staleTimes: {
      dynamic: 30,
    },
    /**
     * Workers de "Collecting page data" e "Generating static pages": um a
     * menos que os núcleos que o processo pode usar de fato.
     *
     * O padrão do Next é `os.cpus().length - 1`, e `os.cpus()` conta os
     * núcleos da máquina, não os que o processo recebeu. Na Vercel dá no mesmo
     * (máquina Standard: 4 núcleos, 3 workers). Mas preso a 4 núcleos numa
     * máquina de 20 — o jeito de reproduzir a Vercel aqui —, o Next subia 19
     * workers, cada um carregando de novo os mesmos chunks do servidor:
     * 36–40 s de build com cache, contra 22–23 s com 3 workers. A medida
     * local exagerava em ~13 s estas duas fases. `availableParallelism()`
     * respeita afinidade e cpuset; fora isso, é o mesmo número do padrão.
     */
    cpus: Math.max(1, require('node:os').availableParallelism() - 1),
    /**
     * Sem source maps do servidor no `next build`.
     *
     * O Turbopack gera um `.map` para cada chunk do servidor — 5.273 arquivos,
     * 201 MB — que nenhuma função usa: o trace das funções não os inclui, o
     * `next start` não liga `--enable-source-maps` e o pré-render já não os lê
     * (`enablePrerenderSourceMaps`, abaixo). Mas eles são gerados a cada build
     * e guardados no cache do Turbopack, que a Vercel restaura e sobe de novo
     * a cada deploy. Sem eles, medido a 4 núcleos com 3 workers:
     * - cache do Turbopack de 614 para 484 MB (e cresce no mesmo ritmo,
     *   ~11 MB por build), num teto de 1,5 GB que inclui o `node_modules`;
     * - build a frio ~5 s mais curto; com cache, ~1 s na compilação;
     * - o JS das funções, o HTML/RSC pré-gerados e os estáticos do cliente
     *   saem iguais (ver `docs/build-sem-mapas-do-servidor.md`).
     *
     * O que se perde: a Vercel monta o mapa das funções Edge (`middleware.ts`
     * e as duas rotas Edge) com os `.map` dos chunks; sem eles, uma pilha de
     * erro dessas funções no log aponta para o código compilado, e não para o
     * `.ts`. `MAPAS_NO_PRERENDER=1` religa os mapas junto com o uso deles no
     * pré-render, e o `next build --debug-prerender` também. No `next dev` a
     * chave nem é definida, e os mapas continuam lá.
     *
     * `serverSourceMaps`, e não `turbopackSourceMaps`: no Turbopack as duas
     * desligam os mapas do servidor, mas a segunda desligaria também os do
     * navegador, por cima de `productionBrowserSourceMaps`, e não cederia ao
     * `--debug-prerender`.
     */
    ...(semMapasDoServidor ? { serverSourceMaps: false } : {}),
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-progress',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'jose',
      'mercadopago',
    ],
  },

  /**
   * A Tomografia nasceu antes do Manual de Radiologia e ficou na raiz do Manual
   * Clínico (`/manual-clinico/tomografia`). Agora que Radiologia é a seção que
   * abriga as modalidades, o caminho canônico é `/manual-clinico/radiologia/
   * tomografia` — e o antigo redireciona em 308, preservando link externo,
   * histórico do aluno e o que já foi indexado.
   *
   * Redirects de `next.config` rodam antes do middleware, então o visitante sem
   * sessão é levado ao endereço novo sem passar pelo portão de autenticação.
   */
  /**
   * `/midia/<aa>/<sha256>.<ext>` — o endereço interno das imagens do acervo.
   *
   * O banco guarda esse caminho relativo, e não a URL do armazenamento. É de
   * propósito: gravar o domínio do fornecedor em milhares de documentos foi
   * exatamente o que criou a dependência do Imgur que esta seção existe para
   * desfazer. Com a indireção aqui, trocar de armazenamento é editar uma
   * variável de ambiente — não varrer a base outra vez.
   *
   * `beforeFiles` porque o caminho não corresponde a nenhum arquivo nosso: a
   * reescrita precisa acontecer antes do sistema de arquivos e das rotas.
   *
   * Sem `BLOB_PUBLIC_BASE_URL` não há reescrita, e o pedido cai em
   * `app/midia/[...caminho]/route.ts`, que resolve o destino consultando
   * `media_assets`. Um redirecionamento a mais por imagem é ruim; todas as
   * imagens do site sumirem por uma variável esquecida seria pior.
   */
  async rewrites() {
    const base = (process.env.BLOB_PUBLIC_BASE_URL || '').replace(/\/+$/, '')
    return {
      beforeFiles: [
        /**
         * `/apg?periodo=N` → `/apg/periodo/N`: o período sai da query string e
         * vai para o caminho de uma página pré-gerada.
         *
         * Com o período na query, a rota tinha de ser dinâmica, e a borda
         * guardava uma cópia por URL completa, com `fbclid` e `utm_*` juntos.
         * Cada clique de anúncio era um cache miss servido por função. Como
         * arquivo estático, a query não entra na chave e o parâmetro de
         * rastreio deixa de custar alguma coisa.
         *
         * O Next ancora o `value` (`^...$`), então `periodo=12` não casa e cai
         * na visão geral, como antes. Os períodos são os de
         * `lib/apg-pagina.ts`.
         */
        {
          source: '/apg',
          has: [{ type: 'query', key: 'periodo', value: '(?<periodo>[1-4])' }],
          destination: '/apg/periodo/:periodo',
        },
        ...(base
          ? [
              {
                source: '/midia/:caminho*',
                destination: `${base}/midia/:caminho*`,
              },
            ]
          : []),
      ],
    }
  },

  async redirects() {
    return [
      {
        source: '/manual-clinico/tomografia',
        destination: '/manual-clinico/radiologia/tomografia',
        permanent: true,
      },
      {
        source: '/manual-clinico/tomografia/:slug',
        destination: '/manual-clinico/radiologia/tomografia/:slug',
        permanent: true,
      },
      // Domine Anatomia saiu de dentro do Manual Clínico e virou seção própria
      // em `/anatomia`, com as duas experiências como irmãs: `/anatomia/atlas-
      // anatomia` (pranchas da UFJF) e `/anatomia/anatomia-3d` (modelos em 360°).
      // O endereço antigo era `/manual-clinico/anatomia-3d`, com `/atlas` e
      // `/modelos` embaixo — e cada modelo pendurado direto na raiz da seção.
      // As regras específicas vêm antes da genérica de `:slug`, porque o Next
      // aplica a primeira que casar.
      {
        source: '/manual-clinico/anatomia-3d/atlas',
        destination: '/anatomia/atlas-anatomia',
        permanent: true,
      },
      {
        source: '/manual-clinico/anatomia-3d/modelos',
        destination: '/anatomia/anatomia-3d',
        permanent: true,
      },
      {
        source: '/manual-clinico/anatomia-3d',
        destination: '/anatomia',
        permanent: true,
      },
      {
        source: '/manual-clinico/anatomia-3d/:slug',
        destination: '/anatomia/anatomia-3d/:slug',
        permanent: true,
      },
      // Atalho curto do app. "domineaqui.com.br/app" cabe num story, num áudio
      // de WhatsApp e no fim de uma aula — "barra instalar" não. O canônico
      // continua sendo /instalar (um endereço só para o buscador indexar), e é
      // este atalho que o QR code da própria página carrega.
      {
        source: '/app',
        destination: '/instalar',
        permanent: true,
      },
      // Pacotes moram numa aba de /materiais (mesma busca, filtros e carrinho);
      // `/pacotes` sozinho dava 404 para quem apagava o id do endereço.
      {
        source: '/pacotes',
        destination: '/materiais?tab=packages',
        permanent: false,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // A sala de aula das monitorias é a ÚNICA página com microfone e
      // compartilhamento de tela. A regra global acima mantém `microphone=()`
      // no resto do site; esta vem depois e, para a mesma chave, a última
      // vence (comportamento documentado do `headers()` do Next).
      {
        source: '/monitorias/reservas/:id/sala',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=()',
          },
        ],
      },
      // Vídeos públicos versionados no nome (monitorias-1x1-v1.mp4): trocar o
      // vídeo = novo nome, então o cache pode ser imutável.
      {
        source: '/videos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache longo para assets estáticos
      {
        source: '/img/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Só em produção: no `next dev` os chunks de `/_next/static/` não levam
      // hash no nome, e um `immutable` aqui faz o navegador segurar JavaScript
      // velho depois de cada edição.
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ]
        : []),
      // Cache para fontes
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache longo para assets da landing /ldpg-mnclinico (UUIDs imutáveis)
      {
        source: '/ldpg-mnclinico-assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      /**
       * Os acervos de imagem — o resto do Fast Origin Transfer.
       *
       * Arquivo em `public/` sem `Cache-Control` sai da Vercel como
       * `public, max-age=0, must-revalidate`. O navegador guarda, mas revalida
       * a cada visita, e cada revalidação atravessa a borda até a origem. São
       * ~370 MB de imagem servidos assim: 240 MB do Atlas de Anatomia, 106 MB
       * das séries de tomografia, os modelos 3D e o catálogo de patologia.
       * Foram 10,49 GB de Fast Origin Transfer em agosto (US$ 3,72) para
       * entregar bytes que nunca mudaram.
       *
       * `immutable` é honesto aqui, e não uma aposta: são prancha de anatomia,
       * corte de tomografia e modelo 3D, publicados uma vez sob nome próprio.
       * O acervo cresce por arquivo novo — nenhum deles é editado no lugar. É o
       * mesmo tratamento que `/img/` já recebia; só não tinha sido estendido
       * para as pastas que carregam quase todo o peso.
       */
      {
        source: '/atlas-anatomia/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:serie(TC_ABDOME|TC_CRANIO|TC_TORAX)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/models/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/patologia/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      /**
       * Marca e ícones do PWA: mesma lógica, prazo menor.
       *
       * Estes podem ser trocados no lugar — um ícone redesenhado mantém o nome,
       * senão o manifesto quebra. `s-maxage` alto tira a origem do caminho (é a
       * borda que responde), `max-age` de um dia deixa o navegador reconferir
       * com a borda, e `stale-while-revalidate` faz essa reconferência
       * acontecer em segundo plano. Troca de logo se propaga em um dia sem
       * custar transferência de origem no resto do ano.
       */
      /**
       * `/midia/<aa>/<sha256>.<ext>` — o acervo de imagens internalizado.
       *
       * Este é o caminho por onde passa TODA imagem do site: capa de prova,
       * figura de questão, ilustração de patologia, ícone de tópico. O
       * `next.config` o reescreve para o Blob, então cada acesso que não bate
       * num cache é egresso do Blob — e o acervo migrou do Imgur para cá neste
       * ciclo, o que é boa parte do salto da transferência de Blob.
       *
       * Era a única pasta grande sem regra própria. Sem ela, a resposta depende
       * inteiramente do que o armazenamento devolver; com ela, a borda guarda o
       * arquivo e o Blob deixa de ser consultado a cada visita.
       *
       * `immutable` é literal aqui, não uma aposta: o nome do arquivo É o
       * SHA-256 do conteúdo (ver `lib/midia/urls.ts`). Conteúdo diferente tem
       * nome diferente, por construção — um arquivo servido sob este caminho
       * nunca muda.
       */
      {
        source: '/midia/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        source: '/:pasta(landing|pwa|shortcuts|Manual-Histologia)/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
          },
        ],
      },
      /**
       * Os arquivos soltos na raiz de `public/` — o buraco que sobrou.
       *
       * Toda pasta grande ganhou regra própria, mas a raiz nunca ganhou: sem
       * `Cache-Control`, a Vercel serve estes como
       * `public, max-age=0, must-revalidate`. O navegador guarda e revalida a
       * cada visita, e cada revalidação atravessa a borda até a origem.
       *
       * `logo.png` não é só o logo do site: é o logo do JSON-LD de
       * `app/layout.tsx`, a imagem embutida em TODO e-mail transacional (URL
       * absoluta fixa em `lib/mail.ts` e `lib/comms/email-render.ts`) e o
       * cabeçalho dos PDFs gerados no navegador — que `/provas` e `/exam/[id]`
       * pré-carregam em toda visita. É tráfego que não passa por `next/image`.
       * Por isso ele é a versão enxuta: 512 px, paleta de 256 cores, 71 KB (era
       * o original de 1584 px e 2,7 MB, que agora mora em `img/logo.png`). O
       * maior tamanho em que aparece é ~160 px. `logo3d.png` (login) seguiu o
       * mesmo caminho: 768 px, 356 KB, original em `img/logo3d.png`.
       *
       * `pdf.worker.min.mjs` (1,4 MB) é baixado sempre que alguém abre um
       * material em PDF.
       *
       * Prazo igual ao da marca do PWA, e pelo mesmo motivo: estes podem ser
       * trocados no lugar — um logo redesenhado mantém o nome. `s-maxage` alto
       * tira a origem do caminho, `max-age` de um dia deixa o navegador
       * reconferir com a borda, e `stale-while-revalidate` faz isso em segundo
       * plano. Troca de logo se propaga em um dia sem custar transferência de
       * origem no resto do ano.
       */
      ...[
        '/logo.png',
        '/logo3d.png',
        '/favicon.png',
        '/favicon.ico',
        '/favicon.jpg',
        '/logo_manual_radiologia.svg',
        '/logo_manual_tomografia.svg',
        '/pdf.min.mjs',
        '/pdf.worker.min.mjs',
      ].map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
          },
        ],
      })),
    ]
  },

  // Ignorar erros TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  // O lint não roda no build desde o Next 16 (`next lint` e a chave `eslint`
  // saíram); ele é o `npm run lint`, com o ESLint direto.

  /**
   * Sem `webpack()`: o build é do Turbopack, que o Next 16 usa por padrão (e
   * que se recusa a buildar com um `webpack()` presente).
   *
   * O que a função fazia e onde foi parar:
   * - `fs`/`net`/`tls`/`crypto` vazios no cliente: nenhum código do cliente
   *   importa esses módulos (o build passa sem `resolveAlias` e sem polyfill
   *   no bundle), então não há o que silenciar;
   * - cache do webpack comprimido para caber no teto do cache de build da
   *   Vercel: o Turbopack guarda o dele em `.next/cache/turbopack`, e o
   *   tamanho é cuidado por `prepararCacheDeBuild`, no fim deste arquivo.
   */

  // Desabilitar source maps em produção para build mais rápido
  productionBrowserSourceMaps: false,

  /**
   * Sem source maps nos workers do build.
   *
   * Ligado (o padrão do Next 16), cada worker roda com `--enable-source-maps`
   * e `Error.stackTraceLimit = 50`: a cada chunk do servidor que carrega, o
   * Node lê e indexa o `.map` dele — ~210 MB de mapas para ~130 MB de JS.
   * Medido com 3 workers, como na Vercel: a CPU dos workers cai de ~36 s para
   * ~32 s por build, e o build com cache fica ~1,4 s mais curto. O HTML e o
   * RSC gerados não mudam (ver `docs/build-coleta-e-geracao.md`).
   *
   * O que se perde: se uma página quebrar no pré-render, a pilha do erro no
   * log do build aponta para o chunk compilado, e não para o `.tsx`. Para
   * depurar, `MAPAS_NO_PRERENDER=1 npm run build` religa — e volta a gerar os
   * `.map` do servidor, que `serverSourceMaps` (em `experimental`) desliga no
   * build. Não afeta as funções em produção: os `.map` do servidor nem entram
   * no bundle delas.
   */
  enablePrerenderSourceMaps: process.env.MAPAS_NO_PRERENDER === '1',

  // Desabilitar powered by header (micro otimização)
  poweredByHeader: false,
}

/**
 * O cache de build que a Vercel guarda de um deploy para o outro.
 *
 * Com cache, o build do Turbopack leva ~40 s; sem, ~90 s (4 núcleos). Mas o
 * cache só é guardado se couber no teto da máquina Standard, 1,5 GB — e esse
 * teto inclui o `node_modules` (~870 MB). O cache do Turbopack começa em
 * ~610 MB, não comprime (já vem comprimido) e cresce ~12 MB a cada build com
 * mudança, porque o coletor de lixo dele ainda é experimental e vem desligado.
 *
 * Então, no começo de cada `next build`:
 * - sai o `.next/cache/webpack`: sobra do empacotador anterior, restaurada
 *   pela Vercel e nunca mais lida. Sozinha ela tem 520 MB e faria o primeiro
 *   cache do Turbopack nascer acima do teto;
 * - acima de 800 MB, o cache do Turbopack recomeça do zero. Esse build sai a
 *   frio, e o próximo volta a ter um cache do tamanho inicial — um build a
 *   frio a cada ~16 builds com mudança, em vez de cache nenhum.
 *
 * Só no `next build`: o Next carrega este arquivo também no `next dev`, no
 * `next start` e nos testes, e nenhum deles deve mexer no cache.
 */
const TETO_DO_CACHE_DO_TURBOPACK = 800 * 1024 * 1024

function tamanhoDaPasta(pasta) {
  const fs = require('node:fs')
  const path = require('node:path')
  let total = 0
  let entradas
  try {
    entradas = fs.readdirSync(pasta, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const entrada of entradas) {
    const caminho = path.join(pasta, entrada.name)
    if (entrada.isDirectory()) total += tamanhoDaPasta(caminho)
    else if (entrada.isFile()) total += fs.statSync(caminho).size
  }
  return total
}

function prepararCacheDeBuild() {
  const fs = require('node:fs')
  const path = require('node:path')
  const cache = path.join(__dirname, '.next', 'cache')
  fs.rmSync(path.join(cache, 'webpack'), { recursive: true, force: true })
  const turbopack = path.join(cache, 'turbopack')
  const tamanho = tamanhoDaPasta(turbopack)
  if (tamanho > TETO_DO_CACHE_DO_TURBOPACK) {
    fs.rmSync(turbopack, { recursive: true, force: true })
    console.log(
      `cache do Turbopack com ${Math.round(tamanho / 1048576)} MB: recomeçando do zero para caber no cache de build da Vercel`,
    )
  }
}

if (process.argv.includes('build')) prepararCacheDeBuild()

module.exports = nextConfig
