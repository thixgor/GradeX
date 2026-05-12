import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/lead/', '/doar', '/politica-de-privacidade', '/termos-de-servico'],
      disallow: [
        '/api/',
        '/admin/',
        '/auth/',
        '/dashboard/',
        '/profile/',
        '/exam/',
        '/exams/',
        '/banco-questoes/',
        '/cronogramas/',
        '/flashcards/',
        '/forum/',
        '/aulas/',
        '/materiais/',
        '/manual-clinico/',
        '/buy/checkout',
        '/doar/sucesso',
        '/doar/pendente',
        '/doar/falha',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
