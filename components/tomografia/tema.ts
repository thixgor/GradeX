import {
  Heart,
  Wind,
  Bone,
  Brain,
  Activity,
  Droplets,
  Layers,
  Dumbbell,
  Stethoscope,
  Waves,
  CircleDot,
  Eye,
  Baby,
  PersonStanding,
  GitBranch,
  Ribbon,
  type LucideIcon,
} from 'lucide-react'
import type { CategoriaEstrutura, JanelaId } from '@/lib/tomografia/tipos'

/**
 * Paleta do Manual de Tomografia.
 *
 * Regra de uso: a cor identifica a *família* da estrutura (artéria x veia x
 * osso...), nunca decora o card inteiro. Isso importa mais aqui do que em
 * outras seções — quem está aprendendo a ler TC precisa que "vermelho = artéria"
 * signifique sempre a mesma coisa, em todas as 20 séries.
 */
export interface TemaCor {
  /** Texto e ícone. */
  text: string
  /** Fundo tênue do chip/ícone. */
  bg: string
  /** Borda do chip. */
  border: string
  /** Chip selecionado (fundo sólido). */
  chipAtivo: string
  /** Cor crua para desenhar em canvas/SVG (ticks da régua de cortes). */
  raw: string
  /** Gradiente do cabeçalho da seção. */
  grad: string
  hoverBorder: string
}

export const TEMA: Record<string, TemaCor> = {
  vermelho: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    chipAtivo: 'bg-rose-500 text-white border-rose-500',
    raw: '#f43f5e',
    grad: 'from-rose-500/20 to-rose-500/[0.02]',
    hoverBorder: 'hover:border-rose-500/40',
  },
  azul: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    chipAtivo: 'bg-sky-500 text-white border-sky-500',
    raw: '#0ea5e9',
    grad: 'from-sky-500/20 to-sky-500/[0.02]',
    hoverBorder: 'hover:border-sky-500/40',
  },
  ambar: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    chipAtivo: 'bg-amber-500 text-white border-amber-500',
    raw: '#f59e0b',
    grad: 'from-amber-500/20 to-amber-500/[0.02]',
    hoverBorder: 'hover:border-amber-500/40',
  },
  violeta: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    chipAtivo: 'bg-violet-500 text-white border-violet-500',
    raw: '#8b5cf6',
    grad: 'from-violet-500/20 to-violet-500/[0.02]',
    hoverBorder: 'hover:border-violet-500/40',
  },
  esmeralda: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    chipAtivo: 'bg-emerald-500 text-white border-emerald-500',
    raw: '#10b981',
    grad: 'from-emerald-500/20 to-emerald-500/[0.02]',
    hoverBorder: 'hover:border-emerald-500/40',
  },
  laranja: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    chipAtivo: 'bg-orange-500 text-white border-orange-500',
    raw: '#f97316',
    grad: 'from-orange-500/20 to-orange-500/[0.02]',
    hoverBorder: 'hover:border-orange-500/40',
  },
  ciano: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    chipAtivo: 'bg-cyan-500 text-white border-cyan-500',
    raw: '#06b6d4',
    grad: 'from-cyan-500/20 to-cyan-500/[0.02]',
    hoverBorder: 'hover:border-cyan-500/40',
  },
  rosa: {
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    chipAtivo: 'bg-pink-500 text-white border-pink-500',
    raw: '#ec4899',
    grad: 'from-pink-500/20 to-pink-500/[0.02]',
    hoverBorder: 'hover:border-pink-500/40',
  },
  ardosia: {
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    chipAtivo: 'bg-slate-600 text-white border-slate-600',
    raw: '#64748b',
    grad: 'from-slate-500/20 to-slate-500/[0.02]',
    hoverBorder: 'hover:border-slate-500/40',
  },
  lima: {
    text: 'text-lime-600 dark:text-lime-400',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    chipAtivo: 'bg-lime-600 text-white border-lime-600',
    raw: '#84cc16',
    grad: 'from-lime-500/20 to-lime-500/[0.02]',
    hoverBorder: 'hover:border-lime-500/40',
  },
}

export const TEMA_PADRAO = TEMA.ardosia

export function tema(cor: string | undefined): TemaCor {
  return (cor && TEMA[cor]) || TEMA_PADRAO
}

/** Cada família de estrutura tem cor fixa em todo o manual. */
export const COR_CATEGORIA: Record<CategoriaEstrutura, string> = {
  arteria: 'vermelho',
  veia: 'azul',
  osso: 'ambar',
  musculo: 'rosa',
  'viscera-parenquimatosa': 'violeta',
  'viscera-oca': 'laranja',
  'via-aerea': 'ciano',
  nervoso: 'violeta',
  liquor: 'ciano',
  'seio-paranasal': 'lima',
  glandula: 'esmeralda',
  urinario: 'esmeralda',
  genital: 'rosa',
  'partes-moles': 'ardosia',
  serosa: 'ardosia',
  biliar: 'lima',
}

export const ROTULO_CATEGORIA: Record<CategoriaEstrutura, string> = {
  arteria: 'Artéria',
  veia: 'Veia',
  osso: 'Osso',
  musculo: 'Músculo',
  'viscera-parenquimatosa': 'Víscera parenquimatosa',
  'viscera-oca': 'Víscera oca',
  'via-aerea': 'Via aérea',
  nervoso: 'Sistema nervoso',
  liquor: 'Espaço liquórico',
  'seio-paranasal': 'Seio paranasal',
  glandula: 'Glândula',
  urinario: 'Trato urinário',
  genital: 'Órgão genital',
  'partes-moles': 'Partes moles',
  serosa: 'Serosa',
  biliar: 'Via biliar',
}

export const ICONE_CATEGORIA: Record<CategoriaEstrutura, LucideIcon> = {
  arteria: Heart,
  veia: GitBranch,
  osso: Bone,
  musculo: Dumbbell,
  'viscera-parenquimatosa': Layers,
  'viscera-oca': CircleDot,
  'via-aerea': Wind,
  nervoso: Brain,
  liquor: Waves,
  'seio-paranasal': Wind,
  glandula: Activity,
  urinario: Droplets,
  genital: Baby,
  'partes-moles': Ribbon,
  serosa: Stethoscope,
  biliar: Droplets,
}

export const ICONES: Record<string, LucideIcon> = {
  heart: Heart,
  wind: Wind,
  bone: Bone,
  brain: Brain,
  activity: Activity,
  droplets: Droplets,
  layers: Layers,
  dumbbell: Dumbbell,
  stethoscope: Stethoscope,
  waves: Waves,
  circle: CircleDot,
  eye: Eye,
  venus: Baby,
  mars: PersonStanding,
  branch: GitBranch,
  ribbon: Ribbon,
}

export const ICONE_PADRAO = Stethoscope

/**
 * Presets de janela.
 *
 * A imagem que temos já saiu do tomógrafo renderizada em 8 bits, então não dá
 * para refazer window/level de verdade (isso exige os valores em UH do DICOM
 * cru). O que estes presets fazem é aproximar o *efeito visual* de cada janela
 * com brilho/contraste/gama — o suficiente para o estudante entender por que
 * o mesmo corte muda tanto de cara quando se troca a janela, que é a lição.
 * Os valores de WW/WL exibidos são os reais usados na prática clínica.
 */
export interface PresetJanela {
  id: JanelaId
  nome: string
  ww: number
  wl: number
  /** filtro CSS aplicado à imagem */
  filtro: string
  descricao: string
  /** para que serve na prática */
  uso: string
}

export const JANELAS: PresetJanela[] = [
  {
    id: 'padrao',
    nome: 'Original',
    ww: 0,
    wl: 0,
    filtro: 'none',
    descricao: 'A imagem exatamente como saiu do exame, sem reprocessamento.',
    uso: 'Ponto de partida. Sempre volte aqui antes de comparar janelas.',
  },
  {
    id: 'mediastinal',
    nome: 'Mediastinal / partes moles',
    ww: 350,
    wl: 50,
    filtro: 'brightness(1.06) contrast(1.28)',
    descricao: 'WW 350 · WL 50 — abre a faixa das partes moles (0 a 100 UH).',
    uso: 'Vasos, linfonodos, músculos, vísceras. É a janela de leitura padrão do tórax e do abdome.',
  },
  {
    id: 'pulmonar',
    nome: 'Pulmonar',
    ww: 1500,
    wl: -600,
    filtro: 'brightness(1.35) contrast(1.9)',
    descricao: 'WW 1500 · WL −600 — janela larga centrada no ar.',
    uso: 'Parênquima pulmonar, fissuras, enfisema, vidro fosco, bronquiectasias e pneumotórax.',
  },
  {
    id: 'ossea',
    nome: 'Óssea',
    ww: 2000,
    wl: 400,
    filtro: 'brightness(0.82) contrast(2.2)',
    descricao: 'WW 2000 · WL 400 — janela larguíssima centrada no osso cortical.',
    uso: 'Traços de fratura, erosões, lesões líticas/blásticas, suturas cranianas.',
  },
  {
    id: 'cerebral',
    nome: 'Cerebral',
    ww: 80,
    wl: 40,
    filtro: 'brightness(1.02) contrast(1.55)',
    descricao: 'WW 80 · WL 40 — janela estreitíssima; separa 30 UH de 40 UH.',
    uso: 'Diferenciar substância branca de cinzenta, ver o apagamento precoce do AVC isquêmico.',
  },
  {
    id: 'angio',
    nome: 'Angio / contraste',
    ww: 600,
    wl: 150,
    filtro: 'brightness(1.12) contrast(1.45) saturate(1.05)',
    descricao: 'WW 600 · WL 150 — centrada no iodo intravascular.',
    uso: 'Angio-TC: acompanhar um vaso opacificado sem estourar o brilho da luz arterial.',
  },
  {
    id: 'hepatica',
    nome: 'Hepática',
    ww: 150,
    wl: 60,
    filtro: 'brightness(1.04) contrast(1.7)',
    descricao: 'WW 150 · WL 60 — janela estreita sobre o fígado.',
    uso: 'Realça o contraste lesão-parênquima; achata nódulos hepáticos sutis contra o fígado normal.',
  },
]

export const JANELA_POR_ID: Record<JanelaId, PresetJanela> = JANELAS.reduce(
  (acc, j) => {
    acc[j.id] = j
    return acc
  },
  {} as Record<JanelaId, PresetJanela>,
)
