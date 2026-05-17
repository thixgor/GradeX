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
      url: canonical('/doar'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  return staticRoutes
}
