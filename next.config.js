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
    ],
    // Formatos modernos para menor tamanho
    formats: ['image/avif', 'image/webp'],
    // Tamanhos otimizados para evitar processamento desnecessário
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimizar reprocessamento no build
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Compressão automática
  compress: true,

  // Otimização de output para Vercel (standalone reduz cold starts)
  output: 'standalone',

  // Habilitar otimização de pacotes pesados
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-progress',
    ],
  },

  // Headers de segurança e performance para todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Segurança
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
    return config
  },
}

module.exports = nextConfig
