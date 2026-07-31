import type { ObjectId } from 'mongodb'

export const TESTIMONIALS_COLLECTION = 'testimonials'

export interface TestimonialDoc {
  _id?: ObjectId
  /** URL de embed já normalizada (youtube-nocookie). Guardamos a versão pronta. */
  embedUrl: string
  /** ID do vídeo no YouTube (11 chars) — útil para thumbnail e dedupe. */
  videoId: string
  /** Vídeo em pé (Shorts / gravação de celular)? Ajusta o aspect ratio na landing. */
  vertical: boolean
  /** Nome do depoente — OPCIONAL. */
  name: string
  /** Descrição/legenda do depoimento — OPCIONAL. */
  description: string
  /** Ordena a exibição (menor primeiro). */
  order: number
  /** Depoimento visível na landing? */
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicTestimonial {
  _id: string
  embedUrl: string
  videoId: string
  vertical: boolean
  name: string
  description: string
  order: number
  enabled: boolean
}

const MAX_NAME = 120
const MAX_DESCRIPTION = 600

/**
 * Extrai o ID do vídeo do YouTube de praticamente qualquer formato que o admin
 * possa colar: link de compartilhar (youtu.be), watch?v=, /embed/, /shorts/,
 * URL do youtube-nocookie ou o próprio ID cru (11 caracteres).
 * Retorna null se não conseguir reconhecer.
 */
export function extractYouTubeId(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const raw = input.trim()
  if (!raw) return null

  // ID cru: 11 caracteres do alfabeto base64-url do YouTube.
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  const patterns = [
    /(?:youtube\.com|youtube-nocookie\.com)\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = raw.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

/** Detecta se a URL colada é um Shorts (vídeo vertical). */
export function isShortsUrl(input: unknown): boolean {
  return typeof input === 'string' && /\/shorts\//i.test(input)
}

/** Monta a URL de embed sem cookies a partir de um ID já validado. */
export function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
}

function collapse(input: unknown, max: number): string {
  if (typeof input !== 'string') return ''
  return input.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function sanitizeTestimonialName(input: unknown): string {
  return collapse(input, MAX_NAME)
}

export function sanitizeTestimonialDescription(input: unknown): string {
  // Preserva quebras de linha simples, só apara excesso e limita tamanho.
  if (typeof input !== 'string') return ''
  return input.replace(/\r\n/g, '\n').replace(/[^\S\n]+/g, ' ').trim().slice(0, MAX_DESCRIPTION)
}

export function toPublicTestimonial(doc: TestimonialDoc): PublicTestimonial {
  return {
    _id: String(doc._id),
    embedUrl: doc.embedUrl,
    videoId: doc.videoId,
    vertical: !!doc.vertical,
    name: doc.name || '',
    description: doc.description || '',
    order: doc.order ?? 0,
    enabled: doc.enabled !== false,
  }
}
