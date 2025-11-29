/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Ignorar erros TypeScript durante build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorar erros ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
