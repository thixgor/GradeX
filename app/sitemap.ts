import type { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo'

function canonical(path = '/') {
  return `${CANONICAL_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_ORIGIN,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: canonical('/flashcards'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: canonical('/materiais'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: canonical('/manual-clinico'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: canonical('/amostra'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: canonical('/doar'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: canonical('/termos-de-servico'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: canonical('/politica-de-privacidade'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  return staticRoutes
}
