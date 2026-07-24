import type { MetadataRoute } from 'next'
import { CANONICAL_ORIGIN } from '@/lib/seo'

// Páginas públicas que devem ser indexadas. Só entram aqui rotas realmente
// acessíveis sem login (o middleware redireciona o resto para /auth/login com
// X-Robots-Tag noindex, então listá-las aqui não adiantaria nada).
// Termos e Política eram bloqueados por engano e agora estão liberados.
const ALLOW = [
  '/',
  '/amostra',
  '/flashcards/',
  '/materiais/',
  '/manual-clinico/',
  '/termos-de-servico',
  '/politica-de-privacidade',
  '/_next/static/',
  '/_next/image',
]

// Bloqueamos áreas logadas, APIs, checkout e páginas de status de pagamento.
// As rotas do app (banco-questoes, aulas, cronogramas, forum) já ficam fora do
// índice pelo middleware; quando ganharem versão pública/amostra, entram no
// ALLOW acima.
const DISALLOW = [
  '/api/',
  '/admin/',
  '/auth/',
  '/dashboard/',
  '/profile/',
  '/exam/',
  '/exams/',
  '/buy/',
  '/lead/',
  '/games/',
  '/*.json$',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'Googlebot', allow: ALLOW, disallow: DISALLOW },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/img/', '/favicon.png', '/logo.png', '/logo3d.png', '/_next/image'],
        disallow: ['/api/'],
      },
      { userAgent: 'Bingbot', allow: ALLOW, disallow: DISALLOW },
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  }
}
