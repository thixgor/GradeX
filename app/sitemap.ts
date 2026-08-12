import type { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo'
import { TODAS_SUBSECOES } from '@/lib/tomografia'
import { ESTUDOS_RAIO_X } from '@/lib/radiologia/raio-x'
import { entradasDaHistologia } from '@/lib/histologia/sitemap'
import { entradasDaHistopatologia } from '@/lib/histopatologia/sitemap'

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
      url: canonical('/instalar'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
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

  // Cada série do Manual de Tomografia é uma página com título e descrição
  // próprios (ver o generateMetadata da rota), então vale indexar uma a uma.
  const tomografia: MetadataRoute.Sitemap = [
    {
      url: canonical('/manual-clinico/radiologia/tomografia'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...TODAS_SUBSECOES.map((sub) => ({
      url: canonical(`/manual-clinico/radiologia/tomografia/${sub.id}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  const radiologia: MetadataRoute.Sitemap = [
    {
      url: canonical('/manual-clinico/radiologia'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: canonical('/manual-clinico/radiologia/raio-x'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...ESTUDOS_RAIO_X.map((estudo) => ({
      url: canonical(`/manual-clinico/radiologia/raio-x/${estudo.id}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  // O Manual da Histologia devolve lista vazia enquanto o portão de licença
  // estiver pendente — um sitemap é convite explícito à indexação, e oferecê-lo
  // para conteúdo bloqueado contornaria o próprio bloqueio.
  // A Histopatologia segue a mesma regra, com um portão a mais: só doenças com
  // revisão médica concluída entram. Hoje isso é lista vazia.
  return [
    ...staticRoutes,
    ...radiologia,
    ...tomografia,
    ...entradasDaHistologia(now),
    ...entradasDaHistopatologia(now),
  ]
}
