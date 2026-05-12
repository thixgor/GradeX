import type { Metadata } from 'next'

export const SITE_NAME = 'DomineAqui'
export const SITE_DOMAIN = 'domineaqui.com.br'
export const CANONICAL_ORIGIN = `https://${SITE_DOMAIN}`
export const DEFAULT_OG_IMAGE = 'https://i.imgur.com/zHm5aSx.jpeg'

const SENSITIVE_SEO_TERMS = [
  'afya',
  'unigranrio',
  'provas afya',
  'provas unigranrio',
  'prova afya',
  'prova unigranrio',
  'universidade unigranrio',
  'faculdade afya',
]

export function getSiteUrl() {
  if (process.env.NODE_ENV === 'production') return CANONICAL_ORIGIN

  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  return raw.replace(/\/+$/, '')
}

export function absoluteUrl(path = '/') {
  const siteUrl = getSiteUrl()
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
}

export function hasSensitiveSeoTerm(value?: string | null) {
  if (!value) return false
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return SENSITIVE_SEO_TERMS.some(term => normalized.includes(term))
}

export function sanitizeSeoText(value?: string | null, fallback = '', maxLength = 160) {
  const source = value || fallback
  if (!source) return ''

  let clean = stripHtml(source)

  for (const term of SENSITIVE_SEO_TERMS) {
    clean = clean.replace(new RegExp(term, 'gi'), ' ')
  }

  clean = clean
    .replace(/[#*_`~>|[\](){}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`
}

export const publicIndexingRobots: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
}

export const privateNoIndexRobots: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    'max-image-preview': 'none',
    'max-snippet': 0,
    'max-video-preview': 0,
  },
}

export function buildJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export const SITE_DESCRIPTION =
  'Plataforma de estudo inteligente com provas, flashcards, cronogramas, materiais, TRI e avaliação com IA para estudantes de medicina e saúde.'

export const SITE_KEYWORDS = [
  'plataforma de estudos',
  'estudo inteligente',
  'provas online',
  'flashcards medicina',
  'cronograma de estudos',
  'questões comentadas',
  'TRI',
  'avaliação com IA',
  'materiais de estudo',
  'estudo para residência',
  'banco de questões medicina',
  'plataforma educacional',
  'DomineAqui',
]
