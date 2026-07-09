'use client'

import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { SupportChat } from '@/components/support-chat'
import { PageLoading } from '@/components/page-loading'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { MaterialCartButton } from '@/components/materiais/material-cart-button'
import { cn } from '@/lib/utils'
import { LogIn, Menu, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react'
import { useBootstrap, clearBootstrapCache } from '@/hooks/use-bootstrap'
import { FocusSessionProvider } from '@/hooks/use-focus-session'
import { FocusSessionButton } from '@/components/focus-session-button'
import { DoacaoFloatingButton } from '@/components/doacoes/doacao-floating-button'
import type { SidebarSectionSettings } from '@/lib/sidebar-sections'

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
  accountType?: 'gratuito' | 'trial' | 'premium'
  secondaryRole?: string
  emailVerified?: boolean
}

interface AppShellContextType {
  user: User | null
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  handleCreateExam: () => void
  tierLimitExceeded: boolean
  examsRemaining: number | null
  examsLimit: number | null
  refetchBootstrap: () => void
  // Extended user info for child pages (avoid extra /api/auth/me calls)
  isAdmin: boolean
  accountType: 'gratuito' | 'trial' | 'premium'
  secondaryRole?: string
  loading: boolean
  sidebarCollapsed: boolean
  sidebarSections: SidebarSectionSettings | null
}

const AppShellContext = createContext<AppShellContextType | null>(null)

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider')
  }
  return context
}

interface AppShellProps {
  children: React.ReactNode
  showHeader?: boolean
  headerTitle?: string
  headerSubtitle?: string
  allowGuest?: boolean
  guestNotice?: boolean
}

export function AppShell({
  children,
  showHeader = true,
  headerTitle,
  headerSubtitle,
  allowGuest = false,
  guestNotice = true,
}: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
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
      window.scrollTo(0, scrollY)
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
  if (loading && !isGuest) {
    return <PageLoading variant="fullscreen" message="Carregando..." />
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
  }

  if (isGuest) {
    const loginHref = typeof window !== 'undefined'
      ? `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : '/auth/login'

    return (
      <AppShellContext.Provider value={contextValue}>
        <FocusSessionProvider>
          <div className="min-h-screen surface-page">
            {showHeader ? (
              <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
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
      </AppShellContext.Provider>
    )
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <FocusSessionProvider>
      <div className="min-h-screen surface-page">
        <BanChecker />

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
        />

        {/* Floating controls when shell header is hidden */}
        {!showHeader && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="fixed top-3 left-3 z-40 lg:hidden h-10 w-10 rounded-md bg-card border-border shadow-md"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <ThemeToggle floating className="!top-3 !right-3" />
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
            <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
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

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <MaterialCartButton isAuthenticated={!!user} />
                  <FocusSessionButton />
                  <NotificationsBell />
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
        <SupportChat />

        {/* Floating donation button */}
        <DoacaoFloatingButton />
      </div>
      </FocusSessionProvider>
    </AppShellContext.Provider>
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

function GuestAccessNotice() {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ x: 18, y: 18 })
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    const setInitialPosition = () => {
      const width = Math.min(320, window.innerWidth - 32)
      setPosition({
        x: Math.max(12, window.innerWidth - width - 18),
        y: Math.max(12, window.innerHeight - 174),
      })
    }
    setInitialPosition()
    window.addEventListener('resize', setInitialPosition)
    return () => window.removeEventListener('resize', setInitialPosition)
  }, [])

  useEffect(() => {
    if (!dragging) return

    function onPointerMove(event: PointerEvent) {
      const width = Math.min(320, window.innerWidth - 32)
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
  }, [dragOffset.x, dragOffset.y, dragging])

  if (!mounted) return null

  const loginHref = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`

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
      <div className="relative flex items-start gap-3">
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
