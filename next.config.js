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
    // Minimizar reprocessamento no build
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Compressão automática
  compress: true,

  // Habilitar otimização de pacotes pesados
  experimental: {
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
     */
    outputFileTracingIncludes: {
      '/manual-clinico/histologia/histopatologia/atlas/[id]': [
        './public/patologia/catalogo/**/*.json.gz',
      ],
      '/api/manual-clinico/histopatologia/acervo/[id]': [
        './public/patologia/catalogo/**/*.json.gz',
      ],
    },
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
      // Atalho curto do app. "domineaqui.com.br/app" cabe num story, num áudio
      // de WhatsApp e no fim de uma aula — "barra instalar" não. O canônico
      // continua sendo /instalar (um endereço só para o buscador indexar), e é
      // este atalho que o QR code da própria página carrega.
      {
        source: '/app',
        destination: '/instalar',
        permanent: true,
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
    ]
  },

  // Ignorar erros TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorar erros ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Otimização de webpack
  webpack: (config, { isServer }) => {
    // Não incluir módulos pesados desnecessários no client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    // Desabilitar cache de filesystem em produção (Vercel já faz cache)
    // e otimizar resolução de módulos
    config.resolve.symlinks = false

    return config
  },

  // Desabilitar source maps em produção para build mais rápido
  productionBrowserSourceMaps: false,

  // Desabilitar powered by header (micro otimização)
  poweredByHeader: false,
}

module.exports = nextConfig
