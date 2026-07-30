'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

// Import estático: o Next lê as dimensões no build (zero layout shift) e gera o
// blurDataURL embutido — as fotos aparecem borradas na hora em vez de deixar um
// buraco na tela enquanto baixam. Só nos JPEG opacos: nos PNG com transparência
// o placeholder viraria um retângulo cinza por cima do recorte.
import heroBg from '@/public/landing/hero-bg.jpg'
import heroMidLight from '@/public/landing/hero-mid-light.png'
import heroMid from '@/public/landing/hero-mid.png'
import heroFront from '@/public/landing/hero-front.png'
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
function useParallaxVars<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        opacity: shown ? 1 : 0.001,
        filter: shown ? 'blur(0)' : 'blur(5px)',
        transition: `transform .7s cubic-bezier(.2,.7,.2,1) ${delay}ms, opacity .7s ease ${delay}ms, filter .7s ease ${delay}ms`,
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

const st = {
  fill: 'none',
  stroke: '#E8763A',
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
}: {
  children: ReactNode
  className?: string
  href: string
}) {
  return (
    <SmartLink
      href={href}
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
        'group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-da-amber/60 px-7 py-3.5 font-da-display font-semibold text-da-amber transition active:scale-[0.98] ' +
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

function TextLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <SmartLink
      href={href}
      className="group inline-flex items-center gap-1.5 font-da-mono text-sm text-da-amber"
    >
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
        {children}
      </span>
      <span aria-hidden>→</span>
    </SmartLink>
  )
}

/** Marcador editorial de seção: 01 / 06 com a régua. */
function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-da-mono text-xs text-da-amber">{n}</span>
      <span className="h-px flex-1 bg-[color:var(--da-neutral-line)]" />
      <span className="font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-muted">
        {label}
      </span>
    </div>
  )
}

/* =================== PÁGINA =================== */

export interface LandingPageProps {
  initialIsLoggedIn?: boolean
}

export default function LandingPage({ initialIsLoggedIn }: LandingPageProps) {
  const router = useRouter()
  const rootRef = useParallaxVars<HTMLDivElement>()
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn ?? false)

  // Ao voltar pelo botão do navegador, a landing pode ser restaurada do
  // back-forward cache (bfcache) com o estado congelado em "deslogado"
  // (isLoggedIn capturado no SSR), mesmo com a sessão ainda válida. Um reload
  // força app/page.tsx (force-dynamic) a reavaliar getSession() e redirecionar
  // quem está logado. Não há loop: um load fresco tem persisted=false.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    // Verificação de auth no cliente — SEMPRE. O cookie de sessão usa
    // SameSite=strict (lib/auth.ts), então numa navegação de nível superior
    // vinda de outro site (e-mail, WhatsApp, Instagram, Google, bookmark...) o
    // cookie NÃO acompanha o request do SSR: getSession() vê null e a landing
    // renderiza como "deslogado" mesmo com sessão válida. Um fetch same-site
    // para /api/auth/me envia o cookie e revela o estado real.
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => {
        if (cancelled) return
        if (r.ok) {
          // Sessão válida que o SSR não enxergou. Espelha app/page.tsx: logado
          // sem ?landing=true vai direto pro dashboard.
          const forceLanding =
            new URLSearchParams(window.location.search).get('landing') === 'true'
          if (!initialIsLoggedIn && !forceLanding) {
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
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signupHref = isLoggedIn ? '/dashboard' : '/auth/login?mode=register'

  return (
    <div
      ref={rootRef}
      className="da-landing relative overflow-x-clip bg-da-ground font-da-body text-da-paper"
    >
      <Nav signupHref={signupHref} isLoggedIn={isLoggedIn} />
      <Hero signupHref={signupHref} isLoggedIn={isLoggedIn} />
      <Marquee />
      <SampleBand />
      <PlatformOverview />
      <ProblemBand />
      <ManualClinico />
      <ManualEletro />
      <ToolsConsole />
      <Differentiators />
      <Plans />
      <Prescricao />
      <InstallApp />
      <FaqAndCTA signupHref={signupHref} isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  )
}

/* ---------- NAV ---------- */

function Nav({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [menuOpen])

  const navLinks = [
    { label: 'Plataforma', href: '#plataforma' },
    { label: 'Manual Clínico', href: '#manual' },
    { label: 'Materiais', href: LINKS.materiais },
    { label: 'Planos', href: '#planos' },
    { label: 'App', href: '#app' },
  ]

  return (
    <header
      className={
        'pwa-safe-top fixed inset-x-0 top-0 z-50 transition-colors duration-300 ' +
        (solid
          ? 'border-b border-[color:var(--da-neutral-line)] bg-da-ground/85 backdrop-blur-md'
          : '')
      }
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Domine Aqui">
          <Logo variant="icon" size="md" className="h-9" />
          <span className="font-da-display text-lg font-semibold tracking-tight">Domine Aqui</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((l) => (
            <SmartLink
              key={l.label}
              href={l.href}
              className="text-sm text-da-muted transition hover:text-da-paper"
            >
              {l.label}
            </SmartLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Botão redondo da landing: tailwind-merge deixa estas classes
              sobrescreverem o visual padrão (quadrado, bg-card) do app. */}
          <ThemeToggle
            variant="icon"
            className="h-10 w-10 rounded-full border-[color:var(--da-neutral-line)] bg-transparent text-da-paper shadow-none transition hover:border-da-amber/50 hover:bg-da-panel/40 active:scale-95"
          />
          {!isLoggedIn && (
            <SmartLink
              href="/auth/login"
              className="hidden text-sm font-medium text-da-muted transition hover:text-da-paper sm:inline-flex"
            >
              Entrar
            </SmartLink>
          )}
          <PrimaryCTA href={signupHref} className="!hidden !px-5 !py-2.5 text-sm sm:!inline-flex">
            {isLoggedIn ? 'Ir para o dashboard' : 'Criar conta grátis'}
          </PrimaryCTA>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--da-neutral-line)] text-da-paper transition hover:border-da-amber/50 lg:hidden"
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
        <div className="border-t border-[color:var(--da-neutral-line)] bg-da-ground/95 backdrop-blur-md lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3 md:px-8">
            {navLinks.map((l) => (
              <SmartLink
                key={l.label}
                href={l.href}
                className="border-b border-[color:var(--da-neutral-line)] py-3.5 text-sm text-da-muted transition last:border-b-0 hover:text-da-paper"
              >
                {l.label}
              </SmartLink>
            ))}
            <div className="flex flex-col gap-3 pb-2 pt-4 sm:hidden">
              {!isLoggedIn && (
                <SmartLink
                  href="/auth/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--da-neutral-line)] px-5 py-2.5 text-sm font-medium text-da-paper transition hover:border-da-amber/50"
                >
                  Entrar
                </SmartLink>
              )}
              <PrimaryCTA href={signupHref} className="w-full">
                {isLoggedIn ? 'Ir para o dashboard' : 'Criar conta grátis'}
              </PrimaryCTA>
            </div>
          </nav>
        </div>
      )}
    </header>
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
const heroFrontStyle: CSSProperties = {
  transform:
    'translate3d(calc(var(--da-mx, 0) * 42px), calc(var(--da-my, 0) * 30px - var(--da-sy, 0) * 0.1px), 0)',
}

function Hero({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  return (
    <section id="top" className="pwa-safe-hero da-scene relative min-h-dvh overflow-hidden pt-[72px]">
      <div className="pointer-events-none absolute inset-0" style={heroBgStyle}>
        <Image
          src={heroBg}
          alt=""
          aria-hidden
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover opacity-30"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgb(var(--da-ground)) 0%, rgb(var(--da-ground) / 0.82) 42%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ background: 'linear-gradient(0deg, rgb(var(--da-ground)), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(1000px 600px at 82% 30%, rgba(232,118,58,.14), transparent 60%)',
        }}
      />

      {/* faixa editorial do topo */}
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-center gap-4 border-b border-[color:var(--da-neutral-line)] py-3 font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-muted">
          <span className="text-da-amber">Domine Aqui</span>
          <span className="hidden sm:inline">Educação médica de precisão</span>
          <span className="ml-auto hidden items-center gap-2 sm:flex">
            <IconPulse /> Estudantes · Residentes · Médicos
          </span>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-10 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div className="relative z-10 max-w-2xl">
          <Reveal>
            <p className="font-da-mono text-xs uppercase tracking-[0.28em] text-da-amber">
              Feito pra quem não tem tempo a perder
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 font-da-display text-[2.7rem] font-semibold leading-[0.98] tracking-tighter md:text-[4.4rem]">
              Tudo pra passar
              <br />
              na prova. Num lugar só.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-da-muted">
              Você abre e o próximo passo já está na sua frente. Manual Clínico, questões,
              flashcards e cronograma prontos — sem decidir por onde começar, sem dez abas
              abertas, sem aquela sensação de que não vai dar conta.
            </p>
          </Reveal>
          <Reveal delay={240}>
            {/* Dois botões grandes, do mesmo tamanho: criar conta e entrar. Alvos
                de toque generosos — o comprador impaciente não caça link pequeno. */}
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <PrimaryCTA
                href={signupHref}
                className="!px-9 !py-4 text-lg w-full justify-center sm:w-auto"
              >
                {isLoggedIn ? 'Ir para o dashboard' : 'Criar minha conta grátis'}
              </PrimaryCTA>
              {!isLoggedIn && (
                <GhostCTA
                  href="/auth/login"
                  className="!px-9 !py-4 text-lg w-full justify-center sm:w-auto"
                >
                  Já tenho conta
                </GhostCTA>
              )}
            </div>
            <p className="mt-4 font-da-mono text-xs text-da-muted">
              Leva 10 segundos. Sem cartão. Sem pegadinha.
            </p>
          </Reveal>
        </div>

        <div className="relative">
          <div className="relative aspect-square w-full">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem]"
              style={{
                background: 'radial-gradient(60% 60% at 50% 45%, rgba(232,118,58,.2), transparent 70%)',
              }}
            />
            {/* Duas artes (clara/escura) trocadas por CSS: sem flash na primeira
                pintura e sem depender do mount do JS pra saber o tema. */}
            <div className="absolute inset-0 z-10 dark:hidden" style={heroMidStyle}>
              <Image
                src={heroMidLight}
                alt="Ecossistema do Domine Aqui: Manual Clínico, flashcards, provas, banco de questões, cronograma e ECG conectados"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.5)]"
              />
            </div>
            <div className="absolute inset-0 z-10 hidden dark:block" style={heroMidStyle}>
              <Image
                src={heroMid}
                alt="Ecossistema do Domine Aqui: Manual Clínico, flashcards, provas, banco de questões, cronograma e ECG conectados"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,.5)]"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 z-20" style={heroFrontStyle}>
              <Image
                src={heroFront}
                alt=""
                aria-hidden
                fill
                // Sem `priority`: esta arte é puramente decorativa (aria-hidden)
                // e 280KB dela competiam em prioridade máxima com o LCP real e
                // com o preload das fontes. Continua carregando junto do hero,
                // só deixa de disputar a frente da fila em rede móvel.
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-contain"
              />
            </div>
            <div
              className="absolute right-2 top-4 z-30 hidden rounded-xl border border-[color:var(--da-amber-line)] bg-[color:var(--da-glass)] px-4 py-3 backdrop-blur-sm lg:block"
              style={{
                transform:
                  'translate3d(calc(var(--da-mx, 0) * 34px), calc(var(--da-my, 0) * -22px), 0)',
              }}
            >
              <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber">
                Interativo
              </p>
              <p className="mt-1 text-xs">Som, imagem e camadas</p>
            </div>
            <div
              className="absolute -right-1 bottom-6 z-30 hidden rounded-xl border border-[color:var(--da-amber-line)] bg-[color:var(--da-glass)] px-4 py-3 backdrop-blur-sm lg:block"
              style={{
                transform:
                  'translate3d(calc(var(--da-mx, 0) * 40px), calc(var(--da-my, 0) * 28px), 0)',
              }}
            >
              <p className="font-da-mono text-[10px] uppercase tracking-widest text-da-amber">
                Por IA
              </p>
              <p className="mt-1 text-xs">Na sua ementa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pista de rolagem: muito visitante de anúncio não percebe que a página
          continua abaixo da dobra. Uma seta que pulsa (e leva pra próxima seção
          num toque) resolve sem exigir que ele "descubra" o scroll. */}
      <div className="relative mx-auto mb-2 mt-4 flex max-w-7xl justify-center px-5 md:px-8">
        <a
          href="#plataforma"
          aria-label="Ver a plataforma"
          className="group inline-flex flex-col items-center gap-1 text-da-muted transition hover:text-da-amber"
        >
          <span className="font-da-mono text-[10px] uppercase tracking-[0.3em]">
            Role para ver tudo
          </span>
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

      {/* trilho de números */}
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[color:var(--da-neutral-line)] bg-[color:var(--da-neutral-line)] sm:grid-cols-4">
          {[
            ['300+', 'patologias no Manual'],
            ['6', 'produtos integrados'],
            ['Provas', 'reais da sua faculdade'],
            ['Grátis', 'para começar hoje'],
          ].map(([n, l]) => (
            <div key={l} className="bg-da-ground p-5">
              <dt className="font-da-display text-2xl font-semibold">{n}</dt>
              <dd className="mt-1 font-da-mono text-[11px] leading-tight text-da-muted">{l}</dd>
            </div>
          ))}
        </dl>
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
  return (
    <div className="relative overflow-hidden border-y border-[color:var(--da-neutral-line)] bg-da-panel/40 py-4">
      <div className="da-marquee-track flex w-max gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-da-mono text-xs uppercase tracking-[0.2em] text-da-muted"
          >
            {t}
            <span className="text-da-amber">/</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- PLATAFORMA ---------- */

function PlatformOverview() {
  const modules: [ReactNode, string, string][] = [
    [<IconManual key="i" />, 'Manual Clínico', '300+ patologias com imagem, áudio e referência. Com teste grátis.'],
    [<IconCheck key="i" />, 'Provas da Faculdade', 'As provas reais do seu curso, prontas para resolver e treinar.'],
    [<IconCards key="i" />, 'Flashcards próprios', 'Decks feitos por especialistas, com repetição espaçada.'],
    [<IconMap key="i" />, 'Mapas mentais', 'Editor visual para criar, conectar e compartilhar suas ideias.'],
    [<IconBank key="i" />, 'Banco de Questões', 'Uso ilimitado no Plus+.'],
    [<IconPulse key="i" />, 'Manual do Eletro', 'Exclusivo de quem assina o Manual Clínico. Treina o raciocínio do traçado.'],
  ]
  return (
    <section id="plataforma" className="relative border-t border-[color:var(--da-neutral-line)]">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="01 / 06" label="A plataforma" />
          <h2 className="max-w-3xl font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
            Seis ferramentas. Um lugar. Zero abas perdidas.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-da-muted">
            Cada produto resolve um buraco que a faculdade deixa. Juntos, viram um ecossistema que
            você não consegue mais largar.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 divide-y divide-[color:var(--da-neutral-line)] border-y border-[color:var(--da-neutral-line)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
          {modules.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={i * 50}>
              <article className="group flex h-full flex-col border-[color:var(--da-neutral-line)] p-7 transition-colors hover:bg-da-panel/40 sm:min-h-[220px] sm:[&:nth-child(odd)]:border-r lg:[&:not(:nth-child(3n))]:border-r">
                <div className="flex items-center justify-between">
                  <span className="text-da-amber">{icon}</span>
                  <span className="font-da-mono text-[10px] text-da-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-da-display text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-da-muted">{desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- O PROBLEMA ---------- */

function ProblemBand() {
  return (
    <section className="relative overflow-hidden border-t border-[color:var(--da-neutral-line)]">
      <Image
        src={ausculta}
        alt=""
        aria-hidden
        fill
        placeholder="blur"
        sizes="100vw"
        className="object-cover opacity-40"
      />
      <div aria-hidden className="absolute inset-0 bg-da-ground/75" />
      <div className="relative mx-auto max-w-5xl px-5 py-24 md:px-8 md:py-32">
        <Reveal>
          <p className="font-da-mono text-xs uppercase tracking-[0.28em] text-da-amber">
            O problema que ninguém te conta
          </p>
          <h2 className="mt-5 max-w-3xl font-da-display text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            O material que você baixou hoje já morreu na pasta de Downloads.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-da-muted">
            Você abre o PDF, lê metade, fecha e nunca mais volta. Junta cinco fontes, cada uma pela
            metade, e ainda sai com dúvida na véspera da prova. O problema nunca foi você. Foi
            estudar com material morto. Aqui é o contrário: tudo é interativo, tudo tem som, imagem e
            profundidade, e tudo continua vivo dentro da plataforma no dia que você mais precisa.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- MANUAL CLÍNICO ---------- */

function ManualClinico() {
  const features = [
    'Classificação, etiologia, fisiopatologia e farmacologia, aprofundadas sem lacuna',
    'Os sopros cardíacos e a ausculta pulmonar tocam de verdade, dentro do card',
    'As lesões você vê em foto clínica, da erisipela à dermatologia, com referência',
    'Atualizado de momento em momento, sem aquele tópico raso com pontinho de IA',
  ]
  return (
    <section id="manual" className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionMark n="02 / 06" label="Carro-chefe" />
      </Reveal>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <Image
            src={logoManual}
            alt="Manual Clínico"
            sizes="160px"
            className="mb-6 h-16 w-auto"
          />
          <h2 className="font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
            Cinco livros abertos. Uma busca só.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-da-muted">
            Mais de 300 patologias, cada uma destrinchada na profundidade que a prova e o plantão
            exigem. Você digita a doença e vê tudo, do mecanismo à conduta. O aluno que precisava de
            cinco livros na mesa agora precisa de uma aba. E dá para experimentar com o teste grátis
            antes de assinar.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-da-amber">
                  <IconLayers />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <GhostCTA href={LINKS.manual}>Abrir o Manual Clínico</GhostCTA>
            <span className="font-da-mono text-xs text-da-muted">Teste grátis disponível</span>
          </div>
        </Reveal>
        <Reveal delay={120} className="order-1 lg:order-2">
          <TiltCard intensity={5}>
            <figure className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem]"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(232,118,58,.18), transparent 70%)',
                }}
              />
              <Image
                src={manualImg}
                alt="Camadas de vidro do dossiê clínico com lesão, pulmão e miniaturas de patologia"
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="relative w-full rounded-2xl border border-[color:var(--da-amber-line)]"
              />
            </figure>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- AMOSTRA GRÁTIS ---------- */

function SampleBand() {
  return (
    <section className="relative border-t border-[color:var(--da-neutral-line)]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-da-amber/50 bg-da-tint/40 p-8 md:p-10">
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,118,58,.3), transparent 70%)' }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--da-amber-line)] px-3 py-1 font-da-mono text-[10px] uppercase tracking-widest text-da-amber">
                <IconPulse /> Amostra grátis · sem cadastro
              </span>
              <h2 className="mt-4 font-da-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                10 questões comentadas para testar agora
              </h2>
              <p className="mt-3 leading-relaxed text-da-muted">
                Responda, veja o gabarito na hora e leia o comentário. É só uma fatia do banco. A
                plataforma completa tem provas, flashcards, cronograma e o Manual Clínico esperando
                você do outro lado.
              </p>
            </div>
            <div className="shrink-0">
              <PrimaryCTA href={LINKS.amostra}>Ver 10 questões sem cadastro</PrimaryCTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MANUAL DO ELETRO ---------- */

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

function ManualEletro() {
  return (
    <section className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="Plus+" label="Exclusivo de assinante" />
        </Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <>
              {/* Bem abaixo da dobra: `lazy` evita que estas duas artes
                  (~250KB somadas) disputem banda com o hero na primeira
                  pintura. Continuam trocando por CSS conforme o tema. */}
              <img
                src="/img/eletro/manual-eletrocardiograma-light.webp"
                alt="Manual do Eletrocardiograma"
                width={958}
                height={461}
                loading="lazy"
                decoding="async"
                className="mb-6 block h-auto w-full max-w-[300px] dark:hidden md:max-w-[360px]"
              />
              <img
                src="/img/eletro/manual-eletrocardiograma-dark.webp"
                alt="Manual do Eletrocardiograma"
                width={958}
                height={461}
                loading="lazy"
                decoding="async"
                className="mb-6 hidden h-auto w-full max-w-[300px] dark:block md:max-w-[360px]"
              />
            </>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--da-amber-line)] px-3 py-1 font-da-mono text-[10px] uppercase tracking-widest text-da-amber">
              <IconPulse /> Incluso só no Manual Clínico
            </span>
            <h2 className="mt-5 font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
              O que esse traçado está te dizendo?
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-da-muted">
              Tem uma pergunta que todo preceptor faz e que a maioria trava na resposta. Não é sobre
              decorar o nome da arritmia. É sobre entender a história que o coração está contando ali
              no papel. Isso não se decora, se treina.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-da-muted">
              O Manual do Eletrocardiograma treina exatamente esse raciocínio, do ritmo normal à
              emergência. Ele é exclusivo de quem assina o Manual Clínico, então não entra no teste
              grátis. É o tipo de conteúdo que separa quem lê ECG de quem adivinha.
            </p>
            <div className="mt-9">
              <PrimaryCTA href={LINKS.manual}>Assinar o Manual Clínico</PrimaryCTA>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <PhoneMockup />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------- CONSOLE DE FERRAMENTAS ---------- */

const TOOL_CHANNELS = [
  {
    key: 'provas-fac',
    label: 'Provas da Faculdade',
    reading: 'PROVAS REAIS',
    title: 'As provas da sua faculdade, no site',
    desc: 'As provas que a sua faculdade já aplicou, prontas para você resolver e treinar do jeito que cai de verdade. Faça quantas quiser. Baixe em PDF sendo assinante.',
    img: provas3d,
    cta: 'Resolver provas',
    stat: 'Provas oficiais',
    href: LINKS.provas,
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    reading: 'REPETIÇÃO ESPAÇADA',
    title: 'Flashcards próprios do Domine Aqui',
    desc: 'Decks de anatomia e além, criados e revisados por quem entende, com repetição espaçada que finca o conteúdo na memória de longo prazo. À venda no site, prontos para usar.',
    img: flashcards3d,
    cta: 'Ver os flashcards',
    stat: 'Feitos por especialistas',
    href: LINKS.flashcards,
  },
  {
    key: 'mapas',
    label: 'Mapas mentais',
    reading: 'EDITOR VISUAL',
    title: 'Pense em rede, não em lista',
    desc: 'Um editor visual rápido para criar, conectar e compartilhar suas ideias. Deixe públicos, envie por link ou proteja com senha. A anatomia do seu raciocínio, desenhada. Teste um mapa de graça.',
    img: flashcards3d,
    cta: 'Testar um mapa grátis',
    stat: 'Público, link ou senha',
    href: LINKS.mapaMental,
  },
  {
    key: 'banco',
    label: 'Banco de Questões',
    reading: 'USO ILIMITADO',
    title: 'Banco de Questões sem limite',
    desc: 'Milhares de questões para resolver à vontade, no Plus+. Errar aqui é de graça. Errar na prova custa o ano inteiro.',
    img: provas3d,
    cta: 'Entrar no banco',
    stat: 'Ilimitado',
    href: LINKS.bancoQuestoes,
  },
  {
    key: 'ia',
    label: 'Provas e Flashcards por IA',
    reading: 'NO TESTE GRÁTIS',
    title: 'Gerados por IA na sua ementa',
    desc: 'Precisa de algo sob medida? A IA monta provas e flashcards a partir do conteúdo exato do seu curso. Disponível já no acesso gratuito, para você experimentar antes de assinar.',
    img: flashcards3d,
    cta: 'Testar de graça',
    stat: 'Incluso no grátis',
    href: LINKS.amostra,
  },
  {
    key: 'cronograma',
    label: 'Cronograma',
    reading: 'VINCULADO AO CURSO',
    title: 'Cronograma da sua faculdade',
    desc: 'Um plano de estudo vinculado ao ritmo real do seu curso. Você abre e sabe exatamente o que estudar hoje, sem perder tempo decidindo por onde começar.',
    img: flashcards3d,
    cta: 'Montar cronograma',
    stat: 'No seu ritmo',
    href: LINKS.cronogramas,
  },
]

function ToolsConsole() {
  const [active, setActive] = useState(0)
  const ch = TOOL_CHANNELS[active]
  return (
    <section
      id="ferramentas"
      className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="03 / 06" label="Estudo ativo" />
          <h2 className="max-w-2xl font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
            Treine nas provas de verdade. Não em simulado genérico.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-da-muted">
            Sintonize o canal e veja o que cada instrumento faz por você.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-[color:var(--da-amber-line)] bg-da-ground">
            <div className="flex items-center gap-3 border-b border-[color:var(--da-neutral-line)] px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-da-amber" />
              <span className="font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-muted">
                Domine Aqui · console de ferramentas
              </span>
              <span className="ml-auto hidden font-da-mono text-[10px] text-da-amber sm:block">
                {ch.reading}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
              <div className="flex flex-row overflow-x-auto border-b border-[color:var(--da-neutral-line)] [scrollbar-width:none] lg:flex-col lg:border-b-0 lg:border-r [&::-webkit-scrollbar]:hidden">
                {TOOL_CHANNELS.map((c, i) => {
                  const on = i === active
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setActive(i)}
                      className={
                        'group flex shrink-0 items-center gap-3 px-5 py-4 text-left transition-colors lg:border-b lg:border-[color:var(--da-neutral-line)] ' +
                        (on ? 'bg-da-panel/60' : 'hover:bg-da-panel/30')
                      }
                    >
                      <span className={'font-da-mono text-xs ' + (on ? 'text-da-amber' : 'text-da-muted')}>
                        0{i + 1}
                      </span>
                      <span
                        className={
                          'whitespace-nowrap font-da-display text-sm font-medium ' +
                          (on ? 'text-da-paper' : 'text-da-muted')
                        }
                      >
                        {c.label}
                      </span>
                      <span
                        className={
                          'ml-auto hidden transition-transform lg:block ' +
                          (on ? 'translate-x-0 text-da-amber opacity-100' : '-translate-x-1 opacity-0')
                        }
                        aria-hidden
                      >
                        →
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                key={ch.key}
                className="da-panel-fade relative grid grid-cols-1 gap-6 p-7 md:grid-cols-[1fr_240px] md:p-9"
              >
                <div className="flex flex-col justify-center">
                  <span className="font-da-mono text-[10px] uppercase tracking-[0.3em] text-da-amber">
                    {ch.reading}
                  </span>
                  <h3 className="mt-3 font-da-display text-2xl font-semibold tracking-tight md:text-3xl">
                    {ch.title}
                  </h3>
                  <p className="mt-3 max-w-md leading-relaxed text-da-muted">{ch.desc}</p>
                  <div className="mt-6 flex items-center gap-5">
                    <TextLink href={ch.href}>{ch.cta}</TextLink>
                    <span className="font-da-mono text-xs text-da-muted">· {ch.stat}</span>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(60% 55% at 50% 50%, rgba(232,118,58,.16), transparent 70%)',
                    }}
                  />
                  <Image
                    src={ch.img}
                    alt={ch.title}
                    sizes="240px"
                    className="relative z-10 max-h-[240px] w-auto object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,.5)]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[color:var(--da-neutral-line)] px-5 py-3">
              <svg
                viewBox="0 0 1200 24"
                className="h-5 w-full"
                preserveAspectRatio="none"
                fill="none"
                stroke="#E8763A"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
                aria-hidden
              >
                <path d="M0 12h420l10-8 12 16 10-8h30l8-10 10 20 8-10h520l10-6 12 12 10-6h108" />
              </svg>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- DIFERENCIAIS ---------- */

function Differentiators() {
  const items = [
    [
      'Vive dentro, não na sua caixa de e-mail',
      'O Manual, o eletro e os flashcards não têm botão de download. Você entra para usar, e é isso que constrói o hábito que passa você de ano.',
    ],
    [
      'Interação, não decoração',
      'Sons de ausculta, coração em wireframe, camadas de patologia. Você opera a ferramenta com a mão, não assiste de braços cruzados.',
    ],
    [
      'Moldado na sua ementa',
      'Flashcards e provas por IA montados sobre o que a sua faculdade cobra de verdade. Não um genérico que serve pra todo mundo e pra ninguém.',
    ],
    [
      'Difícil de copiar, fácil de amar',
      'Ferramenta interativa que os gigantes ainda não fizeram. O tipo de diferencial que prende, não a commodity que qualquer PDF entrega.',
    ],
  ]
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionMark n="04 / 06" label="Diferencial" />
        <h2 className="max-w-3xl font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
          O que uma plataforma viva faz e um arquivo morto nunca vai fazer
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[color:var(--da-neutral-line)] bg-[color:var(--da-neutral-line)] md:grid-cols-2">
        {items.map(([t, d], i) => (
          <Reveal key={t} delay={i * 70}>
            <article className="flex h-full flex-col bg-da-ground p-8 transition-colors hover:bg-da-panel/40">
              <span className="font-da-mono text-sm text-da-amber">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-da-display text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-3 text-da-muted">{d}</p>
            </article>
          </Reveal>
        ))}
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
    'Provas e flashcards para experimentar',
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
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="05 / 06" label="Planos" />
          <h2 className="max-w-2xl font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
            Comece de graça. Suba de nível quando a prova apertar.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground p-8">
              <h3 className="font-da-display text-2xl font-semibold tracking-tight">Gratuito</h3>
              <p className="mt-2 text-da-muted">Para sentir a plataforma antes de pagar.</p>
              <ul className="mt-7 space-y-3">
                {gratuito.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-da-amber" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <GhostCTA href={LINKS.buy}>Criar conta grátis</GhostCTA>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-da-amber bg-da-tint p-8">
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(232,118,58,.35), transparent 70%)' }}
              />
              <div className="relative flex items-center gap-3">
                <h3 className="font-da-display text-2xl font-semibold tracking-tight">Plus+</h3>
                <span className="rounded-full bg-da-amber px-3 py-1 font-da-mono text-[10px] uppercase tracking-widest text-[#0B1F1A]">
                  Tudo liberado
                </span>
              </div>
              <p className="mt-2 text-da-muted">A plataforma inteira, sem trava. Um plano só.</p>
              <ul className="relative mt-7 space-y-3">
                {plus.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-da-amber">
                      <IconCheck />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="relative mt-8">
                <PrimaryCTA href={LINKS.buy}>Assinar Plus+</PrimaryCTA>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-8 font-da-mono text-sm text-da-muted">
            Na dúvida?{' '}
            <Link href={LINKS.amostra} className="text-da-amber underline underline-offset-4">
              veja 10 questões sem cadastro
            </Link>{' '}
            e sinta a plataforma antes de pagar.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- PRESCRIÇÃO NO SUS ---------- */

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

function Prescricao() {
  return (
    <section id="sus" className="relative border-t border-[color:var(--da-neutral-line)]">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal>
          <SectionMark n="Bônus" label="Manual de guerra" />
        </Reveal>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="order-2 lg:order-1">
            <Book3D />
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="font-da-mono text-lg text-da-muted line-through">R$147</span>
                <span className="font-da-display text-4xl font-semibold tracking-tighter text-da-amber">
                  R$47
                </span>
              </div>
              <p className="mt-2 font-da-mono text-xs text-da-muted">
                330 páginas · pagamento único · seu para sempre
              </p>
              <div className="mt-6 flex justify-center">
                <GhostCTA href={LINKS.sus}>Conhecer o Ebook</GhostCTA>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120} className="order-1 lg:order-2">
            <h2 className="font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
              O único material que você vai querer que seja um PDF.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-da-muted">
              Sentiu aquela sensação de abrir o guideline e ver um remédio que não existe na farmácia
              do posto? Ela some quando você tem um manual escrito para a realidade do SUS, não para
              a prova. Este não morre na pasta de Downloads. Ele vive no bolso do seu jaleco, aberto
              às três da manhã na UPA lotada.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-da-muted">
              Prescrição Real traz as 50 queixas mais comuns, os medicamentos reais da REMUME, as
              doses e o plano B para quando falta o ideal. Do soro na diarreia à manobra de Epley na
              vertigem, do captopril que se engole e nunca é sublingual à adrenalina que muda o
              desfecho. 330 páginas, 100% REMUME e SUS. Prescrever bem não é saber o melhor remédio
              do mundo. É saber o melhor que existe na prateleira hoje, e o que fazer quando nem esse
              existe.
            </p>
            <p className="mt-6 font-da-display text-lg font-medium text-da-amber">
              De colega para colega.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------- INSTALAR APP (PWA) ---------- */

// Evento beforeinstallprompt (Chrome/Android/desktop). Tipado localmente porque
// não faz parte da lib DOM padrão.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function InstallShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

function InstallPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function InstallRocketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 014-9 11.5 11.5 0 015 5 22 22 0 01-9 4z" />
      <path d="M9 12H4s.55-3.03 2-4a5 5 0 014-1" />
      <path d="M12 15v5s3.03-.55 4-2a5 5 0 001-4" />
    </svg>
  )
}

function InstallApp() {
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const iOS =
      /iPhone|iPod|iPad/.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
    setIsIos(iOS)

    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches === true
    if (isStandalone) setInstalled(true)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const steps: [ReactNode, string, string][] = [
    [
      <InstallShareIcon key="i" />,
      'Toque em Compartilhar',
      'Na barra do Safari, toque no ícone de compartilhar (o quadrado com a seta para cima).',
    ],
    [
      <InstallPlusIcon key="i" />,
      'Adicionar à Tela de Início',
      'Role a lista de opções e escolha “Adicionar à Tela de Início”. Confirme em Adicionar.',
    ],
    [
      <InstallRocketIcon key="i" />,
      'Abra como app',
      'O ícone do DomineAqui aparece na sua tela. Abra e use em tela cheia, como um aplicativo.',
    ],
  ]

  return (
    <section
      id="app"
      className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <Reveal>
            <SectionMark n="App" label="No seu bolso" />
            <h2 className="font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-5xl">
              Leve o DomineAqui no bolso.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-da-muted">
              Instale a plataforma como um aplicativo no seu iPhone em segundos —
              sem App Store, sem download pesado, sem ocupar espaço. Abre em tela
              cheia, com ícone próprio e a mesma velocidade do site.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {!isIos && deferredPrompt && !installed && (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-da-amber px-7 py-3.5 font-da-display font-semibold text-[#0B1F1A] transition-[transform,box-shadow] duration-200 hover:shadow-[0_0_34px_-6px_rgba(232,118,58,.7)] active:scale-[0.98]"
                >
                  Instalar o app
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 3v12M7 10l5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                </button>
              )}
              {installed && (
                <span className="inline-flex items-center gap-2 rounded-full border border-da-amber/50 px-5 py-2.5 font-da-mono text-sm text-da-amber">
                  ✓ App instalado
                </span>
              )}
              {!installed && (
                <span className="font-da-mono text-xs text-da-muted">
                  {isIos
                    ? 'iPhone: siga os 3 passos ao lado →'
                    : deferredPrompt
                      ? 'Grátis · instala em segundos'
                      : 'Android: menu do navegador → “Instalar app”'}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ol className="space-y-4">
              {steps.map(([icon, title, desc], i) => (
                <li
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground/40 p-5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-da-amber/12 text-da-amber">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-da-display font-semibold">
                      <span className="font-da-mono text-xs text-da-amber">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-da-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ---------- FAQ + CTA ---------- */

function FaqAndCTA({ signupHref, isLoggedIn }: { signupHref: string; isLoggedIn: boolean }) {
  const faqs = [
    [
      'Preciso pagar para começar?',
      'Não. Você cria uma conta grátis e já entra usando. O Plus+ libera o resto quando você quiser, no seu tempo.',
    ],
    [
      'Para quem é o Domine Aqui?',
      'Estudantes de Medicina, residentes e médicos. Algumas ferramentas, como os flashcards de neuroanatomia, também servem a áreas como Psicologia.',
    ],
    [
      'O que exatamente está incluído?',
      'Manual Clínico, flashcards, provas e questões por IA, banco de questões e cronograma. Tudo interativo e vivo dentro da plataforma.',
    ],
    [
      'As provas e flashcards por IA seguem a minha faculdade?',
      'Seguem. Você escolhe o conteúdo da ementa e a IA gera em cima do que o seu curso cobra, não um genérico.',
    ],
    [
      'O que o Plus+ inclui?',
      'Tudo. Manual Clínico completo, todos os materiais, todos os flashcards, aulas, mapas mentais, provas por IA, flashcards por IA, cronogramas e Banco de Questões ilimitado. É um plano só, sem níveis.',
    ],
  ]
  return (
    <section className="relative border-t border-[color:var(--da-neutral-line)] bg-da-panel/40">
      <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-24">
        <Reveal>
          <SectionMark n="FAQ" label="Antes de começar" />
          <h2 className="font-da-display text-4xl font-semibold tracking-tighter md:text-5xl">
            Perguntas justas, respostas diretas
          </h2>
        </Reveal>
        <div className="mt-10 divide-y divide-[color:var(--da-neutral-line)]">
          {faqs.map(([q, a], i) => (
            <Reveal key={q} delay={i * 40}>
              <Faq q={q} a={a} />
            </Reveal>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden border-t border-[color:var(--da-amber-line)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(800px 400px at 50% 120%, rgba(232,118,58,.2), transparent 65%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:px-8 md:py-28">
          <Reveal>
            <p className="font-da-mono text-xs uppercase tracking-[0.28em] text-da-amber">
              Sua próxima prova começa agora
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-da-display text-4xl font-semibold leading-[1.04] tracking-tighter md:text-6xl">
              Enquanto você decide, alguém já está estudando aqui.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-9 flex justify-center">
              <PrimaryCTA href={signupHref}>
                {isLoggedIn ? 'Ir para o dashboard' : 'Criar conta grátis'}
              </PrimaryCTA>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 font-da-mono text-xs text-da-muted">Grátis para começar. Sem cartão.</p>
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
          className="shrink-0 text-da-amber transition-transform duration-300"
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

/* ---------- RODAPÉ ---------- */

function Footer() {
  return (
    <footer className="border-t border-[color:var(--da-neutral-line)] bg-da-ground">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
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
          <div className="flex flex-wrap items-center gap-4">
            <Link href={LINKS.termos} className="transition hover:text-da-paper">
              Termos de Serviço
            </Link>
            <Link href={LINKS.privacidade} className="transition hover:text-da-paper">
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
      <p className="font-da-mono text-[11px] uppercase tracking-[0.22em] text-da-amber">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([l, href]) => (
          <li key={l}>
            <SmartLink href={href} className="text-sm text-da-muted transition hover:text-da-paper">
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
    hover: 'hover:border-da-amber/60 hover:text-da-amber',
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
