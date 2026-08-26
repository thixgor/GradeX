'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiteModeToggle } from '@/components/lite-mode-toggle'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { InstalarApp } from '@/components/pwa/instalar-app'

// Import estático: o Next lê as dimensões no build (zero layout shift) e gera o
// blurDataURL embutido — as fotos aparecem borradas na hora em vez de deixar um
// buraco na tela enquanto baixam. Só nos JPEG opacos: nos PNG com transparência
// o placeholder viraria um retângulo cinza por cima do recorte.
import heroBg from '@/public/landing/hero-bg.jpg'
import heroMidLight from '@/public/landing/hero-mid-light.png'
import heroMid from '@/public/landing/hero-mid.png'
import ausculta from '@/public/landing/ausculta.jpg'
import manualImg from '@/public/landing/manual.jpg'
import logoManual from '@/public/landing/logo-manual.png'
import provas3d from '@/public/landing/provas-3d.png'
import flashcards3d from '@/public/landing/flashcards-3d.png'
import susCover from '@/public/landing/sus-cover.jpg'

/* =================== ROTAS =================== */

// Rotas servidas por route handlers (HTML pronto, fora do router do React).
// Precisam de <a> nativo — <Link> tentaria uma navegação client-side.
const HTML_ROUTES = new Set(['/ldpg-mnclinico', '/prescricao-real-no-sus'])

const LINKS = {
  amostra: '/amostra',
  materiais: '/materiais',
  flashcards: '/flashcards',
  provas: '/provas',
  bancoQuestoes: '/banco-questoes',
  mapaMental: '/mapa-mental',
  cronogramas: '/cronogramas',
  manual: '/ldpg-mnclinico',
  sus: '/prescricao-real-no-sus',
  buy: '/buy',
  // Uma única porta de entrada para a ação principal. Todo botão âmbar da
  // página aponta para cá e diz a mesma coisa — "Começar grátis" —, para o
  // visitante aprender o que a cor significa em vez de reler cada botão.
  signup: '/auth/login?mode=register',
  equipe: '/equipe',
  termos: '/termos-de-servico',
  privacidade: '/politica-de-privacidade',
  suporte: 'mailto:contato@domineaqui.com.br',
}

/** Link interno do app → <Link> (com prefetch). O resto → <a> nativo. */
function SmartLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string
  className?: string
  children: ReactNode
  onClick?: () => void
  tabIndex?: number
  'aria-label'?: string
}) {
  const isAppRoute = href.startsWith('/') && !HTML_ROUTES.has(href)
  if (isAppRoute) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  )
}

/* =================== PARALLAX =================== */

/**
 * Escreve a posição do ponteiro/scroll em CSS vars (--da-mx/--da-my/--da-sy)
 * no elemento raiz da landing. As vars são herdadas, então UM único loop de
 * rAF alimenta hero, celular e livro 3D — sem re-render do React a 60fps
 * (o protótipo fazia setState por frame e redesenhava a página inteira).
 * O loop só roda enquanto a seção está visível.
 */
function useParallaxVars<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Nada de parallax em aparelho de toque.
    //
    // Sem ponteiro não existe o efeito que ele foi feito para dar — mas o
    // custo continuava inteiro: cada evento de rolagem acordava o rAF, que
    // escrevia três custom properties no elemento raiz da landing. Custom
    // property herdada invalida o estilo de TODA a subárvore, então a página
    // inteira era recalculada quadro a quadro enquanto o dedo arrastava. Era
    // a maior fonte de travamento da home no celular.
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(max-width: 1024px)').matches) return

    let raf = 0
    let listening = false
    let animating = false
    let visible = false
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let sy = 0
    let csy = 0

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
      wake()
    }
    const onScroll = () => {
      sy = window.scrollY
      wake()
    }
    const loop = () => {
      const dx = tx - cx
      const dy = ty - cy
      cx += dx * 0.07
      cy += dy * 0.07
      csy = sy
      el.style.setProperty('--da-mx', cx.toFixed(4))
      el.style.setProperty('--da-my', cy.toFixed(4))
      el.style.setProperty('--da-sy', csy.toFixed(1))
      // Assim que o easing converge, o loop dorme em vez de continuar pedindo
      // frames pra sempre — nada de queimar CPU/bateria com o mouse parado.
      if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
        animating = false
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      if (!visible || animating) return
      animating = true
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      visible = true
      if (!listening) {
        listening = true
        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('scroll', onScroll, { passive: true })
      }
      wake()
    }
    const stop = () => {
      visible = false
      if (listening) {
        listening = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('scroll', onScroll)
      }
      animating = false
      cancelAnimationFrame(raf)
    }

    // Só anima o que está na tela.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start()
          else stop()
        }
      },
      { threshold: 0 }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      stop()
    }
  }, [enabled])

  return ref
}

/* =================== ANIMAÇÕES INFINITAS =================== */

/**
 * Pausa uma esteira (marquee / trilho de avaliações) enquanto ela está fora
 * da tela.
 *
 * Elas são `animation: ... infinite`: o navegador continua compondo os quadros
 * mesmo quando a faixa está a três telas de distância. São três esteiras na
 * landing, cada uma com dezenas de cartões — no celular isso é trabalho de GPU
 * queimado do começo ao fim da visita. Com o observer, só anima a que está à
 * vista.
 */
function useOffscreenPause<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.add('da-anim-paused')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          el.classList.toggle('da-anim-paused', !entry.isIntersecting)
        }
      },
      { rootMargin: '200px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}

/* =================== REVEAL =================== */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        // Sem `filter: blur()` na transição: desfocar uma seção inteira é um
        // repaint caríssimo em GPU de celular, e ele acontecia em cada bloco
        // da página conforme a pessoa rolava. Deslocamento + opacidade rodam
        // no compositor e dão praticamente a mesma leitura.
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        opacity: shown ? 1 : 0.001,
        transition: `transform .7s cubic-bezier(.2,.7,.2,1) ${delay}ms, opacity .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/** Tilt no hover — escreve direto no DOM, sem state por movimento. */
function TiltCard({
  children,
  className = '',
  intensity = 6,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return
      // Só mouse: no toque, `pointermove` dispara durante a ROLAGEM e cada
      // disparo escrevia um transform 3D no cartão — a página inteira
      // engasgava quando o dedo passava por cima de um deles.
      if (e.pointerType !== 'mouse') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transition = 'transform .1s ease-out'
      el.style.transform = `perspective(900px) rotateY(${px * intensity}deg) rotateX(${-py * intensity}deg)`
    },
    [intensity]
  )

  const reset = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform .5s ease'
    el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)'
  }, [])

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={'da-preserve-3d ' + className}
    >
      {children}
    </div>
  )
}

/* =================== ÍCONES =================== */

// Nenhum destes ícones é clicável: são ornamento. Por isso eles usam o âmbar
// dessaturado, e não o mesmo âmbar do botão. Quanto mais coisas recebem
// exatamente o tratamento visual do CTA — ícone, marcador, selo, barra —,
// menos o cérebro do visitante aprende que âmbar cheio significa AÇÃO.
const st = {
  fill: 'none',
  stroke: 'rgb(var(--da-amber-soft))',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const IconPulse = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" {...st}>
    <path d="M2 12h4l2-6 4 12 2-6h8" />
  </svg>
)
const IconManual = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" {...st}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
    <path d="M8 3v18M12 8h4M12 12h4" />
  </svg>
)
const IconCards = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" {...st}>
    <rect x="4" y="5" width="12" height="15" rx="2" />
    <path d="M9 5V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1" />
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" {...st}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 12l3 3 5-6" />
  </svg>
)
const IconBank = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" {...st}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
)
const IconLayers = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" {...st}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
)
const IconMap = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" {...st}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="7" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M8 7l8 0M7.5 8l3.5 8M16.5 9l-3.5 7" />
  </svg>
)

/* =================== CTAs =================== */

function PrimaryCTA({
  children,
  className = '',
  href,
  tabIndex,
}: {
  children: ReactNode
  className?: string
  href: string
  tabIndex?: number
}) {
  return (
    <SmartLink
      href={href}
      tabIndex={tabIndex}
      className={
        'group relative inline-flex items-center justify-center gap-2 rounded-full bg-da-amber px-7 py-3.5 font-da-display font-semibold text-[#0B1F1A] transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_34px_-6px_rgba(232,118,58,.7)] active:scale-[0.98] ' +
        className
      }
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </SmartLink>
  )
}

function GhostCTA({
  children,
  href,
  className = '',
}: {
  children: ReactNode
  href: string
  className?: string
}) {
  return (
    <SmartLink
      href={href}
      className={
        'group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-da-amber/60 px-7 py-3.5 font-da-display font-semibold text-da-amber-ink transition active:scale-[0.98] ' +
        className
      }
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-da-amber transition-transform duration-300 ease-out group-hover:scale-y-100" />
      <span className="relative z-10 transition-colors duration-200 group-hover:text-[#0B1F1A]">
        {children}
      </span>
    </SmartLink>
  )
}

/** Marcador editorial de seção: 01 / 05 com a régua. */
function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-da-mono text-xs text-da-amber-soft">{n}</span>
      <span className="h-px flex-1 bg-[color:var(--da-neutral-line)]" />
      <span className="font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-muted">
        {label}
      </span>
    </div>
  )
}

/* =================== JANELA DO PRODUTO =================== */

/**
 * Ícones de traço fino que herdam a cor do contexto (`currentColor`), ao
 * contrário dos ícones editoriais acima, que fixam o âmbar. Os da janela
 * precisam apagar quando o item está inativo e acender quando está ativo —
 * é o que faz o desenho parecer software de verdade, e não uma ilustração.
 */
const stUi = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const UiBank = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stUi} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
)
const UiBook = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stUi} aria-hidden>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
    <path d="M8 3v18" />
  </svg>
)
const UiPaper = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stUi} aria-hidden>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 13h6M9 17h4" />
  </svg>
)
const UiCards = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stUi} aria-hidden>
    <rect x="4" y="6" width="11" height="14" rx="2" />
    <path d="M9 6V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-1" />
  </svg>
)
const UiCalendar = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" {...stUi} aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

const WINDOW_NAV: { label: string; short: string; icon: ReactNode }[] = [
  { label: 'Banco de Questões', short: 'Questões', icon: <UiBank /> },
  { label: 'Manual Clínico', short: 'Manual', icon: <UiBook /> },
  { label: 'Provas da faculdade', short: 'Provas', icon: <UiPaper /> },
  { label: 'Flashcards', short: 'Cards', icon: <UiCards /> },
  { label: 'Cronograma', short: 'Cronograma', icon: <UiCalendar /> },
]

/**
 * A moldura do produto: barra de navegador, barra lateral com as ferramentas e
 * uma área de conteúdo.
 *
 * Ela existe porque a primeira dobra precisava responder "que site é este?" em
 * menos de um segundo — e nenhuma composição anatômica, por mais bonita que
 * seja, responde isso. Uma janela com barra de endereço e menu lateral
 * responde: é uma plataforma web de estudo, e é esta a tela que você vai abrir.
 *
 * Desenhada em CSS de propósito. Um print viraria uma imagem grande, borrada
 * em tela retina, presa a um tema e desatualizada na próxima release.
 */
function AppWindow({
  path,
  active = 0,
  children,
  className = '',
}: {
  path: string
  active?: number
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={
        'da-window overflow-hidden rounded-xl border border-[color:var(--da-neutral-line)] md:rounded-2xl ' +
        className
      }
    >
      {/* Barra do navegador. O endereço é o que ancora a pergunta "em que site
          eu estou?" — por isso ele aparece por extenso já no celular. */}
      <div className="flex items-center gap-3 border-b border-[color:var(--da-neutral-line)] bg-da-panel/70 px-3 py-2.5 md:px-4">
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--da-neutral-line)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--da-neutral-line)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--da-neutral-line)]" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[color:var(--da-neutral-line)] bg-da-ground px-3 py-1.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-da-muted" {...stUi} aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="truncate font-da-mono text-[11px] text-da-muted md:text-xs">{path}</span>
        </span>
      </div>

      <div className="flex min-h-0">
        {/* Barra lateral. No celular ela vira um trilho de ícones: sem os
            rótulos ela ocupa 52px em vez de 180px, e o conteúdo — que é o que
            vende — fica com a largura da tela quase inteira. */}
        <nav
          aria-hidden
          className="flex w-[52px] shrink-0 flex-col gap-0.5 border-r border-[color:var(--da-neutral-line)] bg-da-panel/40 p-2 sm:w-[172px] sm:p-3"
        >
          <span className="mb-2 hidden items-center gap-2 px-2 sm:flex">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-da-amber font-da-display text-[11px] font-bold text-[#0B1F1A]">
              D
            </span>
            <span className="font-da-display text-xs font-semibold tracking-tight">Domine Aqui</span>
          </span>
          {WINDOW_NAV.map((item, i) => (
            <span
              key={item.label}
              className={
                'flex items-center justify-center gap-2.5 rounded-lg px-2 py-2 sm:justify-start ' +
                (i === active
                  ? 'bg-da-amber/10 text-da-amber-ink'
                  : 'text-da-muted')
              }
            >
              {item.icon}
              <span className="hidden truncate text-[12px] sm:inline">{item.short}</span>
            </span>
          ))}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

/* ---------- QUESTÃO INTERATIVA (o produto antes do cadastro) ---------- */

// Uma questão de verdade, com o comentário no tom que a plataforma usa. Não é
// enfeite: é a menor amostra possível do produto, e ela está na primeira dobra
// porque o jeito mais rápido de explicar o Domine Aqui é deixar a pessoa usar
// o Domine Aqui. Um toque, e ela já viu enunciado, gabarito e comentário.
const DEMO = {
  materia: 'Cardiologia',
  posicao: 'Questão 7 de 10',
  enunciado:
    'Homem de 68 anos, dor torácica em aperto há 40 minutos, irradiada para o membro superior esquerdo, com sudorese. O ECG mostra supradesnivelamento de ST em V1–V4. Qual a conduta imediata?',
  alternativas: [
    { id: 'A', texto: 'Solicitar troponina seriada e reavaliar em 6 horas.' },
    { id: 'B', texto: 'Acionar a terapia de reperfusão imediatamente.' },
    { id: 'C', texto: 'Iniciar anticoagulação plena e manter em observação.' },
    { id: 'D', texto: 'Programar teste ergométrico para estratificar o risco.' },
  ],
  correta: 'B',
  comentario:
    'Supra de ST em derivações contíguas com quadro clínico compatível já fecha o diagnóstico de IAM com supra — ele é clínico e eletrocardiográfico, não laboratorial. Esperar a troponina apenas atrasa a reperfusão: a meta é angioplastia primária em até 90 minutos, ou fibrinólise em até 30 se a hemodinâmica não estiver disponível.',
}

function QuestionDemo() {
  const [escolha, setEscolha] = useState<string | null>(null)
  const respondida = escolha !== null
  const acertou = escolha === DEMO.correta

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-[color:var(--da-amber-soft-line)] px-2.5 py-1 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
          {DEMO.materia}
        </span>
        <span className="font-da-mono text-[11px] text-da-muted">{DEMO.posicao}</span>
      </div>

      <p className="mt-3.5 text-[13.5px] leading-relaxed text-da-paper md:text-sm">
        {DEMO.enunciado}
      </p>

      {/* Alternativas de verdade: 44px de altura mínima, o alvo que a WCAG 2.2
          trata como critério aprimorado. Ninguém deveria mirar para tocar. */}
      <ul className="mt-4 space-y-2">
        {DEMO.alternativas.map((alt) => {
          const escolhida = escolha === alt.id
          const eCorreta = alt.id === DEMO.correta
          // Depois de responder, a correta acende SEMPRE — inclusive quando a
          // pessoa erra. Esconder o gabarito de quem errou seria a única coisa
          // capaz de fazer alguém sair desta tela sem ter aprendido nada.
          const destaque = respondida && (eCorreta || escolhida)
          const cor = respondida
            ? eCorreta
              ? 'border-emerald-500/60 bg-emerald-500/10 text-da-paper'
              : escolhida
                ? 'border-red-500/50 bg-red-500/10 text-da-paper'
                : 'border-[color:var(--da-neutral-line)] text-da-muted opacity-60'
            : 'border-[color:var(--da-neutral-line)] text-da-paper hover:border-da-amber/60 hover:bg-da-amber/5'
          return (
            <li key={alt.id}>
              <button
                type="button"
                onClick={() => setEscolha(alt.id)}
                aria-pressed={escolhida}
                className={
                  'flex w-full min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ' +
                  cor
                }
              >
                <span
                  className={
                    'grid h-6 w-6 shrink-0 place-items-center rounded-md border font-da-mono text-[11px] font-semibold ' +
                    (destaque
                      ? eCorreta
                        ? 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400'
                        : 'border-red-500/60 text-red-600 dark:text-red-400'
                      : 'border-[color:var(--da-neutral-line)] text-da-muted')
                  }
                >
                  {alt.id}
                </span>
                <span className="text-[13px] leading-snug md:text-[13.5px]">{alt.texto}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {!respondida ? (
        <p className="mt-3.5 font-da-mono text-[11px] text-da-muted">
          Toque numa alternativa — o comentário aparece na hora.
        </p>
      ) : (
        <div className="da-answer-in mt-4 rounded-xl border border-[color:var(--da-amber-line)] bg-da-tint/50 p-3.5 md:p-4">
          <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber-ink">
            {acertou ? 'Você acertou · resposta comentada' : `Resposta correta: ${DEMO.correta} · comentada`}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-da-muted md:text-[13.5px]">
            {DEMO.comentario}
          </p>
          <SmartLink
            href={LINKS.amostra}
            className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 font-da-display text-sm font-semibold text-da-amber-ink underline underline-offset-4"
          >
            Resolver as outras 9 sem cadastro
            <svg viewBox="0 0 24 24" className="h-4 w-4" {...stUi} aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </SmartLink>
        </div>
      )}
    </div>
  )
}

/* =================== PROVA SOCIAL (DADOS) =================== */

/** Avaliação de um material/deck, vinda de /api/reviews/showcase. */
interface ShowcaseReview {
  _id: string
  rating: number
  comment: string
  displayName: string
  isVerified: boolean
  isFeatured: boolean
  createdAt: string
  sourceTitle: string | null
}

interface ReviewsSummary {
  count: number
  avg: number
}

interface ShowcaseData {
  reviews: ShowcaseReview[]
  summary: ReviewsSummary
}

/**
 * Busca UMA vez as avaliações de todos os materiais da plataforma. O resultado
 * alimenta dois lugares (o selo de nota no hero e a esteira abaixo dos
 * depoimentos), então o fetch mora no componente-pai em vez de duplicar.
 * Sem `no-store` de propósito: a rota já manda Cache-Control, e a landing se
 * beneficia do cache de borda/navegador.
 */
function usePlatformReviews(): ShowcaseData | null {
  const [data, setData] = useState<ShowcaseData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reviews/showcase?limit=40')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return
        setData({
          reviews: Array.isArray(json.reviews) ? json.reviews : [],
          summary: {
            count: Number(json?.summary?.count) || 0,
            avg: Number(json?.summary?.avg) || 0,
          },
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return data
}

/** Cinco estrelas preenchidas até `value` (arredondado para meia estrela). */
function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1))
        return (
          <svg key={i} viewBox="0 0 24 24" className={className}>
            <defs>
              <linearGradient id={`da-star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="rgb(var(--da-amber-ink))" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.11-6.47L2.6 9.45l6.5-.95L12 2.6Z"
              fill={`url(#da-star-${i}-${Math.round(fill * 100)})`}
              stroke="rgb(var(--da-amber-ink))"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </span>
  )
}

/* =================== CARROSSEL LATERAL =================== */

/**
 * Rolagem horizontal com encaixe: setas, teclado e swipe nativo. Muito
 * depoimento em pilha vertical vira uma landing infinita — de lado, cabe
 * quantos o admin quiser sem alongar a página.
 *
 * A barra de progresso é escrita direto no DOM (ref), não em state: durante o
 * scroll o evento dispara dezenas de vezes por segundo e um setState por
 * disparo re-renderizaria todos os cards do trilho.
 */
function useHorizontalRail<T extends HTMLElement>() {
  const trackRef = useRef<T>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    let ticking = false
    const measure = () => {
      ticking = false
      const max = el.scrollWidth - el.clientWidth
      const x = el.scrollLeft
      const ratio = max > 8 ? Math.min(1, Math.max(0, x / max)) : 1
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${0.18 + ratio * 0.82})`
      }
      const next = { start: x <= 8, end: max <= 8 || x >= max - 8 }
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next))
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(measure)
    }

    measure()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const nudge = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>('[data-slide]')
    const step = slide ? slide.offsetWidth + 20 : el.clientWidth * 0.85
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  return { trackRef, barRef, edges, nudge }
}

function RailControls({
  edges,
  nudge,
  barRef,
  label,
}: {
  edges: { start: boolean; end: boolean }
  nudge: (dir: 1 | -1) => void
  barRef: React.RefObject<HTMLSpanElement>
  label: string
}) {
  const btn =
    'grid h-11 w-11 place-items-center rounded-full border border-[color:var(--da-neutral-line)] text-da-paper transition hover:border-da-amber/60 hover:text-da-amber-ink disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="mt-8 flex items-center gap-5">
      <div className="h-px flex-1 overflow-hidden bg-[color:var(--da-neutral-line)]">
        <span
          ref={barRef}
          className="block h-px origin-left bg-da-amber transition-transform duration-200 ease-out"
          style={{ transform: 'scaleX(0.18)' }}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => nudge(-1)}
          disabled={edges.start}
          aria-label={`${label}: anterior`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => nudge(1)}
          disabled={edges.end}
          aria-label={`${label}: próximo`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* =================== PÁGINA =================== */

export default function LandingPage() {
  const router = useRouter()
  const { liteMode } = useLiteMode()
  // No Modo Lite (ligado à mão ou detectado num aparelho fraco) o parallax nem
  // é montado — o CSS do Lite mata o efeito visual, mas não o loop de rAF.
  const rootRef = useParallaxVars<HTMLDivElement>(!liteMode)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const showcase = usePlatformReviews()

  useEffect(() => {
    // Verificação de auth no cliente — SEMPRE. Por dois motivos que se somam:
    // o HTML de `/` é estático (igual para todo mundo, servido do CDN), e o
    // cookie de sessão é SameSite=strict (lib/auth.ts) — numa navegação de
    // nível superior vinda de outro site (e-mail, WhatsApp, Instagram, Google,
    // bookmark...) ele nem acompanha o request. Um fetch same-site para
    // /api/auth/me manda o cookie e revela o estado real.
    let cancelled = false

    const revelarSessao = () => {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then((r) => {
          if (cancelled) return
          if (r.ok) {
            // Sessão válida. Espelha o middleware: logado sem ?landing=true vai
            // direto pro dashboard.
            const forceLanding =
              new URLSearchParams(window.location.search).get('landing') === 'true'
            if (!forceLanding) {
              router.replace('/dashboard')
              return
            }
            setIsLoggedIn(true)
          } else {
            // 401 = realmente deslogado. (Erro de rede cai no .catch e mantém o
            // estado atual, para não deslogar por intermitência.)
            setIsLoggedIn(false)
          }
        })
        .catch(() => {})
    }

    revelarSessao()

    // Voltar pelo botão do navegador restaura a página do back-forward cache
    // com o estado congelado: nenhum efeito de mount roda de novo, então quem
    // entrou na conta nesse meio-tempo veria a landing dizendo "Entrar". Antes
    // isso era resolvido com `window.location.reload()` — um recarregamento
    // inteiro, com tela em branco, só para reavaliar um booleano. Refazer a
    // mesma consulta leve dá o mesmo resultado sem descartar a página.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) revelarSessao()
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', handlePageShow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signupHref = isLoggedIn ? '/dashboard' : LINKS.signup

  return (
    <div
      ref={rootRef}
      className="da-landing relative overflow-x-clip bg-da-ground font-da-body text-da-paper"
    >
      <Nav signupHref={signupHref} isLoggedIn={isLoggedIn} />
      {/* A ordem da página é a ordem da decisão, e ela é quase impossível de
          interpretar errado:
            problema (você estuda espalhado)
            → solução e PRODUTO na mesma tela (o hero, com a questão de verdade)
            → por que isso acontece (a banda do problema)
            → prova (alunos, depois notas reais)
            → como funciona (o ciclo em cinco passos)
            → experimente (10 questões sem cadastro)
            → o que está incluído (núcleo + ecossistema)
            → por que aqui (arquivo solto × plataforma)
            → quanto custa
            → objeções
            → CTA.
          Antes, preço vinha antes de qualquer explicação de produto: ótimo para
          quem já conhecia a marca, caro para quem chegou de um anúncio e ainda
          estava tentando descobrir que site era este. */}
      <Hero signupHref={signupHref} isLoggedIn={isLoggedIn} summary={showcase?.summary} />
      <ProblemBand />
      <Marquee />
      <Testimonials />
      <PlatformReviews data={showcase} />
      <HowItWorks />
      <SampleBand />
      <ProductsExplorer />
      <Differentiators />
      <Plans />
      <InstallApp />
      <FaqAndCTA signupHref={signupHref} isLoggedIn={isLoggedIn} />
      <Footer />
      <MobileDock signupHref={signupHref} isLoggedIn={isLoggedIn} />
    </div>
  )
}

/* ---------- NAV ---------- */

function Nav({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Guarda em ref: sem ela, cada evento de rolagem (dezenas por segundo no
    // celular) entrava no agendador do React só para descobrir que o valor não
    // mudou. Agora o setState só acontece nas duas transições reais.
    let current = window.scrollY > 40
    setSolid(current)
    const onScroll = () => {
      const next = window.scrollY > 40
      if (next === current) return
      current = next
      setSolid(next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Marca no <html> para a doca de ação se recolher enquanto o menu está
    // aberto: duas barras laranja na mesma tela, dizendo a mesma coisa, só
    // fazem o visitante parar para decidir em qual delas tocar.
    document.documentElement.setAttribute('data-da-menu', 'aberto')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      document.documentElement.removeAttribute('data-da-menu')
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // O header não deveria explicar a arquitetura do site. Ele responde quatro
  // perguntas e só: onde estou (logo), dá pra entender o produto (Produto),
  // quanto custa (Planos), já tenho conta (Entrar) — mais a ação principal.
  // Depoimentos, app e o resto continuam a um scroll de distância; o que eles
  // não podem é disputar atenção com o único botão que importa aqui em cima.
  const navLinks = [
    { label: 'Produto', href: '#como-funciona' },
    { label: 'Materiais', href: LINKS.materiais },
    { label: 'Planos', href: '#planos' },
  ]

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Véu por cima da página enquanto o menu está aberto. Fica FORA do
          <header> de propósito: o cabeçalho usa `backdrop-blur`, e um elemento
          com backdrop-filter vira bloco contentor dos filhos `position: fixed`
          — dentro dele, `inset-0` cobria a altura do cabeçalho em vez da tela
          inteira. E ele existe porque tocar fora do painel é como quase todo
          mundo fecha um menu no celular. */}
      {menuOpen && (
        <button
          type="button"
          // Escondido do leitor de tela de propósito: quem navega por leitor já
          // tem o botão "Fechar menu" do cabeçalho e a tecla Esc. Este aqui
          // existe só para o dedo que toca fora do painel.
          aria-hidden
          tabIndex={-1}
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <header
        className={
          'pwa-safe-top fixed inset-x-0 top-0 z-50 transition-colors duration-300 ' +
          (solid || menuOpen
            ? 'border-b border-[color:var(--da-neutral-line)] bg-da-ground/90 backdrop-blur-md'
            : '')
        }
      >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
        <a
          href="#top"
          className="flex min-h-[44px] shrink-0 items-center gap-2.5"
          aria-label="Domine Aqui"
        >
          <Logo variant="icon" size="md" className="h-9" />
          <span className="font-da-display text-lg font-semibold tracking-tight">Domine Aqui</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <SmartLink
              key={l.label}
              href={l.href}
              className="inline-flex min-h-[44px] items-center text-sm text-da-muted transition hover:text-da-paper"
            >
              {l.label}
            </SmartLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Os interruptores de tema e de Modo Lite saíram da barra no
              celular. Eles são preferência, não navegação: ficavam ali
              apertando o espaço dos únicos dois alvos que importam num
              aparelho de 390px — Entrar e o menu — e ainda deixavam a barra
              com cara de painel de controle. Continuam inteiros, dentro do
              menu. */}
          <LiteModeToggle className="hidden h-11 w-11 rounded-full border-[color:var(--da-neutral-line)] bg-transparent text-da-paper shadow-none transition hover:border-da-amber/50 hover:bg-da-panel/40 active:scale-95 lg:inline-flex" />
          <ThemeToggle
            variant="icon"
            className="hidden h-11 w-11 rounded-full border-[color:var(--da-neutral-line)] bg-transparent text-da-paper shadow-none transition hover:border-da-amber/50 hover:bg-da-panel/40 active:scale-95 lg:inline-flex"
          />
          {!isLoggedIn && (
            <SmartLink
              href="/auth/login"
              className="inline-flex min-h-[44px] items-center px-1 text-sm font-medium text-da-muted transition hover:text-da-paper"
            >
              Entrar
            </SmartLink>
          )}
          <PrimaryCTA href={signupHref} className="!hidden !px-5 !py-3 text-sm lg:!inline-flex">
            {isLoggedIn ? 'Ir para o dashboard' : 'Começar grátis'}
          </PrimaryCTA>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color:var(--da-neutral-line)] text-da-paper transition hover:border-da-amber/50 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden
            >
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-[color:var(--da-neutral-line)] bg-da-ground/95 backdrop-blur-md lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-4 md:px-8">
            {/* A ação principal em primeiro, e não enterrada no fim da lista:
                quem abriu o menu no celular quase sempre quer entrar ou criar
                a conta, não navegar. */}
            <PrimaryCTA href={signupHref} className="w-full !py-4 text-base" >
              {isLoggedIn ? 'Ir para o dashboard' : 'Começar grátis'}
            </PrimaryCTA>
            <div className="mt-4 flex flex-col">
              {navLinks.map((l) => (
                <SmartLink
                  key={l.label}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex min-h-[52px] items-center border-b border-[color:var(--da-neutral-line)] text-[15px] text-da-paper transition active:text-da-amber-ink"
                >
                  {l.label}
                </SmartLink>
              ))}
              <SmartLink
                href="#depoimentos"
                onClick={closeMenu}
                className="flex min-h-[52px] items-center border-b border-[color:var(--da-neutral-line)] text-[15px] text-da-paper transition active:text-da-amber-ink"
              >
                Depoimentos
              </SmartLink>
              <SmartLink
                href={LINKS.amostra}
                onClick={closeMenu}
                className="flex min-h-[52px] items-center border-b border-[color:var(--da-neutral-line)] text-[15px] text-da-paper transition active:text-da-amber-ink"
              >
                Testar 10 questões
              </SmartLink>
            </div>
            <div className="flex items-center justify-between gap-3 pb-2 pt-5">
              <span className="font-da-mono text-[11px] uppercase tracking-widest text-da-muted">
                Aparência
              </span>
              <span className="flex items-center gap-2">
                <LiteModeToggle className="h-11 w-11 rounded-full border-[color:var(--da-neutral-line)] bg-transparent text-da-paper shadow-none active:scale-95" />
                <ThemeToggle
                  variant="icon"
                  className="h-11 w-11 rounded-full border-[color:var(--da-neutral-line)] bg-transparent text-da-paper shadow-none active:scale-95"
                />
              </span>
            </div>
          </nav>
        </div>
      )}
      </header>
    </>
  )
}

/* ---------- HERO ---------- */

// Parallax via CSS vars herdadas do root (--da-mx/--da-my/--da-sy).
const heroBgStyle: CSSProperties = {
  transform:
    'translate3d(calc(var(--da-mx, 0) * 6px), calc(var(--da-my, 0) * 6px - var(--da-sy, 0) * 0.04px), 0) scale(1.06)',
}
const heroMidStyle: CSSProperties = {
  transform:
    'perspective(1200px) translate3d(calc(var(--da-mx, 0) * 22px), calc(var(--da-my, 0) * 16px - var(--da-sy, 0) * 0.06px), 0) rotateY(calc(var(--da-mx, 0) * 3deg)) rotateX(calc(var(--da-my, 0) * -2deg))',
}

function Hero({
  signupHref,
  isLoggedIn,
  summary,
}: {
  signupHref: string
  isLoggedIn: boolean
  summary?: ReviewsSummary
}) {
  const hasRating = !!summary && summary.count >= 3 && summary.avg > 0
  return (
    <section id="top" className="pwa-safe-hero relative overflow-hidden pt-[72px]">
      <div className="pointer-events-none absolute inset-0" style={heroBgStyle}>
        <Image
          src={heroBg}
          alt=""
          aria-hidden
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover opacity-20"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgb(var(--da-ground)) 0%, rgb(var(--da-ground) / 0.86) 45%, rgb(var(--da-ground) / 0.55) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: 'linear-gradient(0deg, rgb(var(--da-ground)), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(1000px 600px at 82% 30%, rgba(232,118,58,.12), transparent 60%)',
        }}
      />

      {/* Duas colunas só a partir de xl. Entre 1024 e 1279 o layout de duas
          colunas espremia o texto em ~456px: a manchete quebrava em quatro
          linhas, com "mal." órfã numa delas. Empilhado, o título respira e a
          janela do produto aparece logo abaixo — o que continua respondendo
          "que site é este?" sem uma rolagem inteira. */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-12 pt-8 md:px-8 md:pb-16 xl:grid-cols-[1.05fr_1fr] xl:items-start xl:gap-14 xl:pt-14">
        <div className="relative z-10 max-w-2xl">
          <Reveal>
            <p className="font-da-mono text-[11px] uppercase tracking-[0.28em] text-da-amber-soft md:text-xs">
              Para estudantes de Medicina
            </p>
          </Reveal>
          <Reveal delay={70}>
            {/* A headline fica. Ela tem identidade, nomeia um problema real e é
                lembrada — trocá-la por "a plataforma completa para estudantes
                de Medicina" seria correto e completamente esquecível. O que
                faltava não era emoção: era a razão logo abaixo dela. */}
            {/* Os tamanhos são os maiores em que cada frase cabe numa linha
                só na respectiva largura de coluna. Uma manchete de quatro
                linhas com uma palavra sozinha no fim perde exatamente o ritmo
                que faz esta frase funcionar. */}
            <h1 className="mt-4 font-da-display text-[clamp(1.6rem,8vw,2rem)] font-semibold leading-[1.02] tracking-tighter sm:text-[2.8rem] md:text-[3.4rem] md:leading-[0.98]">
              Você não estuda mal.
              <br />
              Você estuda espalhado.
            </h1>
          </Reveal>
          <Reveal delay={140}>
            {/* A frase mais importante da página inteira. Ela responde, sem
                exigir interpretação, as três perguntas de quem chegou de um
                anúncio e nunca ouviu a marca: o que é isto, para quem é e o que
                eu ganho. Antes essa resposta estava diluída em dois parágrafos
                — e quem não lia os dois saía sem saber que site era este. */}
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-da-muted md:text-lg">
              O Domine Aqui reúne{' '}
              <span className="text-da-paper">
                Manual Clínico, banco de questões, provas da sua faculdade, flashcards e
                cronograma
              </span>{' '}
              em uma plataforma só. Você abre e já sabe o que estudar agora.
            </p>
          </Reveal>
          <Reveal delay={190}>
            {/* Uma ação principal, uma saída de menor compromisso. O botão
                âmbar diz sempre a mesma coisa no site inteiro — "Começar
                grátis" —, então o visitante aprende o significado da cor em vez
                de reler cada botão. E quem ainda está avaliando tem para onde
                ir sem precisar se cadastrar para descobrir o que é isto. */}
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PrimaryCTA
                href={signupHref}
                className="!px-8 !py-4 text-[17px] w-full justify-center sm:w-auto"
              >
                {isLoggedIn ? 'Ir para o dashboard' : 'Começar grátis'}
              </PrimaryCTA>
              {!isLoggedIn && (
                <GhostCTA
                  href={LINKS.amostra}
                  className="!px-8 !py-4 text-[17px] w-full justify-center sm:w-auto"
                >
                  Testar 10 questões
                </GhostCTA>
              )}
            </div>
            <p className="mt-4 font-da-mono text-[11px] text-da-muted md:text-xs">
              Sem cartão · acesso imediato · celular e computador
            </p>
            {/* Nota real, calculada sobre as avaliações dos materiais. Só entra
                depois do fetch e com amostra mínima — número inventado no hero
                é o jeito mais rápido de perder a confiança do visitante. */}
            {hasRating && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-[color:var(--da-amber-line)] bg-[color:var(--da-glass)] px-4 py-2 backdrop-blur-sm">
                <Stars value={summary!.avg} />
                <span className="font-da-display text-sm font-semibold">
                  {summary!.avg.toFixed(1).replace('.', ',')}
                </span>
                <span className="font-da-mono text-[11px] text-da-muted">
                  {summary!.count} avaliações de quem já estuda aqui
                </span>
              </div>
            )}
          </Reveal>
        </div>

        {/* O produto na primeira dobra. Não é um print nem uma ilustração: é
            uma questão de verdade, que responde ao toque e abre o comentário.
            Em um gesto o visitante entende que isto é uma plataforma web de
            estudo, vê a interface que vai usar e já experimentou o produto
            antes de existir qualquer formulário no caminho. */}
        <div className="relative mx-auto w-full max-w-2xl xl:max-w-none xl:pl-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[2.5rem]"
            style={{
              background: 'radial-gradient(60% 60% at 55% 45%, rgba(232,118,58,.16), transparent 70%)',
            }}
          />
          <Reveal delay={120}>
            <AppWindow path="domineaqui.com.br/banco-questoes" active={0} className="relative">
              <QuestionDemo />
            </AppWindow>
          </Reveal>
          <p className="relative mt-3 text-center font-da-mono text-[11px] text-da-muted xl:text-left">
            Esta é a tela. Responda aqui mesmo, sem sair da página.
          </p>
        </div>
      </div>

      {/* trilho de números */}
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--da-neutral-line)] bg-[color:var(--da-neutral-line)] sm:grid-cols-4">
          {[
            ['300+', 'patologias no Manual Clínico'],
            ['9', 'ferramentas na mesma conta'],
            ['Provas', 'reais da sua faculdade'],
            ['Grátis', 'para começar hoje'],
          ].map(([n, l]) => (
            <div key={l} className="bg-da-ground p-4 md:p-5">
              <dt className="font-da-display text-2xl font-semibold">{n}</dt>
              <dd className="mt-1 font-da-mono text-[11px] leading-tight text-da-muted">{l}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Pista de rolagem: muito visitante de anúncio não percebe que a página
          continua abaixo da dobra. Uma seta que pulsa (e leva pra próxima seção
          num toque) resolve sem exigir que ele "descubra" o scroll. */}
      <div className="relative mx-auto mb-4 mt-6 flex max-w-7xl justify-center px-5 md:mb-2 md:px-8">
        <a
          href="#problema"
          aria-label="Continuar lendo"
          className="group inline-flex min-h-[44px] flex-col items-center justify-center gap-1 text-da-muted transition hover:text-da-amber-ink"
        >
          <span className="font-da-mono text-[10px] uppercase tracking-[0.3em]">Continuar</span>
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </div>
    </section>
  )
}

/* ---------- MARQUEE ---------- */

function Marquee() {
  const items = [
    'Manual Clínico',
    'Flashcards de anatomia',
    'Provas por IA',
    'Banco de Questões',
    'Cronograma',
    'Prescrição no SUS',
    'Ausculta com áudio real',
    'Repetição espaçada',
  ]
  const row = [...items, ...items]
  const wrapRef = useOffscreenPause<HTMLDivElement>()
  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden border-y border-[color:var(--da-neutral-line)] bg-da-panel/40 py-4"
    >
      <div className="da-marquee-track flex w-max gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-da-mono text-xs uppercase tracking-[0.2em] text-da-muted"
          >
            {t}
            <span className="text-da-amber-soft">/</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- PRODUTOS (LISTA EXPANSÍVEL) ---------- */

interface Product {
  key: string
  icon: ReactNode
  name: string
  teaser: string
  badge?: string
  headline: string
  body: string[]
  bullets?: string[]
  cta: { label: string; href: string }
  note?: string
  /** Só é montada quando a linha abre — imagem fechada nem chega a baixar. */
  media: () => ReactNode
}

function ProductImage({ src, alt }: { src: typeof provas3d; alt: string }) {
  return (
    <div className="relative flex items-center justify-center py-4">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(60% 55% at 50% 50%, rgba(232,118,58,.18), transparent 70%)',
        }}
      />
      <Image
        src={src}
        alt={alt}
        sizes="(max-width: 1024px) 60vw, 300px"
        className="relative z-10 max-h-[280px] w-auto object-contain md:drop-shadow-[0_24px_50px_rgba(0,0,0,.5)]"
      />
    </div>
  )
}

const PRODUCTS: Product[] = [
  {
    key: 'manual',
    icon: <IconManual />,
    name: 'Manual Clínico',
    teaser: '300+ patologias com som, foto clínica e referência — o carro-chefe.',
    badge: 'Carro-chefe',
    headline: 'Cinco livros abertos. Uma busca só.',
    body: [
      'Mais de 300 patologias destrinchadas na profundidade que a prova e o plantão exigem. Você digita a doença e vê tudo, do mecanismo à conduta. O aluno que precisava de cinco livros na mesa agora precisa de uma busca.',
    ],
    bullets: [
      'Classificação, etiologia, fisiopatologia e farmacologia, aprofundadas sem lacuna',
      'Os sopros cardíacos e a ausculta pulmonar tocam de verdade, dentro do card',
      'As lesões você vê em foto clínica, da erisipela à dermatologia, com referência',
      'Atualizado de momento em momento, sem tópico raso com cara de IA',
    ],
    cta: { label: 'Abrir o Manual Clínico', href: LINKS.manual },
    note: 'Teste grátis disponível',
    media: () => (
      <TiltCard intensity={5}>
        <Image src={logoManual} alt="Manual Clínico" sizes="140px" className="mb-5 h-12 w-auto" />
        <figure className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2rem]"
            style={{
              background: 'radial-gradient(60% 60% at 50% 50%, rgba(232,118,58,.18), transparent 70%)',
            }}
          />
          <Image
            src={manualImg}
            alt="Camadas de vidro do dossiê clínico com lesão, pulmão e miniaturas de patologia"
            placeholder="blur"
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="relative w-full rounded-2xl border border-[color:var(--da-amber-line)]"
          />
        </figure>
      </TiltCard>
    ),
  },
  {
    key: 'eletro',
    icon: <IconPulse />,
    name: 'Manual do Eletrocardiograma',
    teaser: 'Do ritmo normal à emergência. Exclusivo de quem assina o Manual.',
    badge: 'Só no Manual Clínico',
    headline: 'O que esse traçado está te dizendo?',
    body: [
      'Tem uma pergunta que todo preceptor faz e que a maioria trava na resposta. Não é sobre decorar o nome da arritmia. É sobre entender a história que o coração está contando ali no papel. Isso não se decora, se treina.',
      'O Manual do Eletrocardiograma treina exatamente esse raciocínio. Ele é exclusivo de quem assina o Manual Clínico, então não entra no teste grátis. É o que separa quem lê ECG de quem adivinha.',
    ],
    cta: { label: 'Assinar o Manual Clínico', href: LINKS.manual },
    media: () => <PhoneMockup />,
  },
  {
    key: 'provas-fac',
    icon: <IconCheck />,
    name: 'Provas da Faculdade',
    teaser: 'As provas que o seu curso já aplicou, prontas para resolver.',
    headline: 'Treine na prova de verdade, não em simulado genérico.',
    body: [
      'As provas que a sua faculdade já aplicou, prontas para você resolver do jeito que cai. Faça quantas quiser. Baixe em PDF sendo assinante.',
    ],
    cta: { label: 'Resolver provas', href: LINKS.provas },
    note: 'Provas oficiais',
    media: () => <ProductImage src={provas3d} alt="Provas da faculdade na plataforma" />,
  },
  {
    key: 'banco',
    icon: <IconBank />,
    name: 'Banco de Questões',
    teaser: 'Milhares de questões, uso ilimitado no Plus+.',
    badge: 'Ilimitado no Plus+',
    headline: 'Errar aqui é de graça. Errar na prova custa o ano.',
    body: [
      'Milhares de questões para resolver à vontade, com gabarito e comentário. Você descobre o buraco do seu conteúdo aqui dentro, antes de descobrir na hora que vale nota.',
    ],
    cta: { label: 'Entrar no banco', href: LINKS.bancoQuestoes },
    media: () => <ProductImage src={provas3d} alt="Banco de questões da plataforma" />,
  },
  {
    key: 'flashcards',
    icon: <IconCards />,
    name: 'Flashcards',
    teaser: 'Decks de anatomia e além, com repetição espaçada.',
    headline: 'O conteúdo volta na hora certa, até virar seu.',
    body: [
      'Decks criados e revisados por quem entende, com repetição espaçada: o card reaparece exatamente quando você estaria prestes a esquecer. É assim que conteúdo sai da memória de véspera e entra na de longo prazo.',
    ],
    cta: { label: 'Ver os flashcards', href: LINKS.flashcards },
    note: 'Feitos por especialistas',
    media: () => <ProductImage src={flashcards3d} alt="Flashcards do Domine Aqui" />,
  },
  {
    key: 'ia',
    icon: <IconLayers />,
    name: 'Provas e Flashcards por IA',
    teaser: 'Gerados em cima da ementa exata do seu curso.',
    badge: 'Já no plano grátis',
    headline: 'Sob medida para o que a SUA faculdade cobra.',
    body: [
      'Cola a ementa, escolhe o assunto e a IA monta a prova ou o baralho em cima do que o seu curso cobra de verdade — não um genérico que serve para todo mundo e para ninguém. Está liberado já no acesso gratuito.',
    ],
    cta: { label: 'Começar grátis', href: LINKS.signup },
    media: () => <ProductImage src={flashcards3d} alt="Provas e flashcards gerados por IA" />,
  },
  {
    key: 'mapas',
    icon: <IconMap />,
    name: 'Mapas mentais',
    teaser: 'Editor visual para pensar em rede, não em lista.',
    headline: 'A anatomia do seu raciocínio, desenhada.',
    body: [
      'Um editor visual rápido para criar, conectar e compartilhar ideias. Deixe público, envie por link ou proteja com senha. Dá para testar um mapa de graça.',
    ],
    cta: { label: 'Testar um mapa grátis', href: LINKS.mapaMental },
    note: 'Público, link ou senha',
    media: () => <ProductImage src={flashcards3d} alt="Editor de mapas mentais" />,
  },
  {
    key: 'cronograma',
    icon: <IconCheck />,
    name: 'Cronograma',
    teaser: 'Plano de estudo vinculado ao ritmo real do seu curso.',
    headline: 'Abra e saiba o que estudar hoje. Só isso.',
    body: [
      'A pior meia hora do dia é a que você gasta decidindo por onde começar. O cronograma acompanha o ritmo real do seu curso e já chega com a resposta pronta.',
    ],
    cta: { label: 'Montar cronograma', href: LINKS.cronogramas },
    media: () => <ProductImage src={flashcards3d} alt="Cronograma de estudos" />,
  },
  {
    key: 'sus',
    icon: <IconManual />,
    name: 'Prescrição Real no SUS',
    teaser: '330 páginas de conduta com o que existe na prateleira do posto.',
    badge: 'Ebook · R$47',
    headline: 'O único material que você vai querer que seja um PDF.',
    body: [
      'Sentiu aquela sensação de abrir o guideline e ver um remédio que não existe na farmácia do posto? Ela some quando você tem um manual escrito para a realidade do SUS, não para a prova. Este não morre na pasta de Downloads: ele vive no bolso do jaleco, aberto às três da manhã na UPA lotada.',
      'As 50 queixas mais comuns, os medicamentos reais da REMUME, as doses e o plano B para quando falta o ideal. 330 páginas, 100% REMUME e SUS. De colega para colega.',
    ],
    cta: { label: 'Conhecer o Ebook', href: LINKS.sus },
    note: 'R$147 R$47 · pagamento único · seu para sempre',
    media: () => <Book3D />,
  },
]

function ProductRow({
  product,
  index,
  open,
  onToggle,
}: {
  product: Product
  index: number
  open: boolean
  onToggle: () => void
}) {
  const panelId = `produto-${product.key}`
  return (
    <div className="border-b border-[color:var(--da-neutral-line)]">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={
            'group flex w-full items-start gap-4 px-1 py-6 text-left transition-colors md:gap-6 md:px-4 ' +
            (open ? 'text-da-paper' : 'hover:bg-da-panel/40')
          }
        >
          <span className="w-6 shrink-0 pt-1.5 font-da-mono text-xs text-da-amber-soft">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className={
              'hidden shrink-0 pt-0.5 transition-colors sm:block ' +
              (open ? 'text-da-amber-ink' : 'text-da-muted group-hover:text-da-amber-ink')
            }
          >
            {product.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-da-display text-xl font-semibold tracking-tight md:text-2xl">
                {product.name}
              </span>
              {product.badge && (
                <span className="rounded-full border border-[color:var(--da-amber-soft-line)] px-2.5 py-1 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
                  {product.badge}
                </span>
              )}
            </span>
            <span className="mt-1.5 block text-sm leading-snug text-da-muted">
              {product.teaser}
            </span>
          </span>
          <span
            className="shrink-0 text-da-amber-ink transition-transform duration-300"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </h3>

      {/* Colapso por grid-template-rows (mesma técnica do FAQ): anima altura
          desconhecida sem medir nada em JS. `visibility` entra na transição só
          para o conteúdo fechado sair da ordem de tabulação — e, como o
          navegador segura o valor `visible` até o fim, o fechamento continua
          suave em vez de sumir de uma vez. */}
      <div
        id={panelId}
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          visibility: open ? 'visible' : 'hidden',
          transition: 'grid-template-rows .45s cubic-bezier(.2,.7,.2,1), visibility .45s',
        }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 items-center gap-8 px-1 pb-12 md:px-4 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <h4 className="font-da-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                {product.headline}
              </h4>
              {product.body.map((p) => (
                <p key={p} className="mt-4 max-w-xl leading-relaxed text-da-muted">
                  {p}
                </p>
              ))}
              {product.bullets && (
                <ul className="mt-6 space-y-3">
                  {product.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-da-amber-ink">
                        <IconLayers />
                      </span>
                      <span className="text-sm leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <GhostCTA href={product.cta.href}>{product.cta.label}</GhostCTA>
                {product.note && (
                  <span className="font-da-mono text-xs text-da-muted">{product.note}</span>
                )}
              </div>
            </div>
            {/* A mídia só existe no DOM com a linha aberta: nenhuma imagem 3D,
                mockup ou capa é baixada por quem nunca abriu aquele produto. */}
            <div>{open && product.media()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Os grupos existem porque nove ferramentas com o mesmo peso visual não são
 * nove motivos de compra: na prática, três respondem pela quase totalidade do
 * interesse e o resto é o que faz a conta valer a pena depois. Listar tudo no
 * mesmo tamanho transformava a seção num inventário — e inventário cansa antes
 * de convencer. Aqui o visitante lê três nomes, entende o produto, e o resto
 * chega como bônus em vez de como lição de casa.
 */
const GRUPOS: { titulo: string; nota: string; keys: string[] }[] = [
  {
    titulo: 'O núcleo',
    nota: 'É por aqui que quase todo mundo começa.',
    keys: ['manual', 'banco', 'provas-fac'],
  },
  {
    titulo: 'Também incluído na sua conta',
    nota: 'Sem cobrança extra, sem plano à parte.',
    keys: ['ia', 'flashcards', 'cronograma', 'mapas'],
  },
  {
    titulo: 'Complementos',
    nota: 'Condições próprias — está escrito em cada um.',
    keys: ['eletro', 'sus'],
  },
]

function ProductsExplorer() {
  const [openKey, setOpenKey] = useState<string | null>('manual')
  const porChave = new Map(PRODUCTS.map((p) => [p.key, p]))
  let n = 0

  return (
    <section id="produtos" className="relative border-t border-[color:var(--da-neutral-line)]">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-28">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <SectionMark n="05 / 08" label="O que está incluído" />
            <h2 className="max-w-2xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
              Nove ferramentas. Uma conta. Abra a que te interessa.
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
              Três resolvem o dia a dia da prova. O resto já vem junto, para o dia em que você
              precisar. Toque no nome para ver o que aquela ferramenta faz por você.
            </p>
          </Reveal>
          {/* A arte do ecossistema saiu da primeira dobra e veio para cá, que é
              onde ela finalmente quer dizer alguma coisa: são as ferramentas
              desta lista, conectadas. No hero, ela comunicava "Medicina" —
              nunca "esta é a tela que você vai usar". */}
          <Reveal delay={80} className="hidden lg:block">
            <div className="relative aspect-square w-full">
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem]"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 45%, rgba(232,118,58,.16), transparent 70%)',
                }}
              />
              <div className="absolute inset-0 dark:hidden" style={heroMidStyle}>
                <Image
                  src={heroMidLight}
                  alt="As ferramentas do Domine Aqui conectadas: Manual Clínico, flashcards, provas, banco de questões, cronograma e ECG"
                  fill
                  sizes="45vw"
                  className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.5)]"
                />
              </div>
              <div className="absolute inset-0 hidden dark:block" style={heroMidStyle}>
                <Image
                  src={heroMid}
                  alt="As ferramentas do Domine Aqui conectadas: Manual Clínico, flashcards, provas, banco de questões, cronograma e ECG"
                  fill
                  sizes="45vw"
                  className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.5)]"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14">
          {GRUPOS.map((grupo, gi) => (
            <div key={grupo.titulo} className={gi === 0 ? '' : 'mt-10 md:mt-12'}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-da-display text-lg font-semibold tracking-tight md:text-xl">
                  {grupo.titulo}
                </h3>
                <span className="font-da-mono text-[11px] text-da-muted">{grupo.nota}</span>
              </div>
              <div className="mt-3 border-t border-[color:var(--da-neutral-line)]">
                {grupo.keys.map((key) => {
                  const p = porChave.get(key)
                  if (!p) return null
                  const index = n++
                  return (
                    <ProductRow
                      key={p.key}
                      product={p}
                      index={index}
                      open={openKey === p.key}
                      onToggle={() => setOpenKey((cur) => (cur === p.key ? null : p.key))}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- O PROBLEMA ---------- */

function ProblemBand() {
  return (
    <section
      id="problema"
      className="relative overflow-hidden border-t border-[color:var(--da-neutral-line)]"
    >
      <Image
        src={ausculta}
        alt=""
        aria-hidden
        fill
        placeholder="blur"
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div aria-hidden className="absolute inset-0 bg-da-ground/80" />
      <div className="relative mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-32">
        <Reveal>
          <p className="font-da-mono text-[11px] uppercase tracking-[0.28em] text-da-amber-soft md:text-xs">
            O problema que ninguém te conta
          </p>
          {/* O inimigo aqui é o conteúdo ESPALHADO, não o formato PDF.
              Enquanto a headline era "o material que você baixou já morreu na
              pasta de Downloads", a página atacava um produto que a própria
              plataforma vende — e o visitante ouvia "PDF é uma porcaria;
              aliás, aqui estão os nossos". Dito assim, a ideia de plataforma
              viva continua inteira e para de trabalhar contra o catálogo. */}
          <h2 className="mt-4 max-w-3xl font-da-display text-[1.9rem] font-semibold leading-[1.08] tracking-tight md:text-5xl">
            O PDF deveria ser o começo do estudo. Não o fim.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-6 md:text-lg">
            Quatorze abas abertas. Três PDFs pela metade. O resumo que alguém jogou no grupo. O
            livro que você abriu uma vez. E a prova em cinco dias.
          </p>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:text-lg">
            Nada disso é material ruim. O problema é que cada peça vive sozinha:{' '}
            <span className="text-da-paper">
              o arquivo não sabe o que você errou na questão, a questão não te leva ao capítulo, e o
              capítulo não vira revisão.
            </span>{' '}
            Material que não conversa com o resto do seu estudo vira só mais um arquivo na pasta.
          </p>
          <p className="mt-5 max-w-2xl font-da-display text-lg font-semibold tracking-tight text-da-paper md:text-xl">
            O Domine Aqui liga essas peças. Uma conta, uma aba, tudo que a prova cobra.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- 30 SEGUNDOS DENTRO DA PLATAFORMA ---------- */

/** Linha de "conteúdo" da UI desenhada — barrinha cinza no lugar de texto. */
function UiLine({ w = '100%', dim = false }: { w?: string; dim?: boolean }) {
  return (
    <span
      aria-hidden
      className={'block h-2 rounded-full ' + (dim ? 'bg-da-muted/20' : 'bg-da-muted/35')}
      style={{ width: w }}
    />
  )
}

const PASSOS: {
  titulo: string
  texto: string
  path: string
  nav: number
  tela: ReactNode
}[] = [
  {
    titulo: 'Diga o que você está estudando',
    texto: 'Escolhe o módulo, o tema ou cola a ementa da sua faculdade. Tudo depois disso vem filtrado por isso.',
    path: 'domineaqui.com.br/dashboard',
    nav: 4,
    tela: (
      <div className="p-4 md:p-5">
        <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
          O que você está estudando?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Cardiologia', 'Farmacologia', 'HAM III', 'Semiologia', 'SOI II'].map((t, i) => (
            <span
              key={t}
              className={
                'rounded-full border px-3 py-1.5 text-[12px] ' +
                (i === 0
                  ? 'border-da-amber/60 bg-da-amber/10 text-da-amber-ink'
                  : 'border-[color:var(--da-neutral-line)] text-da-muted')
              }
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-5 space-y-2.5 rounded-lg border border-[color:var(--da-neutral-line)] p-3.5">
          <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-muted">
            Hoje no seu cronograma
          </p>
          <UiLine w="82%" />
          <UiLine w="64%" dim />
          <UiLine w="71%" dim />
        </div>
      </div>
    ),
  },
  {
    titulo: 'Resolva questões ou uma prova inteira',
    texto: 'O banco de questões, as provas que a sua faculdade já aplicou e as provas geradas na sua ementa. Você treina no que cai.',
    path: 'domineaqui.com.br/banco-questoes',
    nav: 0,
    tela: (
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-[color:var(--da-amber-soft-line)] px-2.5 py-1 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
            Cardiologia
          </span>
          <span className="font-da-mono text-[11px] text-da-muted">Questão 3 de 20</span>
        </div>
        <div className="mt-3.5 space-y-2">
          <UiLine w="100%" />
          <UiLine w="93%" />
          <UiLine w="47%" />
        </div>
        <div className="mt-4 space-y-2">
          {['A', 'B', 'C', 'D'].map((id, i) => (
            <span
              key={id}
              className={
                'flex min-h-[40px] items-center gap-3 rounded-lg border px-3 ' +
                (i === 1
                  ? 'border-da-amber/60 bg-da-amber/10'
                  : 'border-[color:var(--da-neutral-line)]')
              }
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[color:var(--da-neutral-line)] font-da-mono text-[11px] text-da-muted">
                {id}
              </span>
              <UiLine w={['74%', '61%', '80%', '55%'][i]} dim={i !== 1} />
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    titulo: 'Leia por que a sua resposta estava errada',
    texto: 'Gabarito na hora e comentário explicando o raciocínio — não só a letra certa. É aqui que a questão vira aprendizado.',
    path: 'domineaqui.com.br/banco-questoes',
    nav: 0,
    tela: (
      <div className="p-4 md:p-5">
        <div className="flex min-h-[40px] items-center gap-3 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-emerald-500/60 font-da-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            B
          </span>
          <span className="text-[12.5px] text-da-paper">Alternativa correta</span>
        </div>
        <div className="mt-3 rounded-xl border border-[color:var(--da-amber-line)] bg-da-tint/50 p-3.5">
          <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber-ink">
            Resposta comentada
          </p>
          <div className="mt-2.5 space-y-2">
            <UiLine w="100%" />
            <UiLine w="96%" />
            <UiLine w="88%" dim />
            <UiLine w="52%" dim />
          </div>
          <p className="mt-3 font-da-mono text-[11px] text-da-amber-ink">
            Aprofundar no Manual Clínico →
          </p>
        </div>
      </div>
    ),
  },
  {
    titulo: 'Aprofunde no Manual, sem trocar de aba',
    texto: 'O tema da questão abre direto no Manual Clínico: mecanismo, conduta, ausculta que toca e foto clínica com referência.',
    path: 'domineaqui.com.br/manual-clinico',
    nav: 1,
    tela: (
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--da-neutral-line)] px-3 py-2">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-da-muted" {...stUi} aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <span className="font-da-mono text-[12px] text-da-paper">infarto agudo do miocárdio</span>
        </div>
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {['Fisiopatologia', 'Conduta', 'Ausculta'].map((t, i) => (
            <span
              key={t}
              className={
                'truncate rounded-lg border px-2 py-2 text-center text-[10.5px] ' +
                (i === 0
                  ? 'border-da-amber/60 bg-da-amber/10 text-da-amber-ink'
                  : 'border-[color:var(--da-neutral-line)] text-da-muted')
              }
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3.5 space-y-2.5">
          <UiLine w="100%" />
          <UiLine w="91%" />
          <UiLine w="97%" dim />
          <UiLine w="63%" dim />
        </div>
      </div>
    ),
  },
  {
    titulo: 'Salve e deixe o card voltar na hora certa',
    texto: 'O que você errou vira flashcard com repetição espaçada. Ele reaparece pouco antes de você esquecer — até virar seu.',
    path: 'domineaqui.com.br/flashcards',
    nav: 3,
    tela: (
      <div className="p-4 md:p-5">
        <div className="rounded-xl border border-[color:var(--da-neutral-line)] bg-da-panel/50 p-4">
          <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
            Cardiologia · card novo
          </p>
          <div className="mt-3 space-y-2">
            <UiLine w="88%" />
            <UiLine w="59%" dim />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ['De novo', '<10min'],
            ['Difícil', '1d'],
            ['Bom', '4d'],
            ['Fácil', '10d'],
          ].map(([l, q], i) => (
            <span
              key={l}
              className={
                'rounded-lg border px-1.5 py-2 text-center ' +
                (i === 2
                  ? 'border-da-amber/60 bg-da-amber/10 text-da-amber-ink'
                  : 'border-[color:var(--da-neutral-line)] text-da-muted')
              }
            >
              <span className="block text-[11px] font-medium">{l}</span>
              <span className="block font-da-mono text-[9.5px] opacity-80">{q}</span>
            </span>
          ))}
        </div>
        <p className="mt-3.5 font-da-mono text-[11px] text-da-muted">
          Próxima revisão agendada automaticamente.
        </p>
      </div>
    ),
  },
]

/**
 * O trecho que responde "como é estudar aqui?" — a pergunta que uma lista de
 * funcionalidades nunca responde. Dizer "temos nove ferramentas" faz a pessoa
 * pensar "legal"; mostrar questão → comentário → Manual → flashcard faz ela
 * pensar "ah, entendi como eu usaria isso". A segunda reação é a que vende.
 *
 * Os cinco passos são clicáveis, mas nenhum clique é obrigatório: o primeiro
 * já vem aberto e o texto de cada passo se explica sozinho. Quem quiser ver a
 * tela correspondente troca com um toque; quem não quiser, lê e segue.
 */
function HowItWorks() {
  const [passo, setPasso] = useState(0)
  const atual = PASSOS[passo]

  return (
    <section
      id="como-funciona"
      className="relative border-t border-[color:var(--da-neutral-line)]"
    >
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="03 / 08" label="Como funciona" />
          <h2 className="max-w-3xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
            Trinta segundos aqui dentro, do começo ao fim.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
            Um ciclo inteiro de estudo sem trocar de aba nenhuma vez. Toque num passo para ver a
            tela.
          </p>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-6 md:mt-12 lg:grid-cols-[1fr_.9fr] lg:gap-12">
          <Reveal>
            <ol className="flex flex-col">
              {PASSOS.map((p, i) => {
                const ativo = i === passo
                return (
                  <li key={p.titulo}>
                    <button
                      type="button"
                      onClick={() => setPasso(i)}
                      aria-current={ativo}
                      className={
                        'flex w-full items-start gap-4 border-l-2 py-3.5 pl-4 pr-1 text-left transition-colors md:py-4 ' +
                        (ativo
                          ? 'border-da-amber'
                          : 'border-[color:var(--da-neutral-line)] hover:border-da-amber/40')
                      }
                    >
                      <span
                        className={
                          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border font-da-mono text-[11px] font-semibold transition-colors ' +
                          (ativo
                            ? 'border-da-amber bg-da-amber text-[#0B1F1A]'
                            : 'border-[color:var(--da-neutral-line)] text-da-muted')
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={
                            'block font-da-display text-[17px] font-semibold leading-snug tracking-tight transition-colors md:text-lg ' +
                            (ativo ? 'text-da-paper' : 'text-da-muted')
                          }
                        >
                          {p.titulo}
                        </span>
                        {/* O texto do passo ativo fica aberto; os outros também
                            aparecem, só que apagados. Esconder o texto dos
                            fechados obrigaria a tocar em cinco itens para ler
                            cinco frases — exatamente o tipo de trabalho que a
                            página não deveria pedir. */}
                        <span
                          className={
                            'mt-1 block text-[14px] leading-relaxed transition-colors md:text-[15px] ' +
                            (ativo ? 'text-da-muted' : 'text-da-muted/70')
                          }
                        >
                          {p.texto}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <PrimaryCTA href={LINKS.signup} className="!py-3.5">
                Começar grátis
              </PrimaryCTA>
              <SmartLink
                href={LINKS.amostra}
                className="inline-flex min-h-[44px] items-center font-da-display text-sm font-semibold text-da-amber-ink underline underline-offset-4"
              >
                Ou teste 10 questões sem cadastro
              </SmartLink>
            </div>
          </Reveal>

          <Reveal delay={80}>
            {/* `key` no passo: troca de conteúdo remonta o bloco e a animação
                de entrada roda de novo, deixando claro que a tela mudou. */}
            <div className="lg:sticky lg:top-24">
              <AppWindow path={atual.path} active={atual.nav}>
                <div key={passo} className="da-panel-fade">
                  {atual.tela}
                </div>
              </AppWindow>
              <p className="mt-3 text-center font-da-mono text-[11px] text-da-muted lg:text-left">
                Passo {passo + 1} de {PASSOS.length} · {atual.titulo}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------- AMOSTRA GRÁTIS ---------- */

function SampleBand() {
  return (
    <section className="relative border-t border-[color:var(--da-neutral-line)]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-da-amber/50 bg-da-tint/40 p-6 md:p-10">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,118,58,.3), transparent 70%)' }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--da-amber-soft-line)] px-3 py-1.5 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
                <IconPulse /> Amostra grátis · sem cadastro
              </span>
              <h2 className="mt-4 font-da-display text-[1.6rem] font-semibold leading-tight tracking-tight md:text-3xl">
                10 questões comentadas para testar agora
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-da-muted md:text-base">
                Sem cadastro, sem cartão, sem e-mail. Você responde, vê o gabarito na hora e lê o
                comentário — do mesmo jeito que acontece lá dentro. Se gostar do que sentiu aqui,
                a conta grátis está a um toque.
              </p>
            </div>
            <div className="shrink-0">
              <PrimaryCTA href={LINKS.amostra} className="w-full justify-center md:w-auto">
                Testar 10 questões grátis
              </PrimaryCTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MOCKUP DE CELULAR (usado no produto Manual do Eletro) ---------- */

const phoneStyle: CSSProperties = {
  width: 'clamp(230px, 30vw, 300px)',
  aspectRatio: '9 / 19.5',
  transform:
    'perspective(1500px) rotateX(calc(var(--da-my, 0) * -4deg)) rotateY(calc(var(--da-mx, 0) * 6deg))',
  transition: 'transform .2s ease-out',
}

function PhoneMockup() {
  const [play, setPlay] = useState(false)
  const VIDEO_ID = 'ETqxxCibi40'
  const embed = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${VIDEO_ID}&iv_load_policy=3`

  return (
    <div className="da-scene flex justify-center">
      <div className="relative" style={phoneStyle}>
        {/* corpo do aparelho */}
        <div className="absolute inset-0 rounded-[2.4rem] border border-[color:var(--da-amber-line)] bg-[#05100D] p-2.5 shadow-[0_50px_100px_-30px_rgba(0,0,0,.8)]">
          {/* tela */}
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black">
            {play ? (
              <iframe
                src={embed}
                title="Manual do Eletrocardiograma"
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              // O iframe do YouTube só entra no DOM depois do clique — nada de
              // ~1MB de player carregado à toa em quem nunca aperta o play.
              <button
                type="button"
                onClick={() => setPlay(true)}
                className="group absolute inset-0 flex items-center justify-center"
                aria-label="Reproduzir vídeo do Manual do Eletrocardiograma"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'radial-gradient(120% 80% at 50% 20%, #10352b, #05100D 70%)' }}
                />
                <svg
                  viewBox="0 0 400 200"
                  className="absolute inset-x-0 top-1/3 w-full opacity-60"
                  fill="none"
                  stroke="#E8763A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M0 100h140l14-40 18 80 12-40h40l10-30 14 60 10-30h128" />
                </svg>
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-da-amber text-[#0B1F1A] transition-transform duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="absolute bottom-6 left-0 right-0 px-6 text-center font-da-mono text-[10px] uppercase tracking-[0.25em] text-da-amber">
                  Manual do Eletro · assista
                </span>
              </button>
            )}
          </div>
        </div>
        <div
          aria-hidden
          className="absolute -right-[3px] top-24 h-14 w-[3px] rounded-r bg-[color:var(--da-amber-line)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-[50%]"
          style={{
            background: 'radial-gradient(closest-side, rgba(232,118,58,.3), transparent)',
            filter: 'blur(8px)',
          }}
        />
      </div>
    </div>
  )
}

/* ---------- DIFERENCIAIS ---------- */

function Differentiators() {
  // A comparação não é contra o PDF: é contra o arquivo SOLTO, que pode ser um
  // PDF, um print no rolo da câmera ou um resumo do grupo. A diferença é o que
  // acontece depois de ler — e é aí que uma plataforma faz o que um arquivo
  // isolado nunca vai fazer.
  const linhas: [string, string][] = [
    ['Procurar no meio de vinte arquivos', 'Uma busca só, por doença ou por tema'],
    ['Parado na versão que você baixou', 'Atualizado dentro da plataforma'],
    ['Ler e torcer para lembrar', 'Praticar na questão e voltar no flashcard'],
    ['Som e imagem que o papel não tem', 'Ausculta que toca e foto clínica com referência'],
    ['Nenhum registro do que você já domina', 'Seu erro, seu progresso e sua revisão guardados'],
    ['Serve para todo mundo e para ninguém', 'Provas e cards montados na ementa do seu curso'],
  ]
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-28">
      <Reveal>
        <SectionMark n="06 / 08" label="Por que aqui" />
        <h2 className="max-w-3xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
          Seu material é só uma parte do estudo. O Domine Aqui conecta o resto.
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
          A mesma matéria, dos dois jeitos. À esquerda, o arquivo solto — ele até ensina, mas para
          por aí. À direita, o que acontece quando o conteúdo está ligado ao resto do seu estudo.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-9 overflow-hidden rounded-2xl border border-[color:var(--da-neutral-line)] md:mt-12">
          <div className="grid grid-cols-2 border-b border-[color:var(--da-neutral-line)] bg-da-panel/50">
            <p className="px-4 py-3 font-da-mono text-[10px] uppercase tracking-widest text-da-muted md:px-6 md:text-[11px]">
              Arquivo solto
            </p>
            <p className="border-l border-[color:var(--da-neutral-line)] px-4 py-3 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-ink md:px-6 md:text-[11px]">
              Domine Aqui
            </p>
          </div>
          {linhas.map(([antes, depois]) => (
            <div
              key={antes}
              className="grid grid-cols-2 border-b border-[color:var(--da-neutral-line)] last:border-b-0"
            >
              <p className="px-4 py-4 text-[13.5px] leading-snug text-da-muted md:px-6 md:py-5 md:text-[15px]">
                {antes}
              </p>
              <p className="flex items-start gap-2.5 border-l border-[color:var(--da-neutral-line)] px-4 py-4 text-[13.5px] leading-snug text-da-paper md:px-6 md:py-5 md:text-[15px]">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-da-amber-ink"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>{depois}</span>
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-da-muted md:text-base">
          É por isso que o Manual, o eletro e os flashcards não têm botão de baixar: eles vivem
          onde o seu estudo acontece. E o que faz sentido no papel — como o guia de prescrição no
          SUS — continua sendo PDF, para abrir às três da manhã na UPA, sem sinal.
        </p>
      </Reveal>
    </section>
  )
}

/* ---------- DEPOIMENTOS EM VÍDEO ---------- */

interface Testimonial {
  _id: string
  embedUrl: string
  videoId: string
  vertical: boolean
  name: string
  description: string
}

/**
 * O cartão de depoimento entrega a conclusão ANTES do play.
 *
 * A maior parte do valor destes depoimentos estava presa dentro dos vídeos — e
 * a maior parte das pessoas não aperta o play. Um cartão que só mostrava
 * miniatura, nome e uma legenda cinza de três linhas exigia um clique para
 * dizer qualquer coisa. Agora a frase do aluno vem primeiro, em tamanho de
 * leitura, e o vídeo passa a ser prova ADICIONAL — não pré-requisito para
 * entender a prova.
 */
function TestimonialCard({ t }: { t: Testimonial }) {
  const [play, setPlay] = useState(false)
  // Autoplay só depois do clique — o iframe do YouTube (~1MB) nunca entra no DOM
  // de quem não aperta o play, seguindo o mesmo cuidado do Manual do Eletro.
  const src = `${t.embedUrl}${t.embedUrl.includes('?') ? '&' : '?'}autoplay=1`
  const frase = (t.description || '').trim()

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground transition-colors hover:border-da-amber/40">
      {frase && (
        <div className="flex min-h-[132px] flex-col justify-between gap-3 p-5 pb-4">
          {/* Clamp em 4 linhas: mantém todos os cartões do trilho na mesma
              altura mesmo quando um depoimento tem legenda gigante. */}
          <p className="line-clamp-4 whitespace-pre-line font-da-display text-[15.5px] font-medium leading-snug tracking-tight text-da-paper">
            “{frase}”
          </p>
          {t.name && (
            <p className="font-da-mono text-[11px] uppercase tracking-widest text-da-muted">
              {t.name}
            </p>
          )}
        </div>
      )}

      {/* Todos os slides usam a MESMA caixa, independente de o vídeo ser
          vertical ou horizontal. No trilho lateral, cartão de altura variável
          quebra o alinhamento e a rolagem com encaixe fica torta; a miniatura
          entra em object-cover e o player letterboxa sozinho o que não couber. */}
      <div
        className="relative mt-auto w-full overflow-hidden bg-black"
        style={{ aspectRatio: frase ? '1 / 1' : '4 / 5' }}
      >
        {play ? (
          <iframe
            src={src}
            title={t.name ? `Depoimento de ${t.name}` : 'Depoimento de aluno'}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label={t.name ? `Reproduzir depoimento de ${t.name}` : 'Reproduzir depoimento'}
          >
            <img
              src={`https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'radial-gradient(120% 90% at 50% 30%, transparent, rgba(5,16,13,.6))' }}
            />
            <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-da-amber text-[#0B1F1A] shadow-lg transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="absolute bottom-3 left-0 right-0 px-4 text-center font-da-mono text-[10px] uppercase tracking-[0.22em] text-white/90">
              Ver o depoimento
            </span>
          </button>
        )}
      </div>

      {!frase && t.name && (
        <div className="p-5">
          <span className="font-da-display text-base font-semibold tracking-tight">{t.name}</span>
        </div>
      )}
    </article>
  )
}

function Testimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/testimonials', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { testimonials: [] }))
      .then((json) => {
        if (!cancelled) setItems(Array.isArray(json?.testimonials) ? json.testimonials : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Sem depoimentos cadastrados (ou ainda carregando) a seção nem aparece —
  // nada de buraco vazio na landing enquanto o admin não sobe os vídeos.
  // O trilho fica num componente separado de propósito: o efeito que mede a
  // rolagem roda uma vez na montagem, então ele só pode montar quando os cards
  // já existem no DOM. Montado antes, mediria um trilho vazio, concluiria "não
  // tem overflow" e as setas ficariam desabilitadas para sempre.
  if (!items || items.length === 0) return null

  return <TestimonialsRail items={items} />
}

function TestimonialsRail({ items }: { items: Testimonial[] }) {
  const { trackRef, barRef, edges, nudge } = useHorizontalRail<HTMLDivElement>()

  return (
    <section
      id="depoimentos"
      className="relative overflow-hidden border-t border-[color:var(--da-neutral-line)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(900px 500px at 15% 0%, rgba(232,118,58,.12), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="01 / 08" label="Quem já usa" />
          <h2 className="max-w-3xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
            Não acredite em mim. Escute eles.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
            Alunos que estavam exatamente onde você está agora — véspera de prova, material
            espalhado, tempo curto. A frase de cada um já está no cartão; o vídeo é para quem
            quiser ouvir da boca deles.
          </p>
        </Reveal>
      </div>

      {/* O trilho sangra até a borda da tela (fora do container) para o card
          seguinte ficar sempre "cortado" na lateral — a dica visual que faz o
          visitante entender que dá para arrastar, sem precisar de instrução. */}
      <div
        ref={trackRef}
        className="da-track flex snap-x gap-5 overflow-x-auto px-5 pb-2 md:px-8"
        role="region"
        aria-label="Depoimentos de alunos em vídeo"
        tabIndex={0}
      >
        {items.map((t) => (
          <div key={t._id} data-slide className="w-[76vw] shrink-0 sm:w-[300px]">
            <TestimonialCard t={t} />
          </div>
        ))}
        {/* Cartão final: quem chegou ao fim do trilho já está convencido. */}
        <div data-slide className="w-[76vw] shrink-0 sm:w-[300px]">
          <div className="flex h-full flex-col justify-center rounded-2xl border border-da-amber/50 bg-da-tint/40 p-7">
            <p className="font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-amber-soft">
              Próximo depoimento
            </p>
            <p className="mt-4 font-da-display text-2xl font-semibold leading-tight tracking-tight">
              O próximo aqui pode ser o seu.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-da-muted">
              Cria a conta grátis, usa por uma semana e vê se a sua rotina muda.
            </p>
            <div className="mt-6">
              <GhostCTA href={LINKS.signup} className="!px-5 !py-2.5 text-sm">
                Criar conta grátis
              </GhostCTA>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-12 md:px-8 md:pb-20">
        <RailControls edges={edges} nudge={nudge} barRef={barRef} label="Depoimentos" />
      </div>
    </section>
  )
}

/* ---------- AVALIAÇÕES DOS MATERIAIS ---------- */

function ReviewChip({ r }: { r: ShowcaseReview }) {
  return (
    <article className="mr-4 flex w-[290px] shrink-0 flex-col rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground p-5 sm:w-[330px]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[color:var(--da-amber-line)] bg-da-amber/10 font-da-display text-sm font-semibold text-da-amber-ink">
          {(r.displayName || '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-da-display text-sm font-semibold tracking-tight">
            {r.displayName}
          </p>
          <Stars value={r.rating} className="h-3.5 w-3.5" />
        </div>
        {r.isVerified && (
          <span className="ml-auto shrink-0 font-da-mono text-[10px] uppercase tracking-widest text-da-amber-soft">
            Verificado
          </span>
        )}
      </div>
      <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-da-muted">{r.comment}</p>
      {r.sourceTitle && (
        <p className="mt-4 truncate border-t border-[color:var(--da-neutral-line)] pt-3 font-da-mono text-[10px] uppercase tracking-widest text-da-muted">
          {r.sourceTitle}
        </p>
      )}
    </article>
  )
}

/**
 * Esteira de avaliações reais dos materiais, logo abaixo dos depoimentos.
 * Duas fileiras deslizando em sentidos opostos: cabe dezenas de avaliações em
 * pouco mais de 400px de altura, contra a página infinita que uma grade daria.
 * O conteúdo é duplicado no JSX porque o keyframe anda -50% do track.
 */
function PlatformReviews({ data }: { data: ShowcaseData | null }) {
  const railsRef = useOffscreenPause<HTMLDivElement>()
  if (!data || data.reviews.length === 0) return null

  const { reviews, summary } = data
  // Com poucas avaliações a esteira dá volta rápido demais e fica óbvio que é
  // a mesma coisa repetindo — nesse caso vira uma faixa estática.
  const animate = reviews.length >= 6
  // Teto de cartões por fileira. Com muitas avaliações a esteira chegava a
  // ~40 cartões por fileira (× 2 cópias × 2 fileiras): DOM enorme dentro de
  // uma camada animada sem parar, que é justamente o que faz a home arrastar
  // no celular. Ninguém lê a 30ª avaliação de uma faixa que passa sozinha.
  const MAX_POR_FILEIRA = 10
  const half = Math.ceil(reviews.length / 2)
  const rows = [
    reviews.slice(0, half).slice(0, MAX_POR_FILEIRA),
    reviews.slice(half).slice(0, MAX_POR_FILEIRA),
  ]
  // O keyframe anda -50% do track, então o conteúdo precisa estar duplicado um
  // número PAR de vezes para o loop fechar sem salto. Em fileira curta, duas
  // cópias podem não cobrir a largura de um monitor grande e apareceria um
  // vazio no fim da volta — daí quatro.
  const repeat = (row: ShowcaseReview[]) => (row.length < 6 ? 4 : 2)

  return (
    <section className="relative overflow-hidden border-t border-[color:var(--da-neutral-line)] bg-da-panel/40">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 md:px-8 md:pb-12 md:pt-24">
        <Reveal>
          <SectionMark n="02 / 08" label="Avaliações dos materiais" />
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="max-w-2xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
                Cada material daqui tem nota. Todas estão aqui.
              </h2>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
                Nada de depoimento escolhido a dedo: o que passa abaixo é o que os alunos
                escreveram dentro da plataforma, sobre os materiais que compraram.
              </p>
            </div>
            {summary.count > 0 && (
              <div className="shrink-0 rounded-2xl border border-[color:var(--da-amber-line)] bg-da-ground px-6 py-5">
                <div className="flex items-end gap-2">
                  <span className="font-da-display text-4xl font-semibold tracking-tighter text-da-amber-ink">
                    {summary.avg.toFixed(1).replace('.', ',')}
                  </span>
                  <span className="pb-1 font-da-mono text-xs text-da-muted">/ 5</span>
                </div>
                <Stars value={summary.avg} className="mt-2 h-4 w-4" />
                <p className="mt-2 font-da-mono text-[11px] text-da-muted">
                  {summary.count} {summary.count === 1 ? 'avaliação' : 'avaliações'} na plataforma
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* As pontas são apagadas por dois véus de gradiente sobre a faixa (ver
          `.da-rail-fade`). Antes era `mask-image` no contêiner: máscara em cima
          de conteúdo que anima obriga o navegador a recompor a camada inteira a
          cada quadro — caro no celular, e o resultado visual é o mesmo. */}
      <div ref={railsRef} className="relative pb-14 md:pb-24">
        {animate ? (
          rows.map((row, rowIndex) => {
            const copies = repeat(row)
            // A volta percorre metade do track: velocidade constante = duração
            // proporcional ao número de cards atravessados nessa metade.
            const seconds = Math.max(28, ((row.length * copies) / 2) * 9)
            return (
              <div key={rowIndex} className="da-rail-wrap overflow-hidden py-2">
                <div
                  className={'da-rail' + (rowIndex % 2 === 1 ? ' da-rail-reverse' : '')}
                  style={{ '--da-rail-duration': `${seconds}s` } as CSSProperties}
                >
                  {Array.from({ length: copies }).flatMap((_, c) =>
                    row.map((r) => <ReviewChip key={`${r._id}-${c}`} r={r} />),
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-y-4 px-5 md:px-8">
            {reviews.map((r) => (
              <ReviewChip key={r._id} r={r} />
            ))}
          </div>
        )}
        {animate && (
          <>
            <span aria-hidden className="da-rail-fade da-rail-fade-left" />
            <span aria-hidden className="da-rail-fade da-rail-fade-right" />
          </>
        )}
      </div>
    </section>
  )
}

/* ---------- PLANOS ---------- */

function Plans() {
  // Cargo único: o Plus+ libera a plataforma inteira. A comparação da landing
  // é contra a conta gratuita, não contra um segundo plano pago.
  const gratuito = [
    'Conta grátis, sem cartão',
    'Provas e flashcards por IA na sua ementa',
    'Amostra do Banco de Questões',
    'Patologias liberadas do Manual Clínico',
    'Cronograma básico',
  ]
  const plus = [
    'Manual Clínico completo, com todas as funcionalidades',
    'Todos os materiais e pacotes da plataforma',
    'Banco de Questões ilimitado',
    'Provas por IA e flashcards por IA sem limite',
    'Aulas ao vivo e vídeo-aulas pós-aula',
    'Mapas mentais e cronogramas ilimitados',
  ]
  return (
    <section
      id="planos"
      className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="07 / 08" label="A oferta" />
          {/* "Suba de nível quando a prova apertar" ensinava o cliente errado:
              que o plano pago é remédio de emergência, para assinar na véspera
              e cancelar depois. O produto quer ser o ambiente normal de estudo
              — e a headline agora deixa a escolha do momento com quem paga. */}
          <h2 className="max-w-2xl font-da-display text-[2rem] font-semibold leading-[1.05] tracking-tighter md:text-5xl">
            Comece de graça. Suba de nível quando quiser.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-da-muted md:mt-5 md:text-lg">
            Antes de comparar item por item, a pergunta é mais simples: qual desses dois é você
            hoje?
          </p>
        </Reveal>
        <div className="mt-9 grid grid-cols-1 gap-5 md:mt-12 md:gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground p-6 md:p-8">
              <h3 className="font-da-display text-2xl font-semibold tracking-tight">Gratuito</h3>
              {/* Posicionamento antes da lista: a pessoa precisa saber qual dos
                  dois é ela, e só depois comparar caixinhas. */}
              <p className="mt-2 text-[15px] leading-relaxed text-da-muted md:text-base">
                Para conhecer o Domine Aqui e já começar a estudar hoje.
              </p>
              <ul className="mt-6 space-y-3">
                {gratuito.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-da-amber-soft" />
                    <span className="text-[15px] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {/* Ia para a página de compra com o rótulo "criar conta grátis":
                    o destino não correspondia à promessa do clique. */}
                <GhostCTA href={LINKS.signup} className="w-full justify-center sm:w-auto">
                  Começar grátis
                </GhostCTA>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-da-amber bg-da-tint p-6 md:p-8">
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(232,118,58,.35), transparent 70%)' }}
              />
              <div className="relative flex flex-wrap items-center gap-3">
                <h3 className="font-da-display text-2xl font-semibold tracking-tight">Plus+</h3>
                <span className="rounded-full bg-da-amber px-3 py-1 font-da-mono text-[10px] uppercase tracking-widest text-[#0B1F1A]">
                  Tudo liberado
                </span>
              </div>
              <p className="relative mt-2 text-[15px] leading-relaxed text-da-muted md:text-base">
                Para transformar a plataforma no seu ambiente completo de preparação.
              </p>
              <ul className="relative mt-6 space-y-3">
                {plus.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-da-amber-ink">
                      <IconCheck />
                    </span>
                    <span className="text-[15px] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="relative mt-8">
                <PrimaryCTA href={LINKS.buy} className="w-full justify-center sm:w-auto">
                  Ver os planos
                </PrimaryCTA>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-7 text-[15px] text-da-muted">
            Na dúvida?{' '}
            <Link
              href={LINKS.amostra}
              className="font-medium text-da-amber-ink underline underline-offset-4"
            >
              Resolva 10 questões sem cadastro
            </Link>{' '}
            e sinta a plataforma antes de decidir qualquer coisa.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- LIVRO 3D (usado no produto Prescrição Real no SUS) ---------- */

const bookStyle: CSSProperties = {
  width: 'clamp(200px, 26vw, 300px)',
  aspectRatio: '1024 / 1536',
  transformStyle: 'preserve-3d',
  transform:
    'perspective(1600px) rotateX(calc(-6deg + var(--da-my, 0) * -4deg)) rotateY(calc(28deg + var(--da-mx, 0) * 8deg))',
  transition: 'transform .2s ease-out',
}

function Book3D() {
  return (
    <div className="da-scene flex justify-center py-6">
      <div className="relative" style={bookStyle}>
        {/* capa */}
        <Image
          src={susCover}
          alt="Capa do ebook Prescrição Real no SUS, Guia Clínico Edição 2026"
          fill
          placeholder="blur"
          sizes="300px"
          className="rounded-l-[3px] rounded-r-[6px] object-cover shadow-[0_50px_90px_-30px_rgba(0,0,0,.75)]"
          style={{ transform: 'translateZ(18px)', backfaceVisibility: 'hidden' }}
        />
        {/* lombada */}
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full"
          style={{
            width: '36px',
            transform: 'rotateY(-90deg) translateZ(18px)',
            transformOrigin: 'left center',
            background: 'linear-gradient(90deg, #061512, #0B1F1A 60%, #12352b)',
            borderRight: '1px solid rgba(232,118,58,.4)',
          }}
        />
        {/* miolo de páginas */}
        <div
          aria-hidden
          className="absolute right-0 top-0 h-full"
          style={{
            width: '36px',
            transform: 'rotateY(90deg) translateZ(calc(100% - 18px))',
            transformOrigin: 'right center',
            background:
              'repeating-linear-gradient(90deg, #efe9dc, #efe9dc 1px, #d8cfba 2px, #efe9dc 3px)',
          }}
        />
        {/* sombra no chão */}
        <div
          aria-hidden
          className="absolute -bottom-10 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-[50%]"
          style={{
            background: 'radial-gradient(closest-side, rgba(232,118,58,.28), transparent)',
            filter: 'blur(8px)',
            transform: 'translateZ(-40px)',
          }}
        />
      </div>
    </div>
  )
}

/* ---------- INSTALAR APP (PWA) ---------- */

/**
 * A seção `#app` da landing.
 *
 * O miolo é o MESMO componente que a página `/instalar` renderiza — só a paleta
 * muda (`aparencia="landing"`). Antes esta seção tinha implementação própria:
 * escutava `beforeinstallprompt` num `useEffect` (que chega depois do evento e
 * o perde), tratava todo mundo como iPhone e ensinava o Compartilhar do Safari
 * a quem estava num Galaxy. Quem entrava pela home — a maioria — via a pior das
 * duas versões, e nem sabia que `/instalar` existia.
 */
function InstallApp() {
  return (
    <section
      id="app"
      className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="App" label="No seu bolso" />
        </Reveal>
        <Reveal delay={80}>
          <InstalarApp aparencia="landing" />
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- FAQ + CTA ---------- */

function FaqAndCTA({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  // FAQ aqui não é central de dúvidas: é quebra de objeção. Cada pergunta só
  // ganha o espaço se alguém realmente deixaria de criar a conta por causa
  // dela. Curiosidade que não trava ninguém vive melhor na central de ajuda.
  const faqs = [
    [
      'Preciso pagar para começar?',
      'Não. Você cria a conta grátis, sem cartão, e já entra usando. O Plus+ libera o resto quando (e se) você quiser.',
    ],
    [
      'Qual a diferença entre o grátis e o Plus+?',
      'O grátis é para conhecer a plataforma e começar a estudar: amostra do banco, patologias liberadas do Manual, cronograma básico e provas e flashcards por IA na sua ementa. O Plus+ é a plataforma inteira sem trava — Manual Clínico completo, todos os materiais, banco ilimitado, aulas, mapas mentais e cronogramas.',
    ],
    [
      'É só para aluno da minha faculdade?',
      'Não. As provas são organizadas por faculdade, mas o Manual Clínico, o banco de questões, os flashcards e as ferramentas de IA servem a qualquer estudante de Medicina, residente ou médico — e as provas por IA você gera colando a ementa do seu próprio curso.',
    ],
    [
      'Preciso instalar alguma coisa?',
      'Não. Funciona no navegador, no computador e no celular. Se quiser, dá para instalar como aplicativo na tela de início em um toque — mas é opcional.',
    ],
    [
      'Consigo estudar pelo celular?',
      'Sim, a plataforma inteira. O comum é resolver questões e revisar flashcards no celular e usar o computador para prova longa e cronograma — a conta é a mesma e o progresso acompanha você.',
    ],
    [
      'Os materiais são atualizados?',
      'São. Eles vivem dentro da plataforma, então a correção e o conteúdo novo aparecem para você no mesmo dia — sem precisar baixar nada de novo.',
    ],
    [
      'E se eu cancelar?',
      'Sua conta continua existindo e você volta para o plano gratuito, com o que ele inclui. O que é pagamento único, como o ebook do SUS, é seu para sempre.',
    ],
  ]
  return (
    <section className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40">
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-24">
        <Reveal>
          <SectionMark n="08 / 08" label="Antes de começar" />
          <h2 className="font-da-display text-[2rem] font-semibold tracking-tighter md:text-5xl">
            Perguntas justas, respostas diretas
          </h2>
        </Reveal>
        <div className="mt-8 divide-y divide-[color:var(--da-neutral-line)] md:mt-10">
          {faqs.map(([q, a], i) => (
            <Reveal key={q} delay={i * 30}>
              <Faq q={q} a={a} />
            </Reveal>
          ))}
        </div>
      </div>
      {/* Âncora da doca do celular: quando este bloco entra na tela, a barra
          fixa se apaga — dois botões dizendo a mesma coisa na mesma tela só
          fazem o visitante hesitar sobre qual dos dois é o certo. */}
      <div
        id="cta-final"
        className="relative overflow-hidden border-t border-[color:var(--da-amber-line)]"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(800px 400px at 50% 120%, rgba(232,118,58,.2), transparent 65%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-5 py-16 text-center md:px-8 md:py-28">
          <Reveal>
            <p className="font-da-mono text-[11px] uppercase tracking-[0.28em] text-da-amber-soft md:text-xs">
              Sua próxima prova começa agora
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-da-display text-[2.1rem] font-semibold leading-[1.05] tracking-tighter md:text-6xl">
              Enquanto você decide, alguém já está estudando aqui.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <PrimaryCTA
                href={signupHref}
                className="!px-8 !py-4 text-[17px] w-full justify-center sm:w-auto"
              >
                {isLoggedIn ? 'Ir para o dashboard' : 'Começar grátis'}
              </PrimaryCTA>
              {!isLoggedIn && (
                <GhostCTA
                  href={LINKS.amostra}
                  className="!px-8 !py-4 text-[17px] w-full justify-center sm:w-auto"
                >
                  Testar 10 questões
                </GhostCTA>
              )}
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 font-da-mono text-[11px] text-da-muted md:text-xs">
              Sem cartão · acesso imediato · celular e computador
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="font-da-display text-lg font-medium">{q}</span>
        <span
          className="shrink-0 text-da-amber-ink transition-transform duration-300"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0.6 }}
      >
        <div className="overflow-hidden">
          <p className="pt-3 leading-relaxed text-da-muted">{a}</p>
        </div>
      </div>
    </div>
  )
}

/* ---------- DOCA DE AÇÃO DO CELULAR ---------- */

/**
 * A barra fixa que aparece no celular assim que o hero sai da tela e some
 * quando o CTA final entra.
 *
 * O motivo é a fadiga do polegar, não a estética. No telefone esta página tem
 * vários metros de rolagem; sem a doca, quem se convence no meio do caminho
 * precisa CAÇAR um botão — rolar de volta ao topo ou até o fim. A doca
 * transforma isso em um toque, no ponto mais fácil de alcançar da tela.
 *
 * Ela se apaga sozinha em cima do CTA final para não haver dois botões
 * dizendo a mesma coisa na mesma tela, e nunca aparece no desktop, onde o
 * header já fica sempre visível.
 */
function MobileDock({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    const fim = document.getElementById('cta-final')
    if (!hero) return

    let heroFora = false
    let fimNaTela = false
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) heroFora = !entry.isIntersecting
          else fimNaTela = entry.isIntersecting
        }
        setShown(heroFora && !fimNaTela)
      },
      { threshold: 0 }
    )
    io.observe(hero)
    if (fim) io.observe(fim)
    return () => io.disconnect()
  }, [])

  return (
    <div
      data-shown={shown}
      aria-hidden={!shown}
      className="da-dock fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--da-neutral-line)] bg-da-ground/95 px-4 pt-3 backdrop-blur-md lg:hidden"
    >
      <div className="flex items-center gap-2.5">
        <PrimaryCTA
          href={signupHref}
          className="!py-3.5 flex-1 justify-center text-[15px]"
          tabIndex={shown ? undefined : -1}
        >
          {isLoggedIn ? 'Ir para o dashboard' : 'Começar grátis'}
        </PrimaryCTA>
        {!isLoggedIn && (
          <SmartLink
            href={LINKS.amostra}
            tabIndex={shown ? undefined : -1}
            className="inline-flex min-h-[48px] shrink-0 items-center rounded-full border border-[color:var(--da-neutral-line)] px-4 text-[13px] font-medium text-da-paper"
          >
            10 questões
          </SmartLink>
        )}
      </div>
    </div>
  )
}

/* ---------- RODAPÉ ---------- */

function Footer() {
  return (
    <footer className="border-t border-[color:var(--da-neutral-line)] bg-da-ground">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-14 md:px-8 md:pb-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo variant="icon" size="md" className="h-9" />
              <span className="font-da-display text-lg font-semibold tracking-tight">Domine Aqui</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-da-muted">
              Educação em saúde com foco em Medicina. Ferramentas interativas para estudar de forma
              ativa, não passiva.
            </p>
            <FooterSocial />
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterCol
              title="Plataforma"
              links={[
                ['Manual Clínico', LINKS.manual],
                ['Provas', LINKS.provas],
                ['Flashcards', LINKS.flashcards],
                ['Mapas mentais', LINKS.mapaMental],
              ]}
            />
            <FooterCol
              title="Materiais"
              links={[
                ['Todos os materiais', LINKS.materiais],
                ['Cronogramas', LINKS.cronogramas],
                ['Prescrição no SUS', LINKS.sus],
              ]}
            />
            <FooterCol
              title="Domine Aqui"
              links={[
                ['Amostra grátis', LINKS.amostra],
                ['Assinar', LINKS.buy],
                ['Equipe', LINKS.equipe],
                ['Suporte', LINKS.suporte],
              ]}
            />
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--da-neutral-line)] pt-6 text-xs text-da-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Domine Aqui. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              href={LINKS.termos}
              className="inline-flex min-h-[44px] items-center transition hover:text-da-paper"
            >
              Termos de Serviço
            </Link>
            <Link
              href={LINKS.privacidade}
              className="inline-flex min-h-[44px] items-center transition hover:text-da-paper"
            >
              Política de Privacidade
            </Link>
            <span className="font-da-mono">domineaqui.com.br</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-da-mono text-[11px] uppercase tracking-[0.22em] text-da-amber-soft">
        {title}
      </p>
      {/* Alvo de 44px de altura em cada link. Antes eram 17px empilhados a 10px
          de distância: no celular, as duas colunas do rodapé viravam um campo
          minado de links vizinhos. */}
      <ul className="mt-2 flex flex-col">
        {links.map(([l, href]) => (
          <li key={l}>
            <SmartLink
              href={href}
              className="flex min-h-[44px] items-center text-[15px] text-da-muted transition hover:text-da-paper"
            >
              {l}
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* Canais de comunicação — WhatsApp · E-mail · Discord · Instagram */
const SOCIALS: { label: string; href: string; hover: string; icon: ReactNode }[] = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/5524992230908?text=Ol%C3%A1%2C%20estou%20em%20contato%20com%20o%20WhatsApp%20da%20plataforma%20DomineAqui%21',
    hover: 'hover:border-[#25D366]/60 hover:text-[#25D366]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    label: 'E-mail',
    href: 'mailto:contato@domineaqui.com.br',
    hover: 'hover:border-da-amber/60 hover:text-da-amber-ink',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/vdfHcvDdMw',
    hover: 'hover:border-[#5865F2]/60 hover:text-[#5865F2]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/domineaqui.br',
    hover: 'hover:border-[#E4405F]/60 hover:text-[#E4405F]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

function FooterSocial() {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2.5">
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--da-neutral-line)] text-da-muted transition ${s.hover}`}
        >
          {s.icon}
        </a>
      ))}
    </div>
  )
}
