'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Bone,
  Brain,
  CircleDot,
  Compass,
  Droplets,
  Heart,
  Info,
  Layers,
  MapPin,
  Network,
  Sparkles,
  Stethoscope,
  Target,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { MarkerInsight } from '@/lib/atlas-anatomia/insights'

/**
 * Ficha da estrutura selecionada no Atlas.
 *
 * É o coração da experiência: o marcador dá o nome, e é aqui que ele vira
 * conhecimento — identidade, topografia, função, vascularização, inervação,
 * relações, correlação clínica e os pontos que costumam ser cobrados.
 *
 * O mesmo componente serve o painel lateral do desktop e a gaveta do celular,
 * variando apenas a densidade.
 */

const ICONES_POR_CLASSE: Record<string, LucideIcon> = {
  musculo: Activity,
  tendao: Activity,
  ligamento: Network,
  fascia: Layers,
  articulacao: Bone,
  cartilagem: Layers,
  osso: Bone,
  'osso-carpal': Bone,
  'acidente-osseo': Bone,
  'passagem-ossea': Compass,
  sutura: Bone,
  fonticulo: Bone,
  'ponto-craniometrico': Target,
  'diametro-cefalico': Target,
  'seio-paranasal': Wind,
  arteria: Droplets,
  veia: Droplets,
  'seio-venoso': Droplets,
  nervo: Zap,
  'plexo-nervoso': Zap,
  ganglio: Zap,
  snc: Brain,
  meninge: Brain,
  ventriculo: Waves,
  'camara-cardiaca': Heart,
  cardiaco: Heart,
  valva: Heart,
  'via-aerea': Wind,
  viscera: Stethoscope,
  glandula: Droplets,
  linfatico: Network,
  serosa: Layers,
  dente: Bone,
  estrutura: CircleDot,
}

/**
 * Cor por família de estrutura. Osso é âmbar, vaso é vermelho, nervo é violeta,
 * víscera é esmeralda — a mesma convenção que os atlas impressos usam há um
 * século, para o aluno reconhecer a classe antes mesmo de ler o selo.
 */
function familia(classeId: string) {
  if (['arteria', 'veia', 'seio-venoso', 'camara-cardiaca', 'cardiaco', 'valva', 'glandula'].includes(classeId)) {
    return {
      selo: 'border-rose-400/30 bg-rose-500/12 text-rose-600 dark:text-rose-300',
      realce: 'text-rose-600 dark:text-rose-400',
      barra: 'from-rose-500/70 to-rose-500/0',
      marcador: 'bg-rose-500',
    }
  }
  if (['nervo', 'plexo-nervoso', 'ganglio', 'snc', 'meninge', 'ventriculo'].includes(classeId)) {
    return {
      selo: 'border-violet-400/30 bg-violet-500/12 text-violet-600 dark:text-violet-300',
      realce: 'text-violet-600 dark:text-violet-400',
      barra: 'from-violet-500/70 to-violet-500/0',
      marcador: 'bg-violet-500',
    }
  }
  if (['musculo', 'tendao', 'fascia', 'ligamento', 'cartilagem', 'articulacao'].includes(classeId)) {
    return {
      selo: 'border-orange-400/30 bg-orange-500/12 text-orange-600 dark:text-orange-300',
      realce: 'text-orange-600 dark:text-orange-400',
      barra: 'from-orange-500/70 to-orange-500/0',
      marcador: 'bg-orange-500',
    }
  }
  if (['viscera', 'via-aerea', 'serosa', 'linfatico', 'dente'].includes(classeId)) {
    return {
      selo: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
      realce: 'text-emerald-600 dark:text-emerald-400',
      barra: 'from-emerald-500/70 to-emerald-500/0',
      marcador: 'bg-emerald-500',
    }
  }
  return {
    selo: 'border-amber-400/30 bg-amber-500/12 text-amber-700 dark:text-amber-300',
    realce: 'text-amber-700 dark:text-amber-400',
    barra: 'from-amber-500/70 to-amber-500/0',
    marcador: 'bg-amber-500',
  }
}

function Bloco({
  icone: Icone,
  titulo,
  texto,
  cor,
}: {
  icone: LucideIcon
  titulo: string
  texto?: string
  cor: string
}) {
  if (!texto || !texto.trim()) return null
  return (
    <section className="border-t border-border/60 px-4 py-3.5 sm:px-5">
      <h3 className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        <Icone className={`h-3.5 w-3.5 ${cor}`} />
        {titulo}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-foreground/85 sm:text-sm">{texto}</p>
    </section>
  )
}

export function FichaVazia({ compacta }: { compacta?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center ${
        compacta ? 'min-h-[140px]' : 'min-h-[280px]'
      }`}
    >
      <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
        <Target className="h-6 w-6" />
      </div>
      <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight">Toque em um marcador</h3>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Cada número na prancha abre uma ficha com localização, função, vascularização, inervação e correlação clínica.
      </p>
    </div>
  )
}

export interface FichaEstruturaProps {
  titulo: string
  numero: number
  insight: MarkerInsight
  /** Densidade reduzida para a gaveta do celular. */
  compacta?: boolean
  /** Quando presente, oferece o caminho de volta ao resumo. */
  onRecolher?: () => void
}

function Identidade({
  titulo,
  numero,
  insight,
}: {
  titulo: string
  numero: number
  insight: MarkerInsight
}) {
  const cores = familia(insight.classeId)
  const Icone = ICONES_POR_CLASSE[insight.classeId] || CircleDot

  return (
    <>
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${cores.barra}`} aria-hidden />
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black tabular-nums ${cores.selo}`}
        >
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl">{titulo}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cores.selo}`}>
              <Icone className="h-3 w-3" />
              {insight.classe}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {insight.regiao}
            </span>
            {insight.aprofundado && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> aprofundado
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Primeiro nível da ficha: nome, classe, região e a frase de identidade.
 *
 * Boa parte das consultas termina aqui — o aluno olhou a prancha, quer saber
 * que estrutura é aquela e volta a estudar. Despejar sete blocos de texto nesse
 * momento é ruído; quem quiser o resto pede.
 */
function FichaResumo({
  titulo,
  numero,
  insight,
  onAprofundar,
}: {
  titulo: string
  numero: number
  insight: MarkerInsight
  onAprofundar: () => void
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <Identidade titulo={titulo} numero={numero} insight={insight} />
        <p className="mt-3.5 text-[13.5px] font-medium leading-relaxed text-foreground/90 sm:text-sm">
          {insight.resumo}
        </p>
        <button
          type="button"
          onClick={onAprofundar}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
        >
          Ver detalhes completos
          <ChevronDown className="h-4 w-4" />
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Localização, função, vascularização, inervação e clínica
        </p>
      </div>
    </article>
  )
}

export function FichaEstrutura({ titulo, numero, insight, compacta, onRecolher }: FichaEstruturaProps) {
  const cores = familia(insight.classeId)

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="relative px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <Identidade titulo={titulo} numero={numero} insight={insight} />
        <p className="mt-3.5 text-[13.5px] font-medium leading-relaxed text-foreground/90 sm:text-sm">{insight.resumo}</p>
      </header>

      <Bloco icone={Compass} titulo="Localização" texto={insight.localizacao} cor={cores.realce} />
      <Bloco
        icone={MapPin}
        titulo={`Contexto · ${insight.regiao}`}
        texto={compacta ? undefined : insight.contextoRegional}
        cor={cores.realce}
      />
      <Bloco icone={CircleDot} titulo="Função" texto={insight.funcao} cor={cores.realce} />
      <Bloco
        icone={Droplets}
        titulo={insight.vasosRegionais ? 'Vascularização da região' : 'Vascularização'}
        texto={insight.vascularizacao}
        cor="text-rose-500"
      />
      <Bloco
        icone={Zap}
        titulo={insight.vasosRegionais ? 'Inervação da região' : 'Inervação'}
        texto={insight.inervacao}
        cor="text-violet-500"
      />
      <Bloco icone={Network} titulo="Drenagem linfática da região" texto={insight.linfaticos} cor="text-emerald-500" />
      <Bloco icone={Layers} titulo="Relações anatômicas" texto={insight.relacoes} cor={cores.realce} />
      <Bloco icone={Target} titulo="Reparos no exame físico" texto={compacta ? undefined : insight.reparos} cor={cores.realce} />
      <Bloco icone={Stethoscope} titulo="Correlação clínica" texto={insight.clinica} cor="text-sky-500" />

      {insight.pontos.length > 0 && (
        <section className="border-t border-border/60 bg-muted/30 px-4 py-3.5 sm:px-5">
          <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            <BookMarked className={`h-3.5 w-3.5 ${cores.realce}`} />
            Você precisa saber responder
          </h3>
          <ul className="space-y-1.5">
            {insight.pontos.map(ponto => (
              <li key={ponto} className="flex gap-2 text-[13px] leading-relaxed text-foreground/80">
                <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${cores.marcador}`} aria-hidden />
                {ponto}
              </li>
            ))}
          </ul>
        </section>
      )}

      {insight.notaAcervo && (
        <section className="border-t border-border/60 px-4 py-3.5 sm:px-5">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3">
            <h3 className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Info className="h-3 w-3" /> Nota do acervo UFJF
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{insight.notaAcervo}</p>
          </div>
        </section>
      )}

      {onRecolher && (
        <div className="border-t border-border/60 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onRecolher}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            <ChevronUp className="h-3.5 w-3.5" /> Mostrar só o nome
          </button>
        </div>
      )}
    </article>
  )
}

/**
 * Ficha em dois níveis.
 *
 * Selecionar um marcador quase sempre é uma pergunta curta — "que estrutura é
 * essa?". A ficha abre no resumo e só se aprofunda a pedido, e volta ao resumo
 * sozinha a cada nova estrutura, para o comportamento ser sempre o mesmo.
 */
export function FichaMarcador({
  titulo,
  numero,
  insight,
  compacta,
  chave,
}: {
  titulo: string
  numero: number
  insight: MarkerInsight
  compacta?: boolean
  /** Muda a cada estrutura selecionada e recolhe a ficha de volta ao resumo. */
  chave: string
}) {
  const [expandida, setExpandida] = useState(false)

  useEffect(() => {
    setExpandida(false)
  }, [chave])

  if (!expandida) {
    return (
      <FichaResumo titulo={titulo} numero={numero} insight={insight} onAprofundar={() => setExpandida(true)} />
    )
  }

  return (
    <FichaEstrutura
      titulo={titulo}
      numero={numero}
      insight={insight}
      compacta={compacta}
      onRecolher={() => setExpandida(false)}
    />
  )
}
