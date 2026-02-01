'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { CreateExamModal } from '@/components/create-exam-modal'
import { BanChecker } from '@/components/ban-checker'
import { SupportChat } from '@/components/support-chat'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsBell } from '@/components/notifications-bell'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [examsRemaining, setExamsRemaining] = useState<number | null>(null)
  const [examsLimit, setExamsLimit] = useState<number | null>(null)
  const [tierLimitExceeded, setTierLimitExceeded] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadTierLimits()
    }
  }, [user])

  // Polling for tier limits
  useEffect(() => {
    if (!user) return
    const interval = setInterval(loadTierLimits, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadTierLimits() {
    try {
      const res = await fetch('/api/user/tier-limits')
      if (res.ok) {
        const data = await res.json()
        setExamsRemaining(data.examsRemaining)
        setExamsLimit(data.limits.examsPerDay)
        setTierLimitExceeded(data.isAdmin ? false : data.examsRemaining <= 0)
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  function handleCreateExam() {
    if (user?.role === 'admin') {
      setShowCreateExamModal(true)
    } else {
      if (tierLimitExceeded) {
        alert(`Você atingiu seu limite de criação de provas.
Faça upgrade para Premium para 10 provas por dia com até 20 questões por prova.

Contato: (21) 99777-0936`)
      } else {
        router.push('/exams/create-personal')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const contextValue: AppShellContextType = {
    user,
    sidebarOpen,
    setSidebarOpen,
    handleCreateExam,
    tierLimitExceeded,
    examsRemaining,
    examsLimit,
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
                        Olá, <span className="font-medium text-foreground">{user?.name}</span>
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
          isAdmin={user?.role === 'admin'}
          tierLimitExceeded={tierLimitExceeded}
        />

        {/* Support Chat */}
        <SupportChat />
      </div>
    </AppShellContext.Provider>
  )
}
