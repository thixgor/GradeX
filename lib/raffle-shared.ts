/**
 * Helpers PUROS das rifas — sem dependências de servidor (DB/mail).
 * Seguro para importar em componentes client.
 */

import type {
  Raffle,
  RaffleStatus,
  RaffleTemplate,
  RaffleVisibility,
  RaffleCustomDesign,
} from './types'

export const RAFFLE_RESERVATION_MINUTES = 15

/**
 * Categorias de prêmio sugeridas no formulário do admin. O admin pode escolher
 * uma destas ou digitar uma personalizada (opção "Outro").
 */
export const RAFFLE_PRIZE_CATEGORIES: string[] = [
  'Eletrônicos',
  'Smartphones',
  'Informática',
  'Games & Consoles',
  'Casa & Decoração',
  'Eletrodomésticos',
  'Moda & Acessórios',
  'Beleza & Cosméticos',
  'Viagens & Experiências',
  'Veículos',
  'Dinheiro / Pix',
  'Vale-compras',
  'Esportes & Fitness',
  'Livros & Cursos',
  'Brinquedos',
  'Pet',
  'Alimentos & Bebidas',
  'Solidário / Beneficente',
]

export const RAFFLE_TEMPLATES: {
  id: RaffleTemplate
  label: string
  description: string
  primaryColor: string
  secondaryColor: string
  background: string
  /** true quando o template usa fundo claro (texto escuro). */
  light?: boolean
}[] = [
  {
    id: 'premium-dark',
    label: 'Premium Escuro',
    description: 'Fundo escuro com destaques esmeralda. Sofisticado e moderno.',
    primaryColor: '#34d399',
    secondaryColor: '#059669',
    background: 'linear-gradient(135deg, #04130b 0%, #0a0f0d 60%, #06140a 100%)',
  },
  {
    id: 'golden',
    label: 'Dourado Elegante',
    description: 'Tons de ouro e preto. Transmite valor e exclusividade.',
    primaryColor: '#f5c542',
    secondaryColor: '#b8860b',
    background: 'linear-gradient(135deg, #1a1408 0%, #0d0a04 60%, #14100a 100%)',
  },
  {
    id: 'neon',
    label: 'Neon / Gamer',
    description: 'Visual vibrante com roxo e ciano. Ideal para público jovem.',
    primaryColor: '#a855f7',
    secondaryColor: '#22d3ee',
    background: 'linear-gradient(135deg, #0d0420 0%, #08081a 60%, #120630 100%)',
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    description: 'Claro, limpo e direto. Foco total no prêmio.',
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
    light: true,
  },
  {
    id: 'community',
    label: 'Escolar / Comunitário',
    description: 'Acolhedor e amigável, em verde e laranja.',
    primaryColor: '#0f3d2e',
    secondaryColor: '#f57c00',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #fffbeb 100%)',
    light: true,
  },
  {
    id: 'luxury',
    label: 'Luxo',
    description: 'Preto profundo com detalhes em vinho e prata.',
    primaryColor: '#e11d48',
    secondaryColor: '#9ca3af',
    background: 'linear-gradient(135deg, #120307 0%, #0a0a0a 60%, #14060a 100%)',
  },
  {
    id: 'event',
    label: 'Evento / Ingresso',
    description: 'Estilo bilhete com azul festivo e amarelo.',
    primaryColor: '#3b82f6',
    secondaryColor: '#facc15',
    background: 'linear-gradient(135deg, #061025 0%, #0a0a18 60%, #0a1430 100%)',
  },
]

export function getTemplate(id?: RaffleTemplate) {
  return RAFFLE_TEMPLATES.find(t => t.id === id) || RAFFLE_TEMPLATES[0]
}

export interface ResolvedTheme {
  primaryColor: string
  secondaryColor: string
  background: string
  cardStyle: 'glass' | 'solid' | 'outline'
  gridStyle: 'rounded' | 'square' | 'pill'
  highlightText?: string
  light: boolean
}

/** Mescla o template base com a personalização do admin. */
export function resolveTheme(template?: RaffleTemplate, custom?: RaffleCustomDesign | null): ResolvedTheme {
  const base = getTemplate(template)
  return {
    primaryColor: custom?.primaryColor || base.primaryColor,
    secondaryColor: custom?.secondaryColor || base.secondaryColor,
    background: custom?.background || base.background,
    cardStyle: custom?.cardStyle || 'glass',
    gridStyle: custom?.gridStyle || 'rounded',
    highlightText: custom?.highlightText,
    light: !!base.light && !custom?.background,
  }
}

export const RAFFLE_STATUS_LABELS: Record<RaffleStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Em breve',
  open: 'Aberta',
  closed: 'Encerrada',
  drawing: 'Sorteando',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
}

export const RAFFLE_STATUS_COLORS: Record<RaffleStatus, string> = {
  draft: '#6b7280',
  scheduled: '#3b82f6',
  open: '#10b981',
  closed: '#f59e0b',
  drawing: '#a855f7',
  finished: '#22c55e',
  cancelled: '#ef4444',
}

export const RAFFLE_VISIBILITY_LABELS: Record<RaffleVisibility, string> = {
  public: 'Pública',
  unlisted: 'Não listada',
  private: 'Privada',
}

export function slugify(input: string): string {
  return (input || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function getEffectiveStatus(
  raffle: Pick<Raffle, 'status' | 'startsAt' | 'endsAt'>,
  now = new Date(),
): RaffleStatus {
  const { status } = raffle
  if (status === 'draft' || status === 'cancelled' || status === 'drawing' || status === 'finished') {
    return status
  }
  const starts = raffle.startsAt ? new Date(raffle.startsAt) : null
  const ends = raffle.endsAt ? new Date(raffle.endsAt) : null

  if (ends && now >= ends) return 'closed'
  if (starts && now < starts) return 'scheduled'
  if (status === 'scheduled' && (!starts || now >= starts)) return 'open'
  return status
}

export function canPurchase(raffle: Pick<Raffle, 'status' | 'startsAt' | 'endsAt'>, now = new Date()): boolean {
  return getEffectiveStatus(raffle, now) === 'open'
}

export function maskName(name?: string): string {
  if (!name) return 'Participante'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  if (parts.length === 1) {
    if (first.length <= 2) return first
    return `${first.slice(0, 2)}${'*'.repeat(Math.min(5, first.length - 2))}`
  }
  const last = parts[parts.length - 1]
  return `${first} ${last[0]}${'*'.repeat(4)}`
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return ''
  const [local, domain] = email.split('@')
  const head = local.slice(0, 1)
  return `${head}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`
}

export function pad(n: number, total: number): string {
  const width = String(total).length
  return String(n).padStart(width, '0')
}

export function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}
