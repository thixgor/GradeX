import type { MetadataRoute } from 'next'
import { getDb } from '@/lib/mongodb'
import { CANONICAL_ORIGIN, hasSensitiveSeoTerm } from '@/lib/seo'

function canonical(path = '/') {
  return `${CANONICAL_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_ORIGIN,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: canonical('/doar'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: canonical('/politica-de-privacidade'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: canonical('/termos-de-servico'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  try {
    const db = await getDb()

    const campaigns = await db
      .collection('lead_campaigns')
      .find({ isActive: true })
      .project({ slug: 1, name: 1, description: 1, updatedAt: 1, createdAt: 1 })
      .limit(500)
      .toArray()

    const leadRoutes: MetadataRoute.Sitemap = campaigns
      .filter((c: any) => {
        const text = `${c.slug || ''} ${c.name || ''} ${c.description || ''}`
        return c.slug && !hasSensitiveSeoTerm(text)
      })
      .map((c: any) => ({
        url: canonical(`/lead/${c.slug}`),
        lastModified: c.updatedAt || c.createdAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))

    return [...staticRoutes, ...leadRoutes]
  } catch {
    return staticRoutes
  }
}
