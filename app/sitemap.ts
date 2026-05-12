import type { MetadataRoute } from 'next'
import { getDb } from '@/lib/mongodb'
import { absoluteUrl, getSiteUrl, hasSensitiveSeoTerm } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getSiteUrl(),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/doar'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: absoluteUrl('/politica-de-privacidade'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
    {
      url: absoluteUrl('/termos-de-servico'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
  ]

  try {
    const db = await getDb()
    const campaigns = await db
      .collection('lead_campaigns')
      .find({ isActive: true })
      .project({ slug: 1, name: 1, description: 1, updatedAt: 1, createdAt: 1 })
      .limit(200)
      .toArray()

    const leadRoutes: MetadataRoute.Sitemap = campaigns
      .filter((campaign: any) => {
        const searchableText = `${campaign.slug || ''} ${campaign.name || ''} ${campaign.description || ''}`
        return campaign.slug && !hasSensitiveSeoTerm(searchableText)
      })
      .map((campaign: any) => ({
        url: absoluteUrl(`/lead/${campaign.slug}`),
        lastModified: campaign.updatedAt || campaign.createdAt || now,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))

    return [...staticRoutes, ...leadRoutes]
  } catch {
    return staticRoutes
  }
}
