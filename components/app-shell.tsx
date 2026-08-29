'use client'

import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { ProfileCompletionGate, resetProfilePromptDismissal } from '@/components/profile-completion-gate'
import { SupportChat } from '@/components/support-chat'
import { PageLoading } from '@/components/page-loading'
import { SectionSkeleton } from '@/components/section-skeleton'
import { AvisoDePartidaLenta } from '@/components/pwa/aviso-de-partida-lenta'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiteModeToggle } from '@/components/lite-mode-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { MaterialCartButton } from '@/components/materiais/material-cart-button'
import { cn } from '@/lib/utils'
import { LogIn, Menu, RefreshCw, ShieldAlert, WifiOff, X } from 'lucide-react'
import { useBootstrap, clearBootstrapCache } from '@/hooks/use-bootstrap'
import { clearReadingProgress } from '@/lib/material-reading-progress'
import { FocusSessionProvider } from '@/hooks/use-focus-session'
import { FocusSessionButton } from '@/components/focus-session-button'
import { useUIPreferences } from '@/hooks/use-ui-preferences'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { MotionConfig } from 'framer-motion'
import type { SidebarSectionOrder, SidebarSectionSettings } from '@/lib/sidebar-sections'
import type { SidebarSectionIcons } from '@/lib/sidebar-icons'
import type { SidebarGroupDefinition, SidebarSectionGroups } from '@/lib/sidebar-groups'

/**
 * AppShell Component - Optimized Version
 *
 * Previous implementation:
 * - Made 2 separate fetch calls on mount (/api/auth/me + /api/user/tier-limits)
 * - Polled tier limits every 30 seconds
 * - ~2.9M invocations/day per 1000 users (just for tier polling)
 *
 * Optimized implementation:
 * - Uses centralized useBootstrap hook for all user data
 * - No polling (tier limits rarely change mid-session)
 * - Data shared with BanChecker, NotificationsBell, etc.
 * - ~288K invocations/day per 1000 users (90% reduction)
 */

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  accountType?: 'gratuito' | 'trial' | 'plus' | 'premium' | 'essential'
  secondaryRole?: string
  emailVerified?: boolean
}

interface AppShellContextType {
  user: User | null
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  handleCreateExam: () => void
  /** Encerra a sessão. Exposto para superfícies que oferecem "Sair" fora do menu (busca global). */
  handleLogout: () => void
  tierLimitExceeded: boolean
  examsRemaining: number | null
  examsLimit: number | null
  refetchBootstrap: () => void
  // Extended user info for child pages (avoid extra /api/auth/me calls)
  isAdmin: boolean
  accountType: 'gratuito' | 'trial' | 'plus' | 'premium' | 'essential'
  secondaryRole?: string
  loading: boolean
  sidebarCollapsed: boolean
  sidebarSections: SidebarSectionSettings | null
  sidebarSectionOrder: SidebarSectionOrder | null
  sidebarSectionIcons: SidebarSectionIcons | null
  sidebarGroups: SidebarGroupDefinition[] | null
  sidebarSectionGroups: SidebarSectionGroups | null
}

const AppShellContext = createContext<AppShellContextType | null>(null)

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider')
  }
  return context
}

/**
 * Escolhe o formato do esqueleto conforme a rota, para que o molde exibido
 * durante o bootstrap case com o conteúdo que vai aparecer. Espelha os
 * variants usados pelos `loading.tsx` de cada seção.
 */
function skeletonVariantForPath(
  pathname: string | null,
): 'cards' | 'catalog' | 'list' | 'dashboard' {
  if (!pathname) return 'cards'
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    return 'dashboard'
  }
  if (pathname.startsWith('/banco-questoes') || pathname.startsWith('/forum')) {
    return 'list'
  }
  if (pathname.startsWith('/materiais')) {
    return 'catalog'
  }
  return 'cards'
}

interface AppShellProps {
  children: React.ReactNode
  showHeader?: boolean
  headerTitle?: string
  headerSubtitle?: string
  allowGuest?: boolean
  guestNotice?: boolean
  /**
   * Mostra o carrinho de materiais no cabeçalho.
   *
   * Existe para as áreas de ESTUDO poderem desligá-lo. O cabeçalho é
   * compartilhado por todo o app e acumulou sete controles — menu, marca,
   * carrinho, sessão de foco, sino, modo lite e tema —, todos disputando a
   * mesma faixa de 56px. Num catálogo o carrinho é a ação principal; no meio
   * de uma aula ele é uma oferta de compra competindo com o conteúdo (§20).
   *
   * O padrão continua sendo `true`: nenhuma tela que já mostrava o carrinho
   * deixa de mostrá-lo por causa desta mudança.
   */
  comercio?: boolean
  /**
   * Cabeçalho em vidro, em vez do opaco padrão do resto do app.
   *
   * A Área de Ensino tem uma doca flutuante em vidro no rodapé (ver
   * `doca.tsx`); com o cabeçalho opaco por cima, a tela falava duas
   * linguagens de material ao mesmo tempo. `vidro` troca só a superfície
   * (`.cabecalho-vidro` em `globals.css`, mesma receita de três camadas da
   * doca) — todo o resto do cabeçalho continua igual. Passe `true` apenas em
   * telas que já têm outro elemento de vidro na composição; num cabeçalho
   * sozinho, opaco continua sendo a leitura mais legível.
   */
  vidro?: boolean
  /**
   * Desenha o menu/tema/modo lite flutuantes quando `showHeader` é `false`.
   *
   * Existe para as telas de RESOLUÇÃO poderem ficar realmente limpas. Sem o
   * cabeçalho, o shell reacende os mesmos controles como botões soltos nos
   * cantos de cima — o que devolve exatamente a distração que a tela tinha
   * acabado de tirar, e ainda por cima em cima da barra de progresso do quiz.
   *
   * O padrão continua `true`: nenhuma tela que hoje esconde o cabeçalho perde
   * seus controles por causa desta opção.
   */
  controlesFlutuantes?: boolean
}

export function AppShell({
  children,
  showHeader = true,
  headerTitle,
  headerSubtitle,
  allowGuest = false,
  guestNotice = true,
  comercio = true,
  vidro = false,
  controlesFlutuantes = true,
}: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { showSupport } = useUIPreferences()
  const { liteMode } = useLiteMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [retryingBootstrap, setRetryingBootstrap] = useState(false)

  // Persist collapsed state to localStorage
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }

  // Use the centralized bootstrap hook - single source of truth
  const {
    user: bootstrapUser,
    tierLimits,
    tierUsage,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    sidebarSections,
    sidebarSectionOrder,
    sidebarSectionIcons,
    sidebarGroups,
    sidebarSectionGroups,
    refetch: refetchBootstrap,
  } = useBootstrap({
    redirectOnUnauth: !allowGuest, // Auto-redirect to login if not authenticated
  })

  // Transform bootstrap user to local format
  const user: User | null = useMemo(() => {
    if (!bootstrapUser) return null
    return {
      id: bootstrapUser._id,
      email: bootstrapUser.email,
      name: bootstrapUser.name,
      role: bootstrapUser.role,
      accountType: bootstrapUser.accountType === 'free' ? 'gratuito' : bootstrapUser.accountType,
      secondaryRole: bootstrapUser.secondaryRole,
      emailVerified: bootstrapUser.emailVerified,
    }
  }, [bootstrapUser])

  // Derived values for easy access in child pages
  const accountType = user?.accountType || 'gratuito'
  const secondaryRole = user?.secondaryRole

  // Calculate tier limits from bootstrap data
  const examsLimit = tierLimits?.examsPerMonth ?? null
  const examsUsed = tierUsage?.examsUsedThisMonth ?? 0
  const examsRemaining = examsLimit !== null ? Math.max(0, examsLimit - examsUsed) : null
  const tierLimitExceeded = isAdmin ? false : (examsRemaining !== null && examsRemaining <= 0)

  function handleLogout() {
    // Limpa cache client-side imediatamente e redireciona sem esperar resposta
    // do servidor — o cookie será removido quando a requisição chegar, mas não
    // há motivo para bloquear o redirect por isso (especialmente em mobile com
    // rede lenta). A página de login rejeitaria uma sessão válida de qualquer forma.
    clearBootstrapCache()
    resetProfilePromptDismissal()
    clearReadingProgress()
    fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }).catch(() => {})
    router.replace('/auth/login')
  }

  function handleCreateExam() {
    setShowCreateExamModal(true)
  }

  async function handleRetryBootstrap() {
    setRetryingBootstrap(true)
    try {
      await refetchBootstrap()
    } catch {
      // The hook stores the visible error state; keep this click handler quiet.
    } finally {
      setRetryingBootstrap(false)
    }
  }

  useEffect(() => {
    if (!sidebarOpen || typeof window === 'undefined') return

    const media = window.matchMedia('(max-width: 1023px)')
    if (!media.matches) return

    const scrollY = window.scrollY
    // Rota em que a trava foi aplicada. Clicar num item da sidebar navega E
    // fecha a sidebar ao mesmo tempo, então a limpeza abaixo rodava já na
    // página nova e devolvia o scroll da página ANTIGA — a pessoa abria a nova
    // página no meio dela (quase sempre no rodapé). Só restauramos a posição
    // quando a rota continua sendo a mesma; se mudou, a página nova começa no
    // topo (o <ScrollToTop /> do layout cuida disso).
    const lockedPathname = window.location.pathname
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.documentElement.style.overscrollBehavior = 'contain'

    return () => {
      document.body.style.overflow = previous.overflow
      document.body.style.position = previous.position
      document.body.style.top = previous.top
      document.body.style.width = previous.width
      document.documentElement.style.overscrollBehavior = previous.overscrollBehavior

      if (window.location.pathname === lockedPathname) {
        window.scrollTo(0, scrollY)
      } else {
        window.scrollTo(0, 0)
      }
    }
  }, [sidebarOpen])

  const isAuthError = !!error && (
    (error as any).status === 401 ||
    (error as any).status === 403 ||
    error.message.includes('401') ||
    error.message.includes('403')
  )
  const isGuest = allowGuest && !user && (loading || isAuthError || !isAuthenticated || !!error)
  const isRecoverableBootstrapError = !!error && !isAuthError && !isGuest

  // Protected pages should wait for session data. Guest-enabled pages can render
  // immediately and upgrade themselves when bootstrap eventually finishes.
  //
  // Enquanto o bootstrap não chega, mostramos o ESQUELETO do shell em vez de um
  // spinner fullscreen. É o mesmo molde (sidebar + header + conteúdo) que o
  // AppShell real vai ocupar, então a troca acontece sem pulo de layout e a
  // espera não parece "o app recarregando do zero" — que é exatamente a
  // sensação logo depois do login, quando o cache foi limpo de propósito.
  if (loading && !isGuest) {
    return (
      <>
        <SectionSkeleton variant={skeletonVariantForPath(pathname)} />
        {/* O esqueleto sozinho é mudo. Se a espera passar de alguns segundos —
            o caso do app instalado abrindo em rede ruim —, ele passa a
            explicar o que está acontecendo e a oferecer "tentar de novo", em
            vez de deixar a pessoa achando que travou. */}
        <AvisoDePartidaLenta onRetry={handleRetryBootstrap} retrying={retryingBootstrap} />
      </>
    )
  }

  // Handle error or unauthenticated state
  // The useBootstrap hook with redirectOnUnauth will handle the redirect
  if (isRecoverableBootstrapError) {
    return (
      <BootstrapErrorState
        retrying={retryingBootstrap}
        onRetry={handleRetryBootstrap}
        onLogin={() => router.replace('/auth/login')}
      />
    )
  }

  if ((error && !isGuest) || (!user && !isGuest)) {
    return <PageLoading variant="fullscreen" message="Redirecionando..." />
  }

  const contextValue: AppShellContextType = {
    user,
    sidebarOpen,
    setSidebarOpen,
    handleCreateExam,
    handleLogout,
    tierLimitExceeded,
    examsRemaining,
    examsLimit,
    refetchBootstrap,
    // Extended user info for child pages (avoid extra /api/auth/me calls)
    isAdmin,
    accountType,
    secondaryRole,
    loading,
    sidebarCollapsed,
    sidebarSections,
    sidebarSectionOrder,
    sidebarSectionIcons,
    sidebarGroups,
    sidebarSectionGroups,
  }

  if (isGuest) {
    const loginHref = typeof window !== 'undefined'
      ? `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : '/auth/login'

    return (
      <AppShellContext.Provider value={contextValue}>
        <LiteMotionConfig lite={liteMode}>
        <FocusSessionProvider>
          <div className="min-h-screen surface-page">
            {showHeader ? (
              <header className="pwa-safe-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
                <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <Logo variant="icon" size="sm" />
                    <div className="min-w-0">
                      <h1 className="truncate font-heading text-sm font-semibold sm:text-base">
                        {headerTitle || 'DomineAqui'}
                      </h1>
                      {headerSubtitle && (
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">
                          {headerSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LiteModeToggle />
                    <ThemeToggle />
                    <a
                      href={loginHref}
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        'h-9 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90'
                      )}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </a>
                    <MaterialCartButton isAuthenticated={false} />
                  </div>
                </div>
              </header>
            ) : (
              <ThemeToggle floating />
            )}

            <main className="min-h-screen">
              {children}
            </main>

            {guestNotice && <GuestAccessNotice />}
          </div>
        </FocusSessionProvider>
        </LiteMotionConfig>
      </AppShellContext.Provider>
    )
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <LiteMotionConfig lite={liteMode}>
      <FocusSessionProvider>
      <div className="min-h-screen surface-page">
        <BanChecker />
        {/* Pede os dados que faltam no perfil (progressive profiling) */}
        <ProfileCompletionGate />

        {/* Sidebar */}
        <Sidebar
          user={user}
          onCreateExam={handleCreateExam}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          examsRemaining={examsRemaining}
          examsLimit={examsLimit}
          tierLimitExceeded={tierLimitExceeded}
          collapsed={sidebarCollapsed}
          onCollapse={handleSidebarCollapse}
          sidebarSections={sidebarSections}
          sidebarSectionOrder={sidebarSectionOrder}
          sidebarSectionIcons={sidebarSectionIcons}
          sidebarGroups={sidebarGroups}
          sidebarSectionGroups={sidebarSectionGroups}
        />

        {/* Floating controls when shell header is hidden */}
        {!showHeader && controlesFlutuantes && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="pwa-safe-fixed-top fixed top-3 left-3 z-40 lg:hidden h-10 w-10 rounded-md bg-card border-border shadow-md"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ThemeToggle floating className="pwa-safe-fixed-top !top-3 !right-3" />
            <LiteModeToggle className="pwa-safe-fixed-top fixed top-3 right-[6.25rem] z-[60] h-10 w-10 shadow-md" />
          </>
        )}

        {/* Main Content Area - no padding on mobile (sidebar is overlay), padding on desktop */}
        <div
          className={cn(
            'min-h-screen flex flex-col transition-[padding-left] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
            sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[280px]'
          )}
        >
          {/* Header */}
          {showHeader && (
            <header
              className={cn(
                'sticky top-0 z-30',
                vidro
                  ? 'cabecalho-vidro'
                  : 'border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90',
              )}
            >
              <div className="flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden h-9 w-9 shrink-0 rounded-md"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  <div className="lg:hidden shrink-0">
                    <Logo variant="icon" size="sm" />
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    {headerTitle ? (
                      <div className="min-w-0">
                        <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
                          {headerTitle}
                        </h1>
                        {headerSubtitle && (
                          <p className="truncate text-xs text-muted-foreground">{headerSubtitle}</p>
                        )}
                      </div>
                    ) : (
                      <p className="truncate text-sm text-muted-foreground">
                        Olá,{' '}
                        <span className="font-medium text-foreground">{user?.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div data-tour="header-tools" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {comercio ? <MaterialCartButton isAuthenticated={!!user} /> : null}
                  <FocusSessionButton />
                  <NotificationsBell />
                  {/* Ao lado do tema: é onde a pessoa procura por "mudar o visual". */}
                  <LiteModeToggle />
                  <ThemeToggle />
                </div>
              </div>
            </header>
          )}

          <main className="flex-1 min-w-0">{children}</main>
        </div>

        {/* Create Exam Modal */}
        <CreateExamModal
          open={showCreateExamModal}
          onClose={() => setShowCreateExamModal(false)}
          isAdmin={isAdmin}
          tierLimitExceeded={tierLimitExceeded}
        />

        {/* Support Chat */}
        {showSupport && <SupportChat />}
      </div>
      </FocusSessionProvider>
      </LiteMotionConfig>
    </AppShellContext.Provider>
  )
}

/**
 * Corta as animações do framer-motion em todo o app quando o Modo Lite está
 * ligado. O CSS do Modo Lite não alcança essas animações — elas são calculadas
 * em JavaScript, quadro a quadro, e são justamente as mais caras. Com
 * `reducedMotion="always"` o framer aplica o estado final direto, sem tween.
 *
 * Fora do Lite fica em `"user"`, que passa a respeitar o
 * `prefers-reduced-motion` do sistema — algo que o app não fazia.
 */
function LiteMotionConfig({ lite, children }: { lite: boolean; children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion={lite ? 'always' : 'user'}>{children}</MotionConfig>
  )
}

function BootstrapErrorState({
  retrying,
  onRetry,
  onLogin,
}: {
  retrying: boolean
  onRetry: () => void
  onLogin: () => void
}) {
  return (
    <div className="min-h-screen surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
          <WifiOff className="h-5 w-5" />
        </div>
        <h1 className="font-heading text-base font-semibold">Não consegui confirmar sua sessão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A conexão demorou demais. Tente novamente ou entre de novo para continuar.
        </p>
        <div className="mt-5 grid gap-2">
          <Button onClick={onRetry} disabled={retrying} className="rounded-md">
            {retrying ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={onLogin} className="rounded-md">
            <LogIn className="mr-2 h-4 w-4" />
            Ir para login
          </Button>
        </div>
      </div>
    </div>
  )
}

const GUEST_NOTICE_DISMISS_KEY = 'guest-notice-dismissed-at'
const GUEST_NOTICE_DISMISS_TTL_MS = 1000 * 60 * 60 * 12 // 12h

function GuestAccessNotice() {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [position, setPosition] = useState({ x: 18, y: 18 })
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    try {
      const dismissedAt = Number(sessionStorage.getItem(GUEST_NOTICE_DISMISS_KEY) || 0)
      if (dismissedAt && Date.now() - dismissedAt < GUEST_NOTICE_DISMISS_TTL_MS) {
        setDismissed(true)
      }
    } catch {
      // ignore storage access errors
    }

    const setInitialPosition = () => {
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
      if (mobile) return
      const width = 320
      setPosition({
        x: Math.max(12, window.innerWidth - width - 18),
        y: Math.max(12, window.innerHeight - 174),
      })
    }
    setInitialPosition()
    window.addEventListener('resize', setInitialPosition)
    return () => window.removeEventListener('resize', setInitialPosition)
  }, [])

  // No mobile a barra é fixa no rodapé: reserva espaço no fim da página para
  // que ela não cubra o último bloco de conteúdo (avaliações, CTAs, etc.).
  useEffect(() => {
    if (!mounted || dismissed || !isMobile) return
    document.body.classList.add('has-guest-notice')
    return () => document.body.classList.remove('has-guest-notice')
  }, [mounted, dismissed, isMobile])

  useEffect(() => {
    if (!dragging || isMobile) return

    function onPointerMove(event: PointerEvent) {
      const width = 320
      const height = 142
      setPosition({
        x: Math.min(Math.max(12, event.clientX - dragOffset.x), window.innerWidth - width - 12),
        y: Math.min(Math.max(12, event.clientY - dragOffset.y), window.innerHeight - height - 12),
      })
    }

    function onPointerUp() {
      setDragging(false)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [dragOffset.x, dragOffset.y, dragging, isMobile])

  if (!mounted || dismissed) return null

  const loginHref = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`

  const dismiss = () => {
    try {
      sessionStorage.setItem(GUEST_NOTICE_DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore storage access errors
    }
    setDismissed(true)
  }

  if (isMobile) {
    return (
      <div
        className="pwa-safe-bottom fixed inset-x-2 bottom-2 z-[60] flex items-center gap-2 rounded-xl border border-white/35 bg-white/85 px-3 py-2 text-slate-900 shadow-lg shadow-emerald-900/15 backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/85 dark:text-white"
        role="status"
        aria-live="polite"
      >
        <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight">
          Você está vendo como visitante
        </p>
        <a
          href={loginHref}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <LogIn className="h-3 w-3" />
          Entrar
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-black/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed z-[60] w-[min(320px,calc(100vw-32px))] touch-none select-none overflow-hidden rounded-2xl border border-white/35 bg-white/55 p-3.5 text-slate-900 shadow-2xl shadow-emerald-900/15 backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/55 dark:text-white"
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setDragging(true)
        setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}
      role="status"
      aria-live="polite"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(22,163,74,0.22),rgba(255,255,255,0.20)_38%,rgba(245,158,11,0.18)_68%,rgba(20,184,166,0.18))] dark:bg-[linear-gradient(135deg,rgba(22,163,74,0.22),rgba(15,23,42,0.25)_40%,rgba(245,158,11,0.14)_70%,rgba(20,184,166,0.16))]" />
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-emerald-300/30 blur-2xl" />
      <button
        type="button"
        onClick={dismiss}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Fechar aviso"
        className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-black/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="relative flex items-start gap-3 pr-5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">Você está vendo como visitante</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Catálogo e compra liberados — você recebe sua Serial Key por e-mail. Download, viewer e áreas de estudo exigem login.
          </p>
        </div>
      </div>
      <div className="relative mt-3 flex justify-end">
        <a
          href={loginHref}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar para liberar
        </a>
      </div>
    </div>
  )
}
