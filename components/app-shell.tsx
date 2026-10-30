'use client'

import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { ProfileCompletionGate, resetProfilePromptDismissal } from '@/components/profile-completion-gate'
import { XpProvider } from '@/components/xp/xp-provider'
import '@/components/ferramentas-do-topo.css'
import { AdesaoDoFoco } from '@/components/foco/adesao-do-foco'
import { TourDoTopo } from '@/components/tour-do-topo'
import { SupportChat, esquecerTicketsEmMemoria } from '@/components/support-chat'
import dynamicImport from 'next/dynamic'
import { rotaSemBarra } from '@/components/manual-clinico/casco/modulos'

// A moldura do Manual (aurora + barra de portas) só baixa no Manual.
const MolduraDoManual = dynamicImport(() => import('@/components/manual-clinico/casco/moldura-do-manual'))
import { PageLoading } from '@/components/page-loading'
import { SectionSkeleton } from '@/components/section-skeleton'
import { AvisoDePartidaLenta } from '@/components/pwa/aviso-de-partida-lenta'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiteModeToggle } from '@/components/lite-mode-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { MaterialCartButton } from '@/components/materiais/material-cart-button'
import { cn } from '@/lib/utils'
import { LogIn, Menu, RefreshCw, UserRound, WifiOff, X } from 'lucide-react'
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
import { SlotDeAnuncio, useShellComAnuncio } from '@/components/anuncio-na-pagina-slot'

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
  avatar?: string
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
   * Telas que já têm outro elemento de vidro na composição (a doca da Área de
   * Ensino, `doca.tsx`).
   *
   * O cabeçalho agora é vidro em todo o app (`.cabecalho-casco`), então a
   * superfície já fala a mesma língua da doca. A prop segue existindo como
   * marca (`data-vidro`) para o CSS afinar essas telas, e para nenhuma página
   * que a passa quebrar.
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
  // Toda página do Manual Clínico ganha a mesma moldura (aurora + barra de
  // portas), menos os visualizadores de tela cheia. Ver casco/modulos.ts.
  const noManual = !!pathname && !rotaSemBarra(pathname)
  const { showSupport } = useUIPreferences()
  const { liteMode } = useLiteMode()
  // Avisa ao lugar global de anúncio que esta página tem os seus (topo e fim
  // do <main>) — inclusive durante o carregamento, antes de o <main> existir.
  useShellComAnuncio()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [retryingBootstrap, setRetryingBootstrap] = useState(false)
  // "Entrar" do visitante volta para onde ele estava. O endereço completo (com
  // a busca) só existe no navegador; montá-lo durante a renderização fazia o
  // link divergir do HTML do servidor — e, na hidratação, o React fica com o
  // atributo do servidor, sem o retorno. Por isso entra depois de montar.
  const [loginHref, setLoginHref] = useState('/auth/login')
  useEffect(() => {
    setLoginHref(
      `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    )
  }, [pathname])

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
      avatar: bootstrapUser.avatar,
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
    esquecerTicketsEmMemoria()
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
    return (
      <AppShellContext.Provider value={contextValue}>
        <LiteMotionConfig lite={liteMode}>
        <FocusSessionProvider isAuthenticated={false}>
          <div className="min-h-screen surface-page">
            {showHeader ? (
              <header className="cabecalho-casco cabecalho-casco-visitante" data-vidro={vidro || undefined}>
                <div className="cabecalho-placa mx-auto max-w-7xl">
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
                    <div className="barra-ferramentas">
                      <MaterialCartButton isAuthenticated={false} />
                      <LiteModeToggle />
                    </div>
                    <ThemeToggle />
                    <a href={loginHref} className="cabecalho-entrar">
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </a>
                  </div>
                </div>
              </header>
            ) : (
              <ThemeToggle floating />
            )}

            <main className="min-h-screen">
              <SlotDeAnuncio posicao="topo" />
              {noManual ? (
                <div className="mc-mundo ck-mundo">
                  <MolduraDoManual />
                  {children}
                </div>
              ) : (
                children
              )}
              <SlotDeAnuncio posicao="rodape" />
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
      <XpProvider userId={bootstrapUser?._id}>
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
            sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[288px]'
          )}
          style={{ ['--sidebar-largura' as string]: sidebarCollapsed ? '88px' : '288px' }}
        >
          {/* Convite de foco no ponto de estudo, chama em risco e o modo rígido. */}
          <AdesaoDoFoco />
          {/* Orientação da barra do topo, uma vez por conta. */}
          <TourDoTopo userId={bootstrapUser?._id} />
          {/* Cabeçalho
              No computador, uma placa de vidro flutuando no topo da coluna de
              conteúdo, alinhada à sidebar (12 px das bordas, mesmo raio da
              família); no celular, a barra de vidro presa ao topo. As
              ferramentas — carrinho, foco, sino, Modo Lite, tema — moram numa
              cápsula só: eram cinco caixas soltas, cada uma com borda e fundo
              próprios, disputando a mesma faixa de 56 px. */}
          {showHeader && (
            <header className="cabecalho-casco" data-vidro={vidro || undefined}>
              <div className="cabecalho-placa">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="ferramenta-botao ferramenta-botao-solto lg:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <div className="shrink-0 lg:hidden">
                    <Logo variant="icon" size="sm" />
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    {headerTitle ? (
                      <div className="min-w-0">
                        <h1 className="truncate font-heading text-[1.15rem] font-semibold leading-tight tracking-[-0.015em]">
                          {headerTitle}
                        </h1>
                        {headerSubtitle && (
                          <p className="truncate text-xs text-muted-foreground">{headerSubtitle}</p>
                        )}
                      </div>
                    ) : (
                      <p className="cabecalho-saudacao truncate">
                        <span className="text-muted-foreground">{saudacaoDoDia()},</span>{' '}
                        <span className="font-semibold text-foreground">{user?.name?.split(' ')[0]}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div data-tour="header-tools" className="flex shrink-0 items-center gap-2">
                  <div className="barra-ferramentas">
                    {comercio ? <MaterialCartButton isAuthenticated={!!user} /> : null}
                    <FocusSessionButton />
                    <NotificationsBell />
                    {/* Ao lado do tema: é onde a pessoa procura por "mudar o visual". */}
                    <LiteModeToggle />
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </header>
          )}

          <main className="flex-1 min-w-0">
            <SlotDeAnuncio posicao="topo" />
            {noManual ? (
              <div className="mc-mundo ck-mundo">
                <MolduraDoManual />
                {children}
              </div>
            ) : (
              children
            )}
            <SlotDeAnuncio posicao="rodape" />
          </main>
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
      </XpProvider>
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
/** "Bom dia" até meio-dia, "Boa tarde" até as 18h, "Boa noite" depois. */
function saudacaoDoDia(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

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
      // Canto de baixo à esquerda: o direito é do aviso de Modo Lite, e os dois
      // empilhados ali viravam um bloco torto.
      setPosition({
        x: 18,
        y: Math.max(12, window.innerHeight - 186),
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

  // No desktop o cartão fica no canto de baixo à esquerda; o aviso de Modo
  // Lite (mesmo canto) lê esta classe e sobe para não ficar por cima dele.
  useEffect(() => {
    if (!mounted || dismissed || isMobile) return
    document.body.classList.add('has-guest-notice-desktop')
    return () => document.body.classList.remove('has-guest-notice-desktop')
  }, [mounted, dismissed, isMobile])

  useEffect(() => {
    if (!dragging || isMobile) return

    function onPointerMove(event: PointerEvent) {
      const width = 340
      const height = 168
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
        className="aviso-visitante fixed inset-x-2.5 bottom-[calc(10px+env(safe-area-inset-bottom))] z-[60] flex items-center gap-3 rounded-[20px] py-2 pl-2 pr-2 text-[#101814] dark:text-[#f3f4f1]"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f7d48]/10 text-[#2a7342] dark:bg-[#7fd093]/15 dark:text-[#7fd093]">
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold leading-tight tracking-[-0.01em]">Você está como visitante</span>
          <span className="block truncate text-[12px] leading-snug text-[#101814]/60 dark:text-white/60">Entre para baixar e estudar</span>
        </span>
        <a
          href={loginHref}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#2f7d48] px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition active:scale-95 active:opacity-80"
        >
          Entrar
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#101814]/50 transition active:scale-90 dark:bg-white/10 dark:text-white/60"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'aviso-visitante fixed z-[60] w-[min(340px,calc(100vw-32px))] touch-none select-none rounded-[22px] px-4 pb-4 pt-2.5 text-[#101814] dark:text-[#f3f4f1]',
        dragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setDragging(true)
        setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}
      role="status"
      aria-live="polite"
    >
      {/* A alça de folha do sistema: diz "dá para arrastar" sem texto. */}
      <span aria-hidden className="mx-auto mb-3 block h-1 w-9 rounded-full bg-black/15 dark:bg-white/20" />
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2f7d48]/10 text-[#2a7342] dark:bg-[#7fd093]/15 dark:text-[#7fd093]">
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">Você está como visitante</p>
          <p className="mt-1 text-[13px] leading-snug text-[#101814]/60 dark:text-white/60">
            Catálogo e compra liberados — a Serial Key chega por e-mail. Download, leitor e áreas de estudo pedem login.
          </p>
        </div>
      </div>
      <div className="mt-3.5 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={dismiss}
          onPointerDown={(event) => event.stopPropagation()}
          className="h-9 rounded-full px-3.5 text-[14px] font-semibold text-[#2a7342] transition hover:bg-[#2f7d48]/10 dark:text-[#7fd093] dark:hover:bg-white/10"
        >
          Agora não
        </button>
        <a
          href={loginHref}
          onPointerDown={(event) => event.stopPropagation()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2f7d48] px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-10px_rgba(47,125,72,0.75)] transition hover:bg-[#2a7041] active:scale-95"
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </a>
      </div>
    </div>
  )
}
