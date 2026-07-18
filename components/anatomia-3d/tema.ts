import {
  Box,
  Heart,
  Activity,
  HeartPulse,
  Wind,
  Brain,
  Droplets,
  Stethoscope,
  Bone,
  Skull,
  PersonStanding,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORIAS, type CategoriaId, type CorKey, type IconKey } from '@/lib/anatomia-3d/modelos'

/**
 * Mapas de apresentação da seção Anatomia 3D. Ficam em `components/**` (e não em
 * `lib/**`) porque o content-scan do Tailwind só varre `app/**` e `components/**`
 * — as classes literais aqui precisam ser vistas para serem geradas.
 */

export const ICONS: Record<IconKey, LucideIcon> = {
  Heart,
  Activity,
  HeartPulse,
  Wind,
  Brain,
  Droplets,
  Stethoscope,
  Bone,
  Skull,
  PersonStanding,
}

export const FALLBACK_ICON: LucideIcon = Box

export interface Tema {
  grad: string
  text: string
  bg: string
  border: string
  hoverBorder: string
  chipActive: string
  glow: string
  ring: string
}

export const TEMA: Record<CorKey, Tema> = {
  rose: { grad: 'from-rose-500/25 via-rose-500/10 to-transparent', text: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', hoverBorder: 'group-hover:border-rose-500/40', chipActive: 'bg-rose-500 text-white border-rose-500', glow: 'group-hover:shadow-rose-500/20', ring: 'ring-rose-500/30' },
  red: { grad: 'from-red-500/25 via-red-500/10 to-transparent', text: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', hoverBorder: 'group-hover:border-red-500/40', chipActive: 'bg-red-500 text-white border-red-500', glow: 'group-hover:shadow-red-500/20', ring: 'ring-red-500/30' },
  fuchsia: { grad: 'from-fuchsia-500/25 via-fuchsia-500/10 to-transparent', text: 'text-fuchsia-500 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', hoverBorder: 'group-hover:border-fuchsia-500/40', chipActive: 'bg-fuchsia-500 text-white border-fuchsia-500', glow: 'group-hover:shadow-fuchsia-500/20', ring: 'ring-fuchsia-500/30' },
  sky: { grad: 'from-sky-500/25 via-sky-500/10 to-transparent', text: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', hoverBorder: 'group-hover:border-sky-500/40', chipActive: 'bg-sky-500 text-white border-sky-500', glow: 'group-hover:shadow-sky-500/20', ring: 'ring-sky-500/30' },
  violet: { grad: 'from-violet-500/25 via-violet-500/10 to-transparent', text: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', hoverBorder: 'group-hover:border-violet-500/40', chipActive: 'bg-violet-500 text-white border-violet-500', glow: 'group-hover:shadow-violet-500/20', ring: 'ring-violet-500/30' },
  emerald: { grad: 'from-emerald-500/25 via-emerald-500/10 to-transparent', text: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hoverBorder: 'group-hover:border-emerald-500/40', chipActive: 'bg-emerald-500 text-white border-emerald-500', glow: 'group-hover:shadow-emerald-500/20', ring: 'ring-emerald-500/30' },
  indigo: { grad: 'from-indigo-500/25 via-indigo-500/10 to-transparent', text: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', hoverBorder: 'group-hover:border-indigo-500/40', chipActive: 'bg-indigo-500 text-white border-indigo-500', glow: 'group-hover:shadow-indigo-500/20', ring: 'ring-indigo-500/30' },
  amber: { grad: 'from-amber-500/25 via-amber-500/10 to-transparent', text: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', hoverBorder: 'group-hover:border-amber-500/40', chipActive: 'bg-amber-500 text-white border-amber-500', glow: 'group-hover:shadow-amber-500/20', ring: 'ring-amber-500/30' },
  orange: { grad: 'from-orange-500/25 via-orange-500/10 to-transparent', text: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', hoverBorder: 'group-hover:border-orange-500/40', chipActive: 'bg-orange-500 text-white border-orange-500', glow: 'group-hover:shadow-orange-500/20', ring: 'ring-orange-500/30' },
  lime: { grad: 'from-lime-500/25 via-lime-500/10 to-transparent', text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/30', hoverBorder: 'group-hover:border-lime-500/40', chipActive: 'bg-lime-500 text-white border-lime-500', glow: 'group-hover:shadow-lime-500/20', ring: 'ring-lime-500/30' },
  teal: { grad: 'from-teal-500/25 via-teal-500/10 to-transparent', text: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', hoverBorder: 'group-hover:border-teal-500/40', chipActive: 'bg-teal-500 text-white border-teal-500', glow: 'group-hover:shadow-teal-500/20', ring: 'ring-teal-500/30' },
  cyan: { grad: 'from-cyan-500/25 via-cyan-500/10 to-transparent', text: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', hoverBorder: 'group-hover:border-cyan-500/40', chipActive: 'bg-cyan-500 text-white border-cyan-500', glow: 'group-hover:shadow-cyan-500/20', ring: 'ring-cyan-500/30' },
}

export function corDaCategoria(id: CategoriaId): CorKey {
  return CATEGORIAS.find(c => c.id === id)?.cor || 'rose'
}

export function temaDaCategoria(id: CategoriaId): Tema {
  return TEMA[corDaCategoria(id)]
}
