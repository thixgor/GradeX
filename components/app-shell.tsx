'use client'

import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { SupportChat } from '@/components/support-chat'
import { PageLoading } from '@/components/page-loading'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { useBootstrap, clearBootstrapCache } from '@/hooks/use-bootstrap'

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
}

export function AppShell({
  children,
  showHeader = true,
  headerTitle,
  headerSubtitle
}: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)

  // Use the centralized bootstrap hook - single source of truth
  const {
    user: bootstrapUser,
    tierLimits,
    tierUsage,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    refetch: refetchBootstrap,
  } = useBootstrap({
    redirectOnUnauth: true, // Auto-redirect to login if not authenticated
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
    }
  }, [bootstrapUser])

  // Calculate tier limits from bootstrap data
  const examsLimit = tierLimits?.examsPerMonth ?? null
  const examsUsed = tierUsage?.examsUsedThisMonth ?? 0
  const examsRemaining = examsLimit !== null ? Math.max(0, examsLimit - examsUsed) : null
  const tierLimitExceeded = isAdmin ? false : (examsRemaining !== null && examsRemaining <= 0)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Clear all cached data
    clearBootstrapCache()
    router.push('/auth/login')
  }

  function handleCreateExam() {
    if (isAdmin) {
      setShowCreateExamModal(true)
    } else {
      if (tierLimitExceeded) {
        alert(`Voce atingiu seu limite de criacao de provas.
Faca upgrade para Premium para 10 provas por dia com ate 20 questoes por prova.

Contato: (21) 99777-0936`)
      } else {
        router.push('/exams/create-personal')
      }
    }
  }

  // Handle loading state
  if (loading) {
    return <PageLoading variant="fullscreen" message="Carregando..." />
  }

  // Handle error or unauthenticated state
  // The useBootstrap hook with redirectOnUnauth will handle the redirect
  if (error || !user) {
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
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
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
          onCollapse={setSidebarCollapsed}
        />

        {/* Main Content Area - no padding on mobile (sidebar is overlay), padding on desktop */}
        <div
          className={cn(
            "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
          )}
        >
          {/* Header */}
          {showHeader && (
            <header className="glass sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between h-16 px-4">
                {/* Left side */}
                <div className="flex items-center gap-3">
                  {/* Menu button for mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden h-9 w-9"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  {/* Logo - only visible on mobile */}
                  <div className="lg:hidden">
                    <Logo variant="icon" size="sm" />
                  </div>

                  {/* Page title or greeting */}
                  <div className="hidden sm:block">
                    {headerTitle ? (
                      <div>
                        <h1 className="text-lg font-semibold">{headerTitle}</h1>
                        {headerSubtitle && (
                          <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Ola, <span className="font-medium text-foreground">{user?.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                  <NotificationsBell />
                  <ThemeToggle />
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <main className="flex-1">
            {children}
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
        <SupportChat />
      </div>
    </AppShellContext.Provider>
  )
}
