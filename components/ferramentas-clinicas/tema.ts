import {
  Activity,
  Baby,
  Bone,
  Brain,
  Calculator,
  Droplets,
  Flame,
  FlaskConical,
  Heart,
  Wind,
  Pill,
  Scissors,
  Salad,
  Stethoscope,
  Syringe,
  TestTube,
  Flower2,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { Nivel } from '@/lib/ferramentas-clinicas/tipos'

/**
 * Paleta e ícones das Ferramentas Clínicas.
 *
 * Duas famílias de cor convivem aqui e não devem se misturar. A **cor da
 * categoria** é identidade: gasometria é sempre ciano, cardiologia é sempre
 * vermelho, em qualquer tela. O **nível do resultado** é semáforo: verde, âmbar
 * e vermelho significam a mesma coisa em toda a seção, independentemente da
 * categoria. Usar a cor da categoria para pintar um resultado — ou o semáforo
 * para pintar um cabeçalho — quebra as duas leituras de uma vez.
 */

export interface TemaCor {
  text: string
  bg: string
  border: string
  grad: string
  hoverBorder: string
  raw: string
}

export const TEMA: Record<string, TemaCor> = {
  ciano: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', grad: 'from-cyan-500/15 to-transparent', hoverBorder: 'hover:border-cyan-500/45', raw: '#06b6d4' },
  vermelho: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', grad: 'from-rose-500/15 to-transparent', hoverBorder: 'hover:border-rose-500/45', raw: '#f43f5e' },
  azul: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', grad: 'from-sky-500/15 to-transparent', hoverBorder: 'hover:border-sky-500/45', raw: '#0ea5e9' },
  violeta: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', grad: 'from-violet-500/15 to-transparent', hoverBorder: 'hover:border-violet-500/45', raw: '#8b5cf6' },
  verde: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', grad: 'from-green-500/15 to-transparent', hoverBorder: 'hover:border-green-500/45', raw: '#22c55e' },
  indigo: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', grad: 'from-indigo-500/15 to-transparent', hoverBorder: 'hover:border-indigo-500/45', raw: '#6366f1' },
  ambar: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', grad: 'from-amber-500/15 to-transparent', hoverBorder: 'hover:border-amber-500/45', raw: '#f59e0b' },
  rosa: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', grad: 'from-pink-500/15 to-transparent', hoverBorder: 'hover:border-pink-500/45', raw: '#ec4899' },
  laranja: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', grad: 'from-orange-500/15 to-transparent', hoverBorder: 'hover:border-orange-500/45', raw: '#f97316' },
  turquesa: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', grad: 'from-teal-500/15 to-transparent', hoverBorder: 'hover:border-teal-500/45', raw: '#14b8a6' },
  magenta: { text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', grad: 'from-fuchsia-500/15 to-transparent', hoverBorder: 'hover:border-fuchsia-500/45', raw: '#d946ef' },
  esmeralda: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', grad: 'from-emerald-500/15 to-transparent', hoverBorder: 'hover:border-emerald-500/45', raw: '#10b981' },
  lima: { text: 'text-lime-600 dark:text-lime-500', bg: 'bg-lime-500/10', border: 'border-lime-500/30', grad: 'from-lime-500/15 to-transparent', hoverBorder: 'hover:border-lime-500/45', raw: '#84cc16' },
}

export const COR_PADRAO = TEMA.azul

export function tema(cor: string): TemaCor {
  return TEMA[cor] ?? COR_PADRAO
}

export const ICONES: Record<string, LucideIcon> = {
  gasometria: Waves,
  cardiologia: Heart,
  pneumologia: Wind,
  nefrologia: Droplets,
  infectologia: FlaskConical,
  neurologia: Brain,
  gastroenterologia: Flame,
  hematologia: TestTube,
  endocrinologia: Activity,
  pediatria: Baby,
  ginecologia: Flower2,
  emergencia: Syringe,
  cirurgia: Scissors,
  farmacologia: Pill,
  nutricao: Salad,
  osso: Bone,
  padrao: Calculator,
  stetho: Stethoscope,
}

export const ICONE_PADRAO = Calculator

/* ───────────────────────── Semáforo do resultado ───────────────────────── */

export interface EstiloNivel {
  /** Cartão do resultado principal. */
  cartao: string
  /** Texto do valor principal. */
  valor: string
  /** Etiqueta de classificação. */
  chip: string
  /** Barra lateral de uma linha de detalhe. */
  barra: string
  rotulo: string
}

export const NIVEIS: Record<Nivel, EstiloNivel> = {
  neutro: {
    cartao: 'border-border bg-muted/30',
    valor: 'text-foreground',
    chip: 'bg-muted text-muted-foreground border-border',
    barra: 'bg-muted-foreground/25',
    rotulo: 'Resultado',
  },
  ok: {
    cartao: 'border-emerald-500/30 bg-emerald-500/[0.07]',
    valor: 'text-emerald-700 dark:text-emerald-400',
    chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    barra: 'bg-emerald-500',
    rotulo: 'Dentro da faixa',
  },
  atencao: {
    cartao: 'border-amber-500/35 bg-amber-500/[0.08]',
    valor: 'text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30',
    barra: 'bg-amber-500',
    rotulo: 'Atenção',
  },
  alerta: {
    cartao: 'border-orange-500/40 bg-orange-500/[0.09]',
    valor: 'text-orange-700 dark:text-orange-400',
    chip: 'bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/35',
    barra: 'bg-orange-500',
    rotulo: 'Alerta',
  },
  critico: {
    cartao: 'border-rose-500/45 bg-rose-500/[0.10]',
    valor: 'text-rose-700 dark:text-rose-400',
    chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/35',
    barra: 'bg-rose-500',
    rotulo: 'Crítico',
  },
}

export function estiloNivel(nivel?: Nivel): EstiloNivel {
  return NIVEIS[nivel ?? 'neutro']
}
