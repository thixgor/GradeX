import type { Metadata } from 'next'

// A marca é escrita de dois jeitos na vida real: JUNTA — "DomineAqui", como no
// domínio, na razão social e no @ do Instagram — e SEPARADA, "Domine Aqui", que
// é como a landing escreve e como a maioria das pessoas digita na busca. Para o
// Google são duas cadeias de caracteres diferentes, e um site que só publica uma
// delas costuma só ser encontrado por uma delas.
//
// A forma junta é a CANÔNICA: é o domínio, é o nome que o buscador usa para
// nomear o site no resultado e é um token único (ninguém mais disputa
// "domineaqui"). A separada entra como NOME ALTERNATIVO — declarada no
// schema.org, no título da home, na descrição e no texto visível, que são os
// lugares que o Google de fato lê para ligar um nome a um site. Trocar qual das
// duas é a canônica é mudar `SITE_NAME` aqui: todo o resto deriva daqui.
export const SITE_NAME = 'DomineAqui'
export const SITE_NAME_SPACED = 'Domine Aqui'
export const SITE_LEGAL_NAME = 'DomineAqui LTDA'
export const SITE_DOMAIN = 'domineaqui.com.br'
export const CANONICAL_ORIGIN = `https://${SITE_DOMAIN}`
export const DEFAULT_OG_IMAGE = 'https://i.imgur.com/zHm5aSx.jpeg'

/** Todas as grafias da marca que precisam levar até aqui numa busca. */
export const SITE_NAME_VARIANTS = [SITE_NAME, SITE_NAME_SPACED, SITE_DOMAIN]

/**
 * O `alternateName` do schema.org: as variantes, menos a que já está no `name`
 * daquele nó (repetir o próprio nome ali não acrescenta nada e o validador
 * reclama). É este campo que o Google lê para aceitar "Domine Aqui" e
 * "DomineAqui" como o MESMO site.
 */
export function siteAlternateNames(name: string = SITE_NAME) {
  const normalized = name.trim().toLowerCase()
  return SITE_NAME_VARIANTS.filter(variant => variant.toLowerCase() !== normalized)
}

/** "DomineAqui (Domine Aqui)" — as duas grafias num rótulo só, para títulos. */
export const SITE_BRAND_LABEL = `${SITE_NAME} (${SITE_NAME_SPACED})`

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

export function formatBRL(amount: number | null | undefined) {
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return ''
  try {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão',
  boleto: 'Boleto',
  subscriptions: 'Assinatura',
}

export async function getActivePaymentMethodsLabel(): Promise<string> {
  try {
    const { getDb } = await import('@/lib/mongodb')
    const { DEFAULT_PAYMENT_METHODS } = await import('@/lib/payment-methods')
    const db = await getDb()
    const settings = await db.collection('admin_settings').findOne({})
    const methods = { ...DEFAULT_PAYMENT_METHODS, ...(settings?.paymentMethods || {}) }
    const labels: string[] = []
    if (methods.pix) labels.push(PAYMENT_METHOD_LABELS.pix)
    if (methods.credit_card) labels.push(PAYMENT_METHOD_LABELS.credit_card)
    if (methods.boleto) labels.push(PAYMENT_METHOD_LABELS.boleto)
    if (labels.length === 0) return ''
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return labels.join(' ou ')
    return `${labels.slice(0, -1).join(', ')} ou ${labels[labels.length - 1]}`
  } catch {
    return 'Pix, Cartão ou Boleto'
  }
}

export function joinSeoParts(parts: Array<string | null | undefined>, separator = ' • ') {
  return parts.map(p => (p || '').trim()).filter(Boolean).join(separator)
}

// Título da home. As duas grafias cabem juntas em ~58 caracteres — abaixo do
// ponto em que o Google reescreve o título por ficar longo demais.
export const SITE_TITLE = `${SITE_BRAND_LABEL} — Estudo Inteligente para Medicina`

// A versão sem corte, para Open Graph e Twitter, onde não há limite de largura.
export const SITE_TITLE_LONG = `${SITE_BRAND_LABEL} — Plataforma de Estudo Inteligente para Medicina`

// A descrição abre com as duas grafias porque a meta description é o único
// trecho de texto que aparece no resultado de busca junto com o título.
export const SITE_DESCRIPTION =
  'O Domine Aqui (DomineAqui) é a plataforma de estudo com provas, flashcards, cronogramas, materiais, TRI e correção por IA para estudantes de medicina.'

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
  // As duas grafias da marca, mais o domínio. `keywords` sozinho não posiciona
  // nada (o Google ignora esta meta desde 2009), mas o Bing ainda a lê e ela
  // mantém o par de grafias declarado em um lugar a mais.
  'DomineAqui',
  'Domine Aqui',
  'domineaqui.com.br',
  'Domine Aqui medicina',
  'DomineAqui plataforma de estudos',
]
