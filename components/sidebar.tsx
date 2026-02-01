'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import {
  FileText,
  Brain,
  BookMarked,
  MessageCircle,
  Video,
  User as UserIcon,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  LogOut,
  Home,
  X,
  Database,
  Lock,
} from 'lucide-react'

interface SidebarProps {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    accountType?: 'gratuito' | 'trial' | 'premium'
  } | null
  onCreateExam: () => void
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  examsRemaining?: number | null
  examsLimit?: number | null
  tierLimitExceeded?: boolean
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

interface NavItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: string
  variant?: 'default' | 'primary' | 'gradient'
}

export function Sidebar({
  user,
  onCreateExam,
  onLogout,
  isOpen,
  onClose,
  examsRemaining,
  examsLimit,
  tierLimitExceeded,
  collapsed,
  onCollapse,
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isAdmin = user?.role === 'admin'

  const mainNavItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Início',
      href: '/dashboard',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Provas',
      href: '/provas',
    },
    {
      icon: <Database className="h-5 w-5" />,
      label: 'Banco de Questões',
      href: '/banco-questoes',
      badge: user?.accountType !== 'premium' && !isAdmin ? '5 Questões' : undefined,
    },
    {
      icon: <Video className="h-5 w-5" />,
      label: 'Aulas',
      href: '/aulas',
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: 'Flashcards',
      href: '/flashcards',
    },
    {
      icon: <BookMarked className="h-5 w-5" />,
      label: 'Cronogramas',
      href: '/cronogramas',
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'Fórum',
      href: '/forum',
    },
  ]

  const secondaryNavItems: NavItem[] = [
    {
      icon: <UserIcon className="h-5 w-5" />,
      label: 'Meu Perfil',
      href: '/profile',
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'Upgrade',
      href: '/buy',
      variant: 'gradient',
    },
  ]

  if (isAdmin) {
    secondaryNavItems.push({
      icon: <Settings className="h-5 w-5" />,
      label: 'Painel Admin',
      href: '/admin',
    })
  }

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      router.push(item.href)
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Overlay - with transition for smooth fade */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-background border-r flex flex-col',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          'w-[280px]', // Always full width on mobile
          // Mobile: slide in/out, Desktop: always visible
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0' // Always visible on desktop
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/?landing=true')}
          >
            {!collapsed && <Logo variant="full" size="md" />}
            {collapsed && <Logo variant="icon" size="md" />}
          </div>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Collapse button for desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse(!collapsed)}
            className="hidden lg:flex h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User Info */}
        {user && !collapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Exam Button */}
        <div className="p-3 border-b">
          <Button
            onClick={onCreateExam}
            disabled={tierLimitExceeded}
            className={cn(
              'w-full justify-start gap-3 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-semibold',
              collapsed && 'justify-center px-0'
            )}
          >
            <Plus className="h-5 w-5" />
            {!collapsed && <span>Nova Prova</span>}
          </Button>

          {/* Exams Remaining Counter */}
          {!collapsed && examsRemaining !== null && examsLimit !== null && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {examsRemaining} / {examsLimit} provas restantes hoje
            </p>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {mainNavItems.map((item, index) => (
            <Button
              key={index}
              variant={isActive(item.href) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                collapsed && 'justify-center px-0',
                isActive(item.href) && 'bg-primary/10 text-primary'
              )}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}

          <div className="my-4 border-t" />

          {secondaryNavItems.map((item, index) => (
            <Button
              key={index}
              variant={item.variant === 'gradient' ? 'default' : isActive(item.href) ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                collapsed && 'justify-center px-0',
                isActive(item.href) && 'bg-primary/10 text-primary',
                item.variant === 'gradient' && 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
              )}
              onClick={() => handleNavClick(item)}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t mt-auto">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
              collapsed && 'justify-center px-0'
            )}
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
