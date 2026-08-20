'use client'

import Link from 'next/link'
import { createContext, useContext, useMemo } from 'react'
import {
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Layers,
  Lock,
  Play,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * O vocabulário visual da Área de Ensino.
 *
 * POR QUE UM ARQUIVO DE PRIMITIVOS, E NÃO ESTILO EM CADA TELA
 *
 * A área tem oito telas de aluno e cinco de administração que mostram as mesmas
 * três coisas: uma aula, uma Trilha e um progresso. Estilizar isso tela a tela
 * é como a versão anterior acabou com quatro desenhos diferentes de "cartão de
 * aula" — cada um com uma altura, um raio de borda e um jeito próprio de
 * mostrar o cadeado. O aluno não lê isso como variedade; lê como desleixo.
 *
 * AS REGRAS DE DESENHO QUE ESTES COMPONENTES CARREGAM
 *
 *  • **Uma cor de acento.** Verde-escuro da marca. Estado (concluído, em
 *    andamento, bloqueado) é dito por forma e opacidade, não por uma paleta
 *    nova. Doze cores numa tela não são hierarquia, são ruído.
 *  • **Menos caixas.** Cartão em trilho não tem borda: o espaço já separa. A
 *    borda entra só onde existe interação de agrupamento.
 *  • **A capa é o conteúdo.** Quando a aula tem capa, ela ocupa o cartão; sem
 *    capa, o cartão vira tipografia — não uma moldura vazia com ícone genérico.
 *  • **O toque no celular tem 44px.** Alvo menor que isso é decoração, não
 *    controle.
 */

/* =================== CONTEXTO =================== */

interface ContextoDeEnsino {
  /** Slug da Trilha em curso — anexado aos links para dar contexto à aula. */
  trilha?: string
}

const Contexto = createContext<ContextoDeEnsino>({})

export function ProvedorDeEnsino({
  trilha,
  children,
}: {
  trilha?: string
  children: React.ReactNode
}) {
  const valor = useMemo(() => ({ trilha }), [trilha])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useEnsino() {
  return useContext(Contexto)
}

/* =================== TIPOS DE TELA =================== */

export interface AcessoNaTela {
  liberado: boolean
  porAmostra?: boolean
  requisito?: { motivo: string; titulo: string; acaoLabel?: string; acaoHref?: string } | null
}

export interface ProgressoNaTela {
  percentual: number
  concluida: boolean
  posicaoSegundos?: number
}

export interface AulaNaTela {
  _id: string
  titulo: string
  descricao?: string
  capa?: { tipo?: string; imagem?: string; cor?: string; titulo?: string } | null
  href: string
  duracaoLabel?: string
  profundidade?: string
  localizacao?: string
  tipo?: 'aula' | 'resumo'
  recursos?: { resumo?: boolean; pdf?: boolean; flashcards?: boolean }
  progresso?: ProgressoNaTela | null
  acesso?: AcessoNaTela
}

export interface TrilhaNaTela {
  _id: string
  slug: string
  titulo: string
  subtitulo?: string
  capa?: { tipo?: string; imagem?: string; cor?: string } | null
  nivel?: string
  publico?: string
  aulas: number
  etapas: number
  minutos: number
  destaque?: boolean
  progresso?: { percentual: number; iniciada: boolean; concluida: boolean; concluidos: number; total: number } | null
  acesso?: AcessoNaTela
}

/* =================== BLOCOS DE PÁGINA =================== */

/**
 * O título de uma faixa da home.
 *
 * Sempre com a mesma anatomia: título, subtítulo opcional e um "ver tudo"
 * discreto à direita. Repetir essa anatomia é o que faz seis faixas diferentes
 * parecerem uma página só.
 */
export function TituloDaFaixa({
  titulo,
  descricao,
  href,
  hrefLabel = 'Ver tudo',
  icone: Icone,
}: {
  titulo: string
  descricao?: string
  href?: string
  hrefLabel?: string
  icone?: LucideIcon
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight sm:text-xl">
          {Icone ? <Icone className="h-[1.1em] w-[1.1em] flex-none text-primary" /> : null}
          {titulo}
        </h2>
        {descricao ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex flex-none items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          {hrefLabel}
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  )
}

/**
 * Trilho horizontal com rolagem por toque.
 *
 * No celular, uma grade de doze cartões vira uma coluna de doze telas de altura
 * e a faixa seguinte deixa de existir para quem não rola até lá. O trilho
 * mantém a página curta e o "tem mais coisa aqui" visível pela borda cortada do
 * último cartão.
 */
export function Trilho({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2',
        // Esconde a barra de rolagem sem impedir a rolagem: no desktop ela
        // ficaria atravessada sob os cartões, e o gesto continua funcionando.
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'sm:mx-0 sm:px-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Grade({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}

/* =================== PROGRESSO =================== */

export function BarraDeProgresso({
  percentual,
  className,
  altura = 'fina',
}: {
  percentual: number
  className?: string
  altura?: 'fina' | 'media'
}) {
  const valor = Math.max(0, Math.min(100, Math.round(percentual || 0)))
  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-black/5',
        altura === 'fina' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      {/* O brilho na aresta de cima é o que faz a barra parecer preenchida —
          uma faixa chapada de cor lê como desenho, não como medida. */}
      <div
        className="relative h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${valor}%` }}
      >
        <span className="absolute inset-x-0.5 top-[1px] h-[3px] rounded-full bg-white/30" />
      </div>
    </div>
  )
}

/**
 * O anel de progresso da Trilha.
 *
 * Ele existe porque o número sozinho ("37%") não transmite percurso, e a barra
 * horizontal já é a linguagem da aula. O anel diz "caminho", que é exatamente a
 * diferença conceitual entre Trilha e aula (§8).
 */
export function AnelDeProgresso({
  percentual,
  tamanho = 44,
  espessura = 3,
  className,
}: {
  percentual: number
  tamanho?: number
  espessura?: number
  className?: string
}) {
  const valor = Math.max(0, Math.min(100, Math.round(percentual || 0)))
  const raio = (tamanho - espessura) / 2
  const circunferencia = 2 * Math.PI * raio

  return (
    <div className={cn('relative flex-none', className)} style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={espessura}
          className="stroke-muted"
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia - (circunferencia * valor) / 100}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
        {valor}%
      </span>
    </div>
  )
}

/* =================== CAPAS =================== */

/**
 * A capa de uma aula ou Trilha.
 *
 * Sem imagem, NÃO desenha um ícone genérico no meio de um retângulo cinza: usa
 * o próprio título em tipografia sobre um fundo da paleta. Cinquenta cartões
 * com o mesmo ícone de "play" no centro é ruído com aparência de conteúdo.
 */
export function Capa({
  capa,
  titulo,
  className,
  aspecto = 'video',
}: {
  capa?: { tipo?: string; imagem?: string; cor?: string; titulo?: string } | null
  titulo: string
  className?: string
  aspecto?: 'video' | 'alto'
}) {
  const cor = capa?.cor
  const imagem = capa?.tipo === 'imagem' ? capa.imagem : capa?.imagem

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-muted',
        aspecto === 'video' ? 'aspect-video' : 'aspect-[4/5]',
        className,
      )}
      style={cor && !imagem ? { backgroundColor: cor } : undefined}
    >
      {imagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagem}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center p-4',
            cor ? 'text-white' : 'bg-gradient-to-br from-primary/15 via-primary/5 to-transparent',
          )}
        >
          <span className="line-clamp-3 font-heading text-sm font-semibold leading-snug opacity-90">
            {capa?.titulo || titulo}
          </span>
        </div>
      )}
    </div>
  )
}

/* =================== SELOS =================== */

export function Selo({
  children,
  tom = 'neutro',
  className,
}: {
  children: React.ReactNode
  tom?: 'neutro' | 'primario' | 'aviso' | 'sucesso'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide leading-none',
        tom === 'primario' && 'bg-primary/12 text-primary',
        tom === 'sucesso' && 'bg-primary text-primary-foreground',
        tom === 'aviso' && 'bg-accent/20 text-accent-foreground',
        tom === 'neutro' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

const ICONE_DA_PROFUNDIDADE: Record<string, LucideIcon> = {
  essencial: Zap,
  intermediario: Layers,
  avancado: Sparkles,
}

const ROTULO_DA_PROFUNDIDADE: Record<string, string> = {
  essencial: 'Essencial',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export function SeloDeProfundidade({ profundidade }: { profundidade?: string }) {
  if (!profundidade || !ROTULO_DA_PROFUNDIDADE[profundidade]) return null
  const Icone = ICONE_DA_PROFUNDIDADE[profundidade]
  return (
    <Selo>
      <Icone className="h-3 w-3" />
      {ROTULO_DA_PROFUNDIDADE[profundidade]}
    </Selo>
  )
}

/** Os recursos da aula em três letras — a mesma verdade do painel e da aba. */
export function SelosDeRecurso({
  recursos,
  className,
}: {
  recursos?: { resumo?: boolean; pdf?: boolean; flashcards?: boolean }
  className?: string
}) {
  if (!recursos) return null
  const itens = [
    recursos.resumo ? { icone: Play, rotulo: 'Resumo' } : null,
    recursos.pdf ? { icone: FileText, rotulo: 'PDF' } : null,
    recursos.flashcards ? { icone: Layers, rotulo: 'Flashcards' } : null,
  ].filter(Boolean) as Array<{ icone: LucideIcon; rotulo: string }>

  if (itens.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
      {itens.map(({ icone: Icone, rotulo }) => (
        <span key={rotulo} title={rotulo} className="inline-flex items-center gap-0.5 text-[11px]">
          <Icone className="h-3 w-3" />
        </span>
      ))}
    </div>
  )
}

/* =================== CARTÃO DE AULA =================== */

/**
 * O cartão de aula — o objeto mais repetido da área inteira.
 *
 * Duas formas, e nenhuma terceira:
 *
 *  • `linha` — usada dentro de Trilha, etapa e listas verticais. Compacta,
 *    numerável, com o estado à esquerda. É a forma que comunica SEQUÊNCIA.
 *  • `cartao` — usada em trilhos e grades de descoberta. Tem capa. É a forma
 *    que comunica ESCOLHA.
 *
 * Usar a forma errada é o que faz uma Trilha parecer uma vitrine de vídeos.
 */
export function CartaoDeAula({
  aula,
  className,
}: {
  aula: AulaNaTela
  className?: string
}) {
  const { trilha } = useEnsino()
  const bloqueada = aula.acesso ? !aula.acesso.liberado : false
  const href = trilha && !aula.href.includes('trilha=')
    ? `${aula.href}${aula.href.includes('?') ? '&' : '?'}trilha=${trilha}`
    : aula.href

  return (
    <Link
      href={href}
      className={cn(
        'group flex w-[260px] flex-none snap-start flex-col gap-2 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-[2px] sm:w-full',
        className,
      )}
    >
      <div className="relative">
        <Capa capa={aula.capa} titulo={aula.titulo} />

        {bloqueada ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-[2px]">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : null}

        {aula.progresso?.concluida ? (
          <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        ) : null}

        {aula.duracaoLabel ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {aula.duracaoLabel}
          </span>
        ) : null}

        {/* A barra fica colada na capa, não abaixo do título: é ali que o olho
            procura "quanto falta", e ela some quando não há progresso. */}
        {aula.progresso && aula.progresso.percentual > 0 && !aula.progresso.concluida ? (
          <BarraDeProgresso
            percentual={aula.progresso.percentual}
            className="absolute inset-x-0 bottom-0 rounded-none rounded-b-2xl bg-black/40"
          />
        ) : null}
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug transition group-hover:text-primary">
          {aula.titulo}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {aula.localizacao ? <span className="truncate">{aula.localizacao}</span> : null}
          <SelosDeRecurso recursos={aula.recursos} className="ml-auto flex-none" />
        </div>
      </div>
    </Link>
  )
}

/**
 * A aula em linha, com número de ordem — a forma de dentro da Trilha.
 *
 * O número é o que transforma uma lista em percurso: sem ele, a etapa vira uma
 * pilha de vídeos e o aluno perde a noção de onde está no caminho.
 */
export function LinhaDeAula({
  aula,
  numero,
  atual,
  className,
}: {
  aula: AulaNaTela
  numero?: number
  atual?: boolean
  className?: string
}) {
  const { trilha } = useEnsino()
  const bloqueada = aula.acesso ? !aula.acesso.liberado : false
  const concluida = aula.progresso?.concluida === true
  const href = trilha && !aula.href.includes('trilha=')
    ? `${aula.href}${aula.href.includes('?') ? '&' : '?'}trilha=${trilha}`
    : aula.href

  return (
    <Link
      href={href}
      aria-current={atual ? 'true' : undefined}
      className={cn(
        'group flex min-h-[3.25rem] items-center gap-3 rounded-xl px-3 py-2.5 transition',
        atual ? 'bg-primary/10' : 'hover:bg-muted/70',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-extrabold tabular-nums transition',
          concluida
            ? 'bg-primary text-primary-foreground shadow-[0_2px_0_rgb(0_0_0/0.2)]'
            : atual
              ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
              : 'bg-muted text-muted-foreground group-hover:bg-background',
        )}
      >
        {concluida ? (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        ) : bloqueada ? (
          <Lock className="h-3 w-3" />
        ) : (
          numero ?? <Play className="h-3 w-3" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm font-medium leading-tight',
            atual && 'text-primary',
            concluida && !atual && 'text-muted-foreground',
          )}
        >
          {aula.titulo}
        </span>
        {aula.progresso && aula.progresso.percentual > 0 && !concluida ? (
          <BarraDeProgresso percentual={aula.progresso.percentual} className="mt-1.5 max-w-[12rem]" />
        ) : null}
      </span>

      <span className="flex flex-none items-center gap-2 text-xs tabular-nums text-muted-foreground">
        <SelosDeRecurso recursos={aula.recursos} />
        {aula.duracaoLabel}
      </span>
    </Link>
  )
}

/* =================== CARTÃO DE TRILHA =================== */

const ROTULO_DO_NIVEL: Record<string, string> = {
  iniciante: 'Do zero',
  intermediario: 'Intermediária',
  avancado: 'Avançada',
}

/**
 * O cartão de Trilha.
 *
 * Deliberadamente MAIOR e mais escuro que o de aula. Essa diferença de peso é o
 * que comunica, sem uma palavra de explicação, que Trilha é o objeto principal
 * da área e aula é a peça (§1). Igualar os dois desenhos faria a home voltar a
 * parecer uma lista de vídeos com nomes compridos.
 */
export function CartaoDeTrilha({
  trilha,
  className,
  formato = 'cartao',
}: {
  trilha: TrilhaNaTela
  className?: string
  formato?: 'cartao' | 'largo'
}) {
  const progresso = trilha.progresso
  const iniciada = progresso?.iniciada === true
  const bloqueada = trilha.acesso ? !trilha.acesso.liberado : false

  const meta = [
    `${trilha.aulas} ${trilha.aulas === 1 ? 'aula' : 'aulas'}`,
    trilha.etapas > 0 ? `${trilha.etapas} ${trilha.etapas === 1 ? 'etapa' : 'etapas'}` : '',
    trilha.minutos > 0 ? formatarMinutos(trilha.minutos) : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/aulas/trilhas/${trilha.slug}`}
      className={cn(
        'group relative flex flex-none snap-start flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border/70',
        // A mesma gramática do botão: a peça tem espessura, sobe no hover e
        // afunda no toque. É o que faz um cartão parecer clicável antes de
        // qualquer instrução.
        'shadow-[0_4px_0_rgb(0_0_0/0.13)] transition-[transform,box-shadow] duration-150',
        'hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgb(0_0_0/0.15)] hover:ring-primary/40',
        'active:translate-y-[3px] active:shadow-none',
        formato === 'cartao' ? 'w-[280px] sm:w-full' : 'w-full',
        className,
      )}
    >
      <div className="relative">
        <Capa capa={trilha.capa} titulo={trilha.titulo} className="rounded-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {trilha.nivel && ROTULO_DO_NIVEL[trilha.nivel] ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                {ROTULO_DO_NIVEL[trilha.nivel]}
              </span>
            ) : null}
            {trilha.destaque ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                Comece por aqui
              </span>
            ) : null}
            {bloqueada ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                <Lock className="h-3 w-3" /> Bloqueada
              </span>
            ) : null}
          </div>

          {iniciada && progresso ? (
            <AnelDeProgresso percentual={progresso.percentual} tamanho={40} />
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-base font-extrabold leading-snug tracking-tight transition group-hover:text-primary">
          {trilha.titulo}
        </h3>
        {trilha.subtitulo ? (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {trilha.subtitulo}
          </p>
        ) : null}

        <p className="mt-auto pt-2 text-xs font-medium text-muted-foreground">
          {iniciada && progresso
            ? `${progresso.concluidos} de ${progresso.total} aulas · continue`
            : meta}
        </p>
      </div>
    </Link>
  )
}

export function formatarMinutos(minutos: number): string {
  const total = Math.max(0, Math.round(minutos || 0))
  if (total <= 0) return ''
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto > 0 ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

/* =================== ESTADOS =================== */

export function EstadoVazio({
  icone: Icone = BookOpen,
  titulo,
  descricao,
  acaoLabel,
  acaoHref,
  onAcao,
  className,
}: {
  icone?: LucideIcon
  titulo: string
  descricao?: string
  acaoLabel?: string
  acaoHref?: string
  onAcao?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl bg-muted/40 px-6 py-14 text-center ring-2 ring-dashed ring-border',
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card ring-1 ring-border">
        <Icone className="h-8 w-8 text-primary/60" strokeWidth={2} />
      </span>
      <p className="mt-4 font-heading text-lg font-extrabold tracking-tight">{titulo}</p>
      {descricao ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>
      ) : null}
      {acaoLabel && acaoHref ? (
        <Link
          href={acaoHref}
          className="mt-5 inline-flex h-12 items-center rounded-2xl bg-primary px-5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.28)] transition-[transform,box-shadow] duration-100 hover:brightness-110 active:translate-y-[3px] active:shadow-none"
        >
          {acaoLabel}
        </Link>
      ) : acaoLabel && onAcao ? (
        <button
          type="button"
          onClick={onAcao}
          className="mt-5 inline-flex h-12 items-center rounded-2xl bg-primary px-5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.28)] transition-[transform,box-shadow] duration-100 hover:brightness-110 active:translate-y-[3px] active:shadow-none"
        >
          {acaoLabel}
        </button>
      ) : null}
    </div>
  )
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} />
}

export function EsqueletoDeFaixa({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="space-y-3">
      <Esqueleto className="h-6 w-48" />
      <Trilho>
        {Array.from({ length: quantidade }).map((_, i) => (
          <div key={i} className="w-[260px] flex-none space-y-2 sm:w-full">
            <Esqueleto className="aspect-video w-full" />
            <Esqueleto className="h-4 w-3/4" />
            <Esqueleto className="h-3 w-1/2" />
          </div>
        ))}
      </Trilho>
    </div>
  )
}

/* =================== NAVEGAÇÃO =================== */

/** A migalha "Medicina › Ciclo Clínico › Cardiologia". */
export function Migalha({
  itens,
  className,
}: {
  itens: Array<{ _id?: string; nome: string; href?: string }>
  className?: string
}) {
  if (itens.length === 0) return null
  return (
    <nav
      aria-label="Localização"
      className={cn('flex flex-wrap items-center gap-1 text-xs text-muted-foreground', className)}
    >
      {itens.map((item, i) => (
        <span key={item._id || item.nome} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3 opacity-50" /> : null}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-primary">
              {item.nome}
            </Link>
          ) : (
            <span>{item.nome}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** O cadeado explicado — nunca "erro", sempre "o que falta" (§24). */
export function Cadeado({
  requisito,
  className,
}: {
  requisito?: { titulo: string; acaoLabel?: string; acaoHref?: string } | null
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl bg-card px-6 py-10 text-center shadow-[0_4px_0_rgb(0_0_0/0.1)] ring-1 ring-border',
        className,
      )}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <Lock className="h-6 w-6 text-muted-foreground" strokeWidth={2.5} />
      </span>
      <p className="font-heading text-lg font-extrabold tracking-tight">
        {requisito?.titulo || 'Conteúdo indisponível'}
      </p>
      {requisito?.acaoLabel && requisito.acaoHref ? (
        <Link
          href={requisito.acaoHref}
          className="inline-flex h-12 items-center rounded-2xl bg-primary px-5 text-sm font-extrabold uppercase tracking-wide text-primary-foreground shadow-[0_3px_0_rgb(0_0_0/0.28)] transition-[transform,box-shadow] duration-100 hover:brightness-110 active:translate-y-[3px] active:shadow-none"
        >
          {requisito.acaoLabel}
        </Link>
      ) : null}
    </div>
  )
}
