'use client'

/**
 * Tour interativo da dashboard.
 *
 * O problema que ele resolve: a plataforma tem onze áreas de estudo, um menu
 * lateral que some no celular e três blocos diferentes na primeira dobra. Quem
 * chega pela primeira vez não vê "muitas opções" — vê ruído, e sai sem estudar.
 *
 * Como funciona: um holofote recorta o elemento real da tela (não uma captura,
 * não um desenho) e um cartão explica o que aquilo faz e por que interessa.
 * Os passos são resolvidos NA HORA em que o tour abre, contra o DOM: alvo que
 * não existe naquela conta (questão do dia sem questão, área desligada pelo
 * admin, botão que só aparece no plano gratuito) simplesmente não vira passo —
 * nunca sobra um holofote apontando para o vazio.
 *
 * Implementação sem dependência externa e sem framer-motion: o recorte é um
 * `box-shadow` gigante que escurece tudo menos o alvo, e o movimento é
 * transição de CSS. A medição roda em rAF por ~900ms depois de cada troca de
 * passo (tempo do scroll suave e das animações de entrada assentarem) e depois
 * cai para listeners de scroll/resize — em vez de um rAF eterno chamando
 * getBoundingClientRect a 60fps.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BookMarked,
  Brain,
  Check,
  Compass,
  Database,
  FileText,
  LayoutGrid,
  LifeBuoy,
  Menu,
  Play,
  Rocket,
  Sparkles,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Roteiro ────────────────────────────────────────────────────

interface Chapter {
  label: string
  color: string
}

const CHAPTERS: Chapter[] = [
  { label: 'Onde você está', color: '#468152' },
  { label: 'O que dá pra fazer aqui', color: '#E2A43E' },
  { label: 'Suas ferramentas', color: '#8b5cf6' },
]

interface TourStep {
  id: string
  /** Índice em CHAPTERS. Passos de abertura/fechamento não têm capítulo. */
  chapter?: number
  /** Seletor do alvo. Sem alvo = cartão centralizado (abertura/fechamento). */
  target?: string
  icon: LucideIcon
  accent: string
  eyebrow: string
  title: string
  body: string
  /** Linha curta de reforço — o "e daí?" do passo. */
  hint?: string
  /** No celular o menu lateral está fechado; o passo precisa abri-lo. */
  needsSidebar?: boolean
}

function buildScript(firstName: string): TourStep[] {
  const hello = firstName ? `${firstName}, e` : 'E'

  return [
    {
      id: 'welcome',
      icon: Compass,
      accent: '#468152',
      eyebrow: 'Tour da plataforma',
      title: `${hello}m 1 minuto isso aqui para de ser confuso`,
      body:
        'A plataforma tem muita coisa: provas, banco de questões, flashcards, cronogramas, mapas mentais, materiais. É bom que tenha — mas ninguém precisa de tudo isso hoje. Vou te mostrar só o que faz diferença para você sair desta tela já estudando.',
      hint: 'Dá para pular a qualquer momento. E para refazer quando quiser.',
    },
    {
      id: 'hero-cta',
      chapter: 0,
      target: '[data-tour="hero-cta"]',
      icon: Play,
      accent: '#CE5929',
      eyebrow: 'O atalho',
      title: 'Na dúvida, é esse botão',
      body:
        'Ele existe para os dias em que você abre a plataforma e não sabe por onde começar. Um clique e você está na sua lista de provas, escolhendo o que resolver. Decidir depois é sempre melhor do que ficar parado decidindo.',
      hint: 'Guarda esse: é o caminho mais curto entre abrir o site e estar estudando.',
    },
    {
      id: 'questao-do-dia',
      chapter: 0,
      target: '[data-tour="questao-do-dia"]',
      icon: Target,
      accent: '#0ea5e9',
      eyebrow: 'O hábito',
      title: 'Uma questão por dia, em menos de um minuto',
      body:
        'Toda madrugada entra uma questão nova aqui, com gabarito comentado. Você responde no tempo de um café. Parece pouco — e é justamente por parecer pouco que você vai fazer nos dias ruins também.',
      hint: 'São 365 questões por ano feitas nos dias em que você achou que não ia estudar nada.',
    },
    {
      id: 'stats',
      chapter: 0,
      target: '[data-tour="stats"]',
      icon: LayoutGrid,
      accent: '#468152',
      eyebrow: 'Seu retrato',
      title: 'Seus números — e só os seus',
      body:
        'Questões respondidas, provas realizadas, aproveitamento no banco e dias de estudo. Nada aqui compara você com outra pessoa. Serve para uma coisa só: mostrar, sem discurso, se a semana passada foi mesmo o que você lembra que foi.',
      hint: 'O aproveitamento é o número que mais dói e o que mais ensina. Olhe para ele.',
    },
    {
      id: 'experiences',
      chapter: 1,
      target: '[data-tour="experiences"]',
      icon: Sparkles,
      accent: '#E2A43E',
      eyebrow: 'O corredor',
      title: 'Todas as áreas, deslizando em um lugar só',
      body:
        'Cada cartão é uma área completa da plataforma, com uma linha explicando o que ela faz. Arraste para o lado e leia sem clicar em nada. É o jeito mais rápido de descobrir o que existe aqui sem abrir onze abas.',
      hint: 'Não precisa usar tudo. Escolha duas áreas e faça delas a sua rotina.',
    },
    {
      id: 'sidebar-nav',
      chapter: 1,
      target: '[data-tour="sidebar-nav"]',
      icon: Menu,
      accent: '#8b5cf6',
      eyebrow: 'O mapa',
      title: 'O menu é o seu mapa — ele nunca sai daqui',
      body:
        'Tudo que existe na plataforma está nessa lista, sempre no mesmo lugar e na mesma ordem. As áreas do dia a dia ficam soltas; conjuntos grandes, como o Manual Clínico, vivem dentro de um item que abre e fecha. No computador o menu fica fixo à esquerda; no celular, aparece pelo botão no topo.',
      hint: 'Perdido? O campo de busca no topo do menu acha qualquer coisa — atalho ⌘K.',
      needsSidebar: true,
    },
    {
      id: 'sidebar-new-exam',
      chapter: 1,
      target: '[data-tour="sidebar-new-exam"]',
      icon: FileText,
      accent: '#468152',
      eyebrow: 'A criação',
      title: 'Monte uma prova sua em um clique',
      body:
        'Aqui você cria uma prova do jeito que precisa: os assuntos que quer treinar, a quantidade de questões, com tempo ou sem. É o botão para quando a prova da faculdade é amanhã e você quer simular a pressão, não só ler resumo.',
      hint: 'Responder questões treina conteúdo. Fazer prova treina tempo e nervo.',
      needsSidebar: true,
    },
    {
      id: 'header-tools',
      chapter: 2,
      target: '[data-tour="header-tools"]',
      icon: BellRing,
      accent: '#0ea5e9',
      eyebrow: 'A barra de cima',
      title: 'Foco, avisos e compras ficam sempre no topo',
      body:
        'Nesse canto você inicia uma sessão de foco cronometrada, vê as notificações do que aconteceu enquanto esteve fora e acessa o carrinho dos materiais. Esses botões seguem você em todas as telas — não precisa voltar à dashboard para usá-los.',
      hint: 'A sessão de foco é o botão mais subestimado da plataforma. Teste hoje.',
    },
    {
      id: 'tour-button',
      chapter: 2,
      target: '[data-tour="tour-button"]',
      icon: LifeBuoy,
      accent: '#E2A43E',
      eyebrow: 'A rede de segurança',
      title: 'E se você se perder de novo, é aqui',
      body:
        'Esse botão fica na dashboard para sempre. Refaça este tour quantas vezes quiser, no dia que quiser — sem custo, sem constrangimento, sem precisar pedir ajuda a ninguém. Estar perdido na primeira semana é normal; continuar perdido é que não precisa acontecer.',
      hint: 'Guardamos onde você parou: se sair no meio, volta exatamente daí.',
    },
    {
      id: 'finish',
      icon: Rocket,
      accent: '#468152',
      eyebrow: 'Pronto',
      title: 'Agora escolha uma coisa só',
      body:
        'Você acabou de ver a plataforma inteira, e a armadilha agora é querer usar tudo hoje. Escolha um único primeiro passo abaixo. O resto continua aqui amanhã.',
    },
  ]
}

// ─── Próximos passos do fechamento ──────────────────────────────

export interface TourStats {
  questionsAnswered?: number
  examsCompleted?: number
  cronogramasCreated?: number
}

interface NextAction {
  icon: LucideIcon
  color: string
  label: string
  detail: string
  href: string
}

/** Sugere o primeiro passo a partir do que a conta ainda NÃO tem. */
function buildNextActions(stats?: TourStats): NextAction[] {
  const all: (NextAction & { done: boolean })[] = [
    {
      icon: Database,
      color: '#0ea5e9',
      label: 'Responder 5 questões',
      detail: 'Banco de Questões',
      href: '/banco-questoes',
      done: (stats?.questionsAnswered ?? 0) > 0,
    },
    {
      icon: FileText,
      color: '#468152',
      label: 'Fazer sua primeira prova',
      detail: 'Provas',
      href: '/provas',
      done: (stats?.examsCompleted ?? 0) > 0,
    },
    {
      icon: BookMarked,
      color: '#E2A43E',
      label: 'Montar seu cronograma',
      detail: 'Cronogramas',
      href: '/cronogramas',
      done: (stats?.cronogramasCreated ?? 0) > 0,
    },
    {
      icon: Brain,
      color: '#8b5cf6',
      label: 'Revisar com flashcards',
      detail: 'Flashcards',
      href: '/flashcards',
      done: false,
    },
  ]

  // O que ainda falta vem primeiro: é onde a próxima sessão rende mais.
  const pending = all.filter(a => !a.done)
  const rest = all.filter(a => a.done)
  return [...pending, ...rest].slice(0, 3)
}

// ─── Geometria ──────────────────────────────────────────────────

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 10 // respiro do holofote em volta do alvo
const GAP = 16 // distância do cartão ao holofote
const EDGE = 12 // margem mínima até a borda da tela
const CARD_W = 360

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  )
}

/**
 * Alvo preso à tela (menu lateral `fixed`, cabeçalho `sticky`) já está visível
 * onde quer que a página esteja. Rolar atrás dele não aproxima nada — só
 * embaralha o fundo, e com `sticky` chega a puxar a página até a posição
 * estática do elemento, que é longe de onde ele aparece.
 */
function isPinned(el: Element | null): boolean {
  let node: Element | null = el
  while (node && node !== document.body) {
    const position = getComputedStyle(node).position
    if (position === 'fixed' || position === 'sticky') return true
    node = node.parentElement
  }
  return false
}

function measure(selector?: string): Rect | null {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

// ─── Componente ─────────────────────────────────────────────────

export function PlatformTour({
  open,
  initialStep = 0,
  firstName,
  stats,
  onSidebarRequest,
  onDismiss,
  onFinish,
}: {
  open: boolean
  initialStep?: number
  firstName?: string
  stats?: TourStats
  /** Abre/fecha o menu lateral no celular para os passos que dependem dele. */
  onSidebarRequest?: (open: boolean) => void
  /** Saiu no meio, com o passo em que estava. */
  onDismiss: (step: number) => void
  onFinish: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const script = useMemo(() => buildScript(firstName || ''), [firstName])
  const nextActions = useMemo(() => buildNextActions(stats), [stats])

  // Guardado em ref para a limpeza de desmontagem não depender da identidade
  // do callback (senão ela roda a cada troca de passo, fechando o menu no meio).
  const sidebarRequestRef = useRef(onSidebarRequest)
  sidebarRequestRef.current = onSidebarRequest

  useEffect(() => setMounted(true), [])

  // O tour desmonta ao ser fechado; o menu que ele abriu não pode ficar aberto.
  useEffect(() => () => sidebarRequestRef.current?.(false), [])

  // ── Montagem do roteiro real ──────────────────────────────────
  // Só entram os passos cujo alvo existe de fato nesta tela e nesta conta.
  useEffect(() => {
    if (!open) return
    const resolved = script.filter(step => {
      if (!step.target) return true
      const el = document.querySelector(step.target)
      if (!el) return false
      const r = el.getBoundingClientRect()
      // O menu lateral no celular vive fora da tela (translateX), mas continua
      // com dimensões — por isso a checagem é de tamanho, não de posição.
      return r.width > 0 && r.height > 0
    })
    setSteps(resolved)
    setIndex(Math.min(Math.max(0, initialStep), Math.max(0, resolved.length - 1)))
  }, [open, script, initialStep])

  const total = steps.length
  const step = steps[index]
  const isFirst = index === 0
  const isLast = index === total - 1

  // ── Menu lateral no celular ───────────────────────────────────
  useEffect(() => {
    if (!open || !step || typeof window === 'undefined') return
    if (window.innerWidth >= 1024) return
    sidebarRequestRef.current?.(!!step.needsSidebar)
  }, [open, step])

  // ── Medição do alvo ───────────────────────────────────────────
  useEffect(() => {
    if (!open || !step) return

    if (step.target) {
      const el = document.querySelector(step.target)
      if (el && !isPinned(el)) {
        const r = el.getBoundingClientRect()
        const offscreen = r.top < 72 || r.bottom > window.innerHeight - 72
        if (offscreen) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }

    let raf = 0
    const deadline = Date.now() + 900
    const tick = () => {
      setRect(prev => {
        const next = measure(step.target)
        return sameRect(prev, next) ? prev : next
      })
      // Enquanto o scroll suave e as animações de entrada assentam, mede a
      // cada quadro; depois disso, os listeners abaixo dão conta.
      if (Date.now() < deadline) raf = requestAnimationFrame(tick)
    }
    tick()

    const onMove = () => {
      setRect(prev => {
        const next = measure(step.target)
        return sameRect(prev, next) ? prev : next
      })
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, step, index])

  // ── Posicionamento do cartão ──────────────────────────────────
  useLayoutEffect(() => {
    if (!open || !step) return
    const card = cardRef.current
    if (!card) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const compact = vw < 720
    const width = compact ? Math.min(CARD_W, vw - EDGE * 2) : CARD_W
    const ch = card.offsetHeight

    if (!rect) {
      setPos({ top: Math.max(EDGE, (vh - ch) / 2), left: Math.max(EDGE, (vw - width) / 2), width })
      return
    }

    const bottom = rect.top + rect.height
    const right = rect.left + rect.width

    if (compact) {
      // Telas estreitas: o cartão vira uma faixa presa ao lado da tela que o
      // alvo NÃO está ocupando. Tentar encaixá-lo ao lado de um elemento que
      // já usa 90% da largura só produz cartão espremido.
      const targetInTopHalf = rect.top + rect.height / 2 < vh * 0.5
      const top = targetInTopHalf
        ? Math.min(bottom + GAP, vh - ch - EDGE)
        : Math.max(EDGE, rect.top - GAP - ch)
      setPos({ top: Math.max(EDGE, top), left: (vw - width) / 2, width })
      return
    }

    const space = {
      bottom: vh - bottom - GAP - EDGE,
      top: rect.top - GAP - EDGE,
      right: vw - right - GAP - EDGE,
      left: rect.left - GAP - EDGE,
    }

    let top: number
    let left: number

    if (space.bottom >= ch) {
      top = bottom + GAP
      left = rect.left + rect.width / 2 - width / 2
    } else if (space.top >= ch) {
      top = rect.top - GAP - ch
      left = rect.left + rect.width / 2 - width / 2
    } else if (space.right >= width) {
      left = right + GAP
      top = rect.top + rect.height / 2 - ch / 2
    } else if (space.left >= width) {
      left = rect.left - GAP - width
      top = rect.top + rect.height / 2 - ch / 2
    } else {
      // Alvo ocupa quase tudo: encosta no lado com mais folga.
      const preferRight = vw - right > rect.left
      left = preferRight ? vw - width - EDGE : EDGE
      top = rect.top + rect.height / 2 - ch / 2
    }

    setPos({
      top: Math.min(Math.max(EDGE, top), Math.max(EDGE, vh - ch - EDGE)),
      left: Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - width - EDGE)),
      width,
    })
  }, [rect, index, open, step])

  // ── Navegação ─────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (isLast) onFinish()
    else setIndex(i => Math.min(i + 1, total - 1))
  }, [isLast, onFinish, total])

  const goPrev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])

  const handleDismiss = useCallback(() => onDismiss(index), [onDismiss, index])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleDismiss()
      } else if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goNext, goPrev, handleDismiss])

  const openAction = useCallback(
    (href: string) => {
      onFinish()
      router.push(href)
    },
    [onFinish, router],
  )

  if (!mounted || !open || !step) return null

  const Icon = step.icon
  const chapter = step.chapter !== undefined ? CHAPTERS[step.chapter] : null
  const spotlight = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null
  const centered = !step.target

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-tour-title"
      onTouchStart={e => {
        touchStartX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={e => {
        const start = touchStartX.current
        touchStartX.current = null
        if (start === null) return
        const delta = (e.changedTouches[0]?.clientX ?? start) - start
        if (delta < -56) goNext()
        else if (delta > 56 && !isFirst) goPrev()
      }}
    >
      {/* Fundo escurecido. Com alvo, o recorte é feito por quatro painéis em
          volta dele — e não pelo `box-shadow: 0 0 0 9999px` de sempre. Um
          spread de ~10.000px depende de o navegador rasterizar uma sombra
          muito maior que a tela; quatro divs opacos são só quatro retângulos,
          animam as próprias medidas e não têm esse limite. */}
      {spotlight ? (
        <>
          <MaskPanels rect={spotlight} />
          {/* Contorno + halo pulsante: levam o olho ao recorte antes da
              leitura do cartão. */}
          <div
            className="tour-spotlight pointer-events-none fixed rounded-lg"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: `inset 0 0 0 2px ${step.accent}`,
            }}
          />
          <div
            className="tour-halo pointer-events-none fixed rounded-lg"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow: `0 0 0 3px ${step.accent}`,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-[rgba(6,14,9,0.8)] backdrop-blur-[2px]" />
      )}

      {/* Cartão */}
      <div
        ref={cardRef}
        key={step.id}
        className={cn(
          'tour-card-in fixed overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40',
          centered && 'max-w-[calc(100vw-24px)]',
        )}
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          width: centered ? Math.min(440, (pos?.width ?? CARD_W) + 80) : pos?.width ?? CARD_W,
          maxWidth: 'calc(100vw - 24px)',
          opacity: pos ? 1 : 0,
          transition: 'top .3s cubic-bezier(0.22,1,0.36,1), left .3s cubic-bezier(0.22,1,0.36,1), opacity .2s ease',
        }}
      >
        {/* Fio de cor do capítulo */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
        />

        <div className="p-5">
          {/* Cabeçalho: capítulo + contador + fechar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${step.accent}1f`, color: step.accent }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-clinical text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {chapter ? chapter.label : step.eyebrow}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground/70">
                  Passo {index + 1} de {total}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fechar tour"
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Ilustração só na abertura */}
          {step.id === 'welcome' && <WelcomeVisual />}

          <h3
            id="platform-tour-title"
            className="mt-3 font-heading text-[17px] font-semibold leading-snug tracking-tight text-foreground sm:text-lg"
          >
            {step.title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>

          {step.hint && (
            <div
              className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: `${step.accent}12` }}
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: step.accent }} />
              <p className="text-[12px] font-medium leading-relaxed" style={{ color: step.accent }}>
                {step.hint}
              </p>
            </div>
          )}

          {/* Próximos passos, no fechamento */}
          {isLast && (
            <div className="mt-4 space-y-2">
              {nextActions.map(action => {
                const ActionIcon = action.icon
                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => openAction(action.href)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-3 text-left transition hover:border-primary/40 hover:bg-muted/50 active:scale-[0.99]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}1a`, color: action.color }}
                    >
                      <ActionIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">{action.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{action.detail}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Régua de progresso — cada segmento é um passo e leva até ele */}
          <div className="mt-4 flex items-center gap-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir para o passo ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'step' : undefined}
                className="group h-3 flex-1 py-1"
              >
                <span
                  className={cn(
                    'block h-1 w-full rounded-full transition-all duration-300',
                    i <= index ? 'opacity-100' : 'bg-border opacity-100 group-hover:bg-muted-foreground/40',
                  )}
                  style={i <= index ? { backgroundColor: step.accent } : undefined}
                />
              </button>
            ))}
          </div>

          {/* Ações */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-semibold text-muted-foreground/70 underline-offset-4 transition hover:text-foreground hover:underline"
            >
              {isLast ? 'Fechar' : 'Pular tour'}
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] font-semibold text-foreground transition hover:bg-muted active:scale-[0.97]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="group inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-bold text-white shadow-sm transition active:scale-[0.97]"
                style={{ backgroundColor: step.accent }}
              >
                {isLast ? (
                  <>
                    Entendi, bora
                    <Check className="h-3.5 w-3.5" />
                  </>
                ) : isFirst ? (
                  <>
                    Bora, me mostra
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Máscara do holofote ────────────────────────────────────────
// Quatro faixas escuras em volta do recorte. Cada uma anima as próprias
// medidas, então a troca de passo desliza como um recorte único.
function MaskPanels({ rect }: { rect: Rect }) {
  const top = Math.max(0, rect.top)
  const left = Math.max(0, rect.left)
  const bottom = Math.max(0, rect.top + rect.height)
  const right = Math.max(0, rect.left + rect.width)
  const height = Math.max(0, bottom - top)

  const shade = 'tour-mask pointer-events-none fixed bg-[rgba(6,14,9,0.74)]'

  return (
    <>
      <div className={shade} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className={shade} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div className={shade} style={{ top, height, left: 0, width: left }} />
      <div className={shade} style={{ top, height, left: right, right: 0 }} />
    </>
  )
}

// ─── Ilustração de abertura ─────────────────────────────────────
// Bússola no centro, áreas da plataforma orbitando: o desenho literal da
// promessa do tour — "tem muita coisa, e você está no meio dela".
function WelcomeVisual() {
  const orbit: { icon: LucideIcon; color: string }[] = [
    { icon: FileText, color: '#468152' },
    { icon: Database, color: '#0ea5e9' },
    { icon: Brain, color: '#8b5cf6' },
    { icon: BookMarked, color: '#E2A43E' },
  ]

  return (
    <div className="relative mt-4 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)/0.18) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="tour-orbit relative h-24 w-24">
        {orbit.map((item, i) => {
          const OrbitIcon = item.icon
          const angle = (i / orbit.length) * Math.PI * 2
          return (
            <span
              key={i}
              className="absolute flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card shadow-sm"
              style={{
                top: `calc(50% + ${Math.sin(angle) * 42}px - 16px)`,
                left: `calc(50% + ${Math.cos(angle) * 42}px - 16px)`,
                color: item.color,
              }}
            >
              <span className="tour-orbit-counter">
                <OrbitIcon className="h-4 w-4" />
              </span>
            </span>
          )
        })}
      </div>
      <span className="absolute flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <Compass className="h-6 w-6" />
      </span>
    </div>
  )
}
