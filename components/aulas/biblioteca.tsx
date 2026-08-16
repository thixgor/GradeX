'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  PlayCircle,
  Sparkles,
} from 'lucide-react'
import { comModo, type ModoDeVisualizacao } from '@/lib/aulas/modo-visualizacao'
import { cn } from '@/lib/utils'

/**
 * Peças visuais da biblioteca de aulas.
 *
 * Ficam num arquivo só porque compartilham a mesma linguagem: capa, barra de
 * progresso e estado de acesso aparecem juntos em todo lugar (retomada, card de
 * aula, lista do curso). Espalhar isso em cinco arquivos faria a mesma regra de
 * "como um card de aula se parece" ser reinventada em cada tela — que é
 * exatamente como a versão antiga chegou onde chegou.
 *
 * Nenhum destes componentes decide acesso: eles recebem o veredito pronto do
 * servidor. A tela desenha, o servidor decide.
 */

/* =================== TIPOS =================== */

export interface AcessoDaAula {
  liberado: boolean
  porAmostra?: boolean
  requisito?: {
    motivo: string
    titulo: string
    acaoLabel?: string
    acaoHref?: string
    liberaEm?: string | Date
  } | null
}

export interface ProgressoDaAulaUI {
  percentual: number
  concluida: boolean
  posicaoSegundos?: number
}

export interface AulaNaBiblioteca {
  _id: string
  titulo: string
  descricao?: string
  capa?: { tipo?: string; imagem?: string; cor?: string; titulo?: string } | null
  tipo?: string
  acesso?: AcessoDaAula
  progresso?: ProgressoDaAulaUI | null
}

/* =================== PROGRESSO =================== */

export function BarraDeProgresso({
  percentual,
  concluida,
  className,
}: {
  percentual: number
  concluida?: boolean
  className?: string
}) {
  const valor = Math.max(0, Math.min(100, Math.round(percentual || 0)))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={concluida ? 'Aula concluída' : `${valor}% assistido`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          concluida ? 'bg-emerald-500' : 'bg-primary',
        )}
        style={{ width: `${valor}%` }}
      />
    </div>
  )
}

/** "18 de 32 aulas · 56%" — o resumo que o aluno lê antes de decidir estudar. */
export function ResumoDoCurso({
  concluidas,
  total,
  className,
}: {
  concluidas: number
  total: number
  className?: string
}) {
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {concluidas} de {total} {total === 1 ? 'aula' : 'aulas'}
        </span>
        <span className="font-bold tabular-nums text-primary">{percentual}%</span>
      </div>
      <BarraDeProgresso percentual={percentual} concluida={total > 0 && concluidas === total} />
    </div>
  )
}

/* =================== CAPA =================== */

export function CapaDaAula({
  aula,
  className,
}: {
  aula: Pick<AulaNaBiblioteca, 'capa' | 'titulo'>
  className?: string
}) {
  const capa = aula.capa
  if (capa?.tipo === 'imagem' && capa.imagem) {
    return (
      <div className={cn('relative overflow-hidden bg-muted', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capa.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    )
  }

  // Sem imagem, a capa em cor sólida ainda precisa distinguir uma aula da
  // outra: cai no título, que é o que o aluno usa para reconhecer o conteúdo.
  return (
    <div
      className={cn('flex items-center justify-center bg-primary/10 p-3 text-center', className)}
      style={capa?.cor ? { backgroundColor: capa.cor } : undefined}
    >
      <span className="line-clamp-3 text-xs font-bold text-primary-foreground mix-blend-luminosity">
        {capa?.titulo || aula.titulo}
      </span>
    </div>
  )
}

/* =================== TRILHO DESLIZANTE =================== */

/**
 * Faixa horizontal de cards — o "deslizante" da biblioteca.
 *
 * Substitui a grade porque a grade resolvia mal os dois extremos: no celular
 * ela vira uma coluna e um módulo de 12 aulas obriga a rolar meia tela para
 * chegar no módulo seguinte; no desktop ela quebra em várias fileiras e o
 * agrupamento por módulo se perde no meio.
 *
 * Num trilho, cada módulo ocupa UMA faixa. O olho corre a página na vertical
 * pelos módulos, e o dedo (ou a seta) corre as aulas na horizontal. É como o
 * conteúdo já é organizado na cabeça de quem estuda: "esse módulo tem essas
 * aulas".
 *
 * O snap alinha o card na borda ao soltar, para nunca sobrar meio card cortado
 * — que é o detalhe que separa "desliza bem" de "desliza".
 */
export function Trilho({ children }: { children: React.ReactNode }) {
  const refTrilho = useRef<HTMLDivElement>(null)
  const [temAntes, setTemAntes] = useState(false)
  const [temDepois, setTemDepois] = useState(false)

  const medir = useCallback(() => {
    const el = refTrilho.current
    if (!el) return
    // 4px de tolerância: arredondamento de subpixel deixaria a seta acesa no
    // fim do trilho, prometendo conteúdo que não existe.
    setTemAntes(el.scrollLeft > 4)
    setTemDepois(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    medir()
    const el = refTrilho.current
    if (!el) return
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [medir, children])

  const deslizar = (direcao: 1 | -1) => {
    const el = refTrilho.current
    if (!el) return
    // Rola quase uma tela cheia, deixando um card visível como âncora — pular
    // a tela inteira faz a pessoa perder a referência de onde estava.
    el.scrollBy({ left: direcao * (el.clientWidth * 0.85), behavior: 'smooth' })
  }

  return (
    <div className="group/trilho relative">
      <div
        ref={refTrilho}
        onScroll={medir}
        // `scroll-px-4` casa com o `px-4`: sem isso o snap alinha o card na
        // borda do container e engole o padding, deixando um trilho começando
        // em 0 e o de baixo em 16px — o desalinhamento entre faixas que faz a
        // tela parecer desmontada.
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {children}
      </div>

      {/* Setas só onde há mouse: no celular o gesto é o dedo, e botão
          sobreposto ali só rouba área de toque do card. */}
      {temAntes ? (
        <button
          type="button"
          onClick={() => deslizar(-1)}
          aria-label="Voltar"
          className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 shadow-lg backdrop-blur transition hover:bg-muted md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}
      {temDepois ? (
        <button
          type="button"
          onClick={() => deslizar(1)}
          aria-label="Avançar"
          className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 shadow-lg backdrop-blur transition hover:bg-muted md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

/* =================== ESTADO DE ACESSO =================== */

/**
 * O selo que explica a situação da aula.
 *
 * Nunca devolve "bloqueada" sem dizer por quê: o motivo vem do servidor, e é a
 * diferença entre um cadeado que vende e um cadeado que só frustra.
 */
export function SeloDaAula({ acesso, progresso }: { acesso?: AcessoDaAula; progresso?: ProgressoDaAulaUI | null }) {
  if (acesso && !acesso.liberado) {
    const agendada = acesso.requisito?.motivo === 'agendada'
    const liberaEm = acesso.requisito?.liberaEm ? new Date(acesso.requisito.liberaEm) : null
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground backdrop-blur-sm">
        {agendada ? <Clock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {agendada && liberaEm
          ? `Em ${liberaEm.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
          : 'Bloqueada'}
      </span>
    )
  }

  if (acesso?.porAmostra) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 backdrop-blur-sm dark:text-amber-200">
        <Sparkles className="h-3 w-3" /> Amostra
      </span>
    )
  }

  if (progresso?.concluida) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 backdrop-blur-sm dark:text-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Concluída
      </span>
    )
  }

  return null
}

/* =================== CARD DE AULA =================== */

/**
 * Modo de visualização vigente na tela (§28).
 *
 * Vem por contexto, e não por prop, porque os cards ficam quatro níveis abaixo
 * da página — dentro de ramo, bloco agrupador e trilho. Empurrar a prop por
 * essa corrente inteira significaria alterar cinco componentes que não têm nada
 * a ver com permissão, e bastaria esquecer um para o admin cair fora do modo no
 * meio da conferência, sem perceber.
 */
const ContextoDoModo = createContext<ModoDeVisualizacao>('admin')

export function ProvedorDeModo({
  modo,
  children,
}: {
  modo: ModoDeVisualizacao
  children: React.ReactNode
}) {
  return <ContextoDoModo.Provider value={modo}>{children}</ContextoDoModo.Provider>
}

export function CardDeAula({ aula, noTrilho = false }: { aula: AulaNaBiblioteca; noTrilho?: boolean }) {
  const bloqueada = aula.acesso ? !aula.acesso.liberado : false
  const progresso = aula.progresso
  const modo = useContext(ContextoDoModo)

  return (
    <Link
      href={comModo(`/aulas/${aula._id}`, modo)}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition',
        'hover:border-primary/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
        // No trilho o card tem largura fixa e trava no snap. A largura cresce
        // com a tela para nunca virar um card minúsculo no desktop nem um card
        // largo demais no celular.
        noTrilho && 'w-[70vw] flex-none snap-start sm:w-64 lg:w-72',
        bloqueada && 'opacity-80',
      )}
    >
      <div className="relative aspect-video">
        <CapaDaAula aula={aula} className="h-full w-full" />

        <div className="absolute left-2 top-2">
          <SeloDaAula acesso={aula.acesso} progresso={progresso} />
        </div>

        {!bloqueada ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
            <PlayCircle className="h-10 w-10 text-white drop-shadow" strokeWidth={1.6} />
          </div>
        ) : null}

        {/* A barra fica colada na capa: é onde o olho já está quando bate o
            card, e evita uma linha extra em telas cheias de cards. */}
        {progresso && progresso.percentual > 0 ? (
          <div className="absolute inset-x-0 bottom-0">
            <BarraDeProgresso
              percentual={progresso.percentual}
              concluida={progresso.concluida}
              className="h-1 rounded-none bg-black/40"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {aula.titulo}
        </p>
        {bloqueada && aula.acesso?.requisito?.titulo ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{aula.acesso.requisito.titulo}</p>
        ) : aula.descricao ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{aula.descricao}</p>
        ) : null}
      </div>
    </Link>
  )
}


/* =================== CARD DE CURSO =================== */

export interface CursoNaBiblioteca {
  _id: string
  nome: string
  descricao?: string
  /** Capa cadastrada no setor. Era ignorada na primeira versão desta tela. */
  imagem?: string
}

/**
 * Card do curso, com a capa que o admin cadastrou.
 *
 * A primeira versão trocou a capa por um ícone genérico — e capa não é enfeite
 * numa biblioteca: é como o aluno reconhece o curso de relance, antes de ler o
 * nome. Sem ela, uma lista de cursos vira uma lista de textos iguais.
 */
export function CardDeCurso({
  curso,
  progresso,
  onAbrir,
}: {
  curso: CursoNaBiblioteca
  progresso?: { total: number; concluidas: number }
  onAbrir: () => void
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="group flex w-[78vw] flex-none snap-start flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:w-72 lg:w-80"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-primary/10">
        {curso.imagem ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={curso.imagem}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-white">{curso.nome}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {curso.descricao ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{curso.descricao}</p>
        ) : null}
        {progresso && progresso.total > 0 ? (
          <ResumoDoCurso concluidas={progresso.concluidas} total={progresso.total} className="mt-auto" />
        ) : (
          <p className="mt-auto text-xs text-muted-foreground">Nenhuma aula publicada ainda.</p>
        )}
      </div>
    </button>
  )
}

/* =================== CONTINUE ESTUDANDO =================== */

export interface ItemDeRetomada {
  aulaId: string
  titulo: string
  curso?: string | null
  modulo?: string | null
  percentual: number
  retomarLabel: string
  href: string
  capa?: AulaNaBiblioteca['capa']
}

/**
 * A faixa de retomada (§35).
 *
 * É a primeira coisa da tela porque responde a primeira pergunta de quem abre a
 * plataforma: "onde eu parei?". Sem ela, o aluno precisa lembrar o curso, achar
 * o módulo e caçar a aula — três decisões antes de estudar um minuto.
 */
export function ContinueEstudando({ itens }: { itens: ItemDeRetomada[] }) {
  const modo = useContext(ContextoDoModo)
  if (itens.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
        <PlayCircle className="h-5 w-5 text-primary" />
        Continue estudando
      </h2>

      <Trilho>
        {itens.map((item) => (
          <Link
            key={item.aulaId}
            href={comModo(item.href, modo)}
            className="group flex w-[80vw] flex-none snap-start gap-3 overflow-hidden rounded-xl border border-primary/25 bg-primary/5 p-3 transition hover:border-primary/50 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:w-80"
          >
            <CapaDaAula
              aula={{ capa: item.capa, titulo: item.titulo }}
              className="h-16 w-24 flex-none overflow-hidden rounded-lg"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
              <div className="min-w-0">
                {item.curso ? (
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {item.curso}
                  </p>
                ) : null}
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.titulo}</p>
              </div>
              <div className="space-y-1">
                <BarraDeProgresso percentual={item.percentual} />
                <p className="text-[11px] font-bold text-primary">{item.retomarLabel}</p>
              </div>
            </div>
          </Link>
        ))}
      </Trilho>
    </section>
  )
}

/* =================== ESTADOS VAZIOS =================== */

/**
 * Vazio útil (§43).
 *
 * "Nenhum curso encontrado" é um beco: informa e não oferece saída. Todo estado
 * vazio aqui explica o que houve e dá o próximo passo.
 */
export function EstadoVazio({
  icone: Icone = Sparkles,
  titulo,
  descricao,
  acaoLabel,
  acaoHref,
  onAcao,
}: {
  icone?: typeof Sparkles
  titulo: string
  descricao: string
  acaoLabel?: string
  acaoHref?: string
  onAcao?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icone className="h-6 w-6" />
      </div>
      <p className="text-base font-bold">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        {descricao}
      </p>
      {acaoLabel && (acaoHref || onAcao) ? (
        acaoHref ? (
          <Link
            href={acaoHref}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            {acaoLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAcao}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            {acaoLabel}
          </button>
        )
      ) : null}
    </div>
  )
}

/** Esqueleto de carregamento — sem piscar nem pular layout (§42). */
export function EsqueletoDeCards({ quantidade = 8 }: { quantidade?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
