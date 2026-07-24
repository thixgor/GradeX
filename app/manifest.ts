import type { MetadataRoute } from 'next'

// Web App Manifest — servido pelo Next em /manifest.webmanifest.
// Torna o site instalável como app (PWA) no iPhone e no Android, com ícone
// próprio, abertura em tela cheia (standalone) e cores alinhadas ao tema.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DomineAqui — Estudo Inteligente para Medicina',
    short_name: 'DomineAqui',
    description:
      'Provas, flashcards, cronogramas, materiais e estudo guiado por IA. Estude para residência com inteligência.',
    lang: 'pt-BR',
    dir: 'ltr',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B1F1A',
    theme_color: '#0B1F1A',
    categories: ['education', 'medical'],
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
