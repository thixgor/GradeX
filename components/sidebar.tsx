'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
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
  Gamepad2,
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
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

interface NavItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: string
  variant?: 'default' | 'primary' | 'gradient'
}

// ─── Fluid Glass Bubble ─────────────────────────────────────
// Single animated glass rectangle that follows the hovered item.
// Uses Framer Motion springs for physically natural movement.
function FluidGlassBubble({
  navRef,
  hoveredIndex,
  isVisible,
  collapsed,
}: {
  navRef: React.RefObject<HTMLElement | null>
  hoveredIndex: number | null
  isVisible: boolean
  collapsed: boolean
}) {
  // Spring config — feels like a physical object with slight overshoot
  const springY = { stiffness: 500, damping: 38, mass: 0.6 }
  const springSize = { stiffness: 400, damping: 32, mass: 0.4 }

  const bubbleY = useSpring(useMotionValue(0), springY)
  const bubbleH = useSpring(useMotionValue(44), springSize)
  const squeeze = useSpring(useMotionValue(1), { stiffness: 600, damping: 28 })

  useEffect(() => {
    if (hoveredIndex === null || !navRef.current) return

    const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
    const item = items[hoveredIndex]
    if (!item) return

    const navRect = navRef.current.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const scrollTop = navRef.current.scrollTop

    const top = itemRect.top - navRect.top + scrollTop
    const height = itemRect.height

    bubbleY.set(top)
    bubbleH.set(height)

    // Micro-squeeze on index change
    squeeze.set(0.97)
    const t = setTimeout(() => squeeze.set(1), 60)
    return () => clearTimeout(t)
  }, [hoveredIndex, navRef, bubbleY, bubbleH, squeeze, collapsed])

  return (
    <AnimatePresence>
      {isVisible && hoveredIndex !== null && (
        <motion.div
          className="liquid-glass-bubble"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: collapsed ? 4 : 6,
            right: collapsed ? 4 : 6,
            y: bubbleY,
            height: bubbleH,
            scaleX: squeeze,
            borderRadius: 14,
            zIndex: 0,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          <div className="liquid-glass-surface" />
          <div className="liquid-glass-refraction-top" />
          <div className="liquid-glass-refraction-bottom" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────
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
  const navRef = useRef<HTMLElement>(null)

  // Bubble tracking state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isInNav, setIsInNav] = useState(false)
  // Mobile: track touch drag
  const [isTouching, setIsTouching] = useState(false)

  const isAdmin = user?.role === 'admin'

  const mainNavItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: 'Início', href: '/dashboard' },
    { icon: <FileText className="h-5 w-5" />, label: 'Provas', href: '/provas' },
    {
      icon: <Database className="h-5 w-5" />,
      label: 'Banco de Questões',
      href: '/banco-questoes',
      badge: user?.accountType !== 'premium' && !isAdmin ? '5 Questões' : undefined,
    },
    { icon: <Video className="h-5 w-5" />, label: 'Aulas', href: '/aulas' },
    { icon: <Brain className="h-5 w-5" />, label: 'Flashcards', href: '/flashcards' },
    { icon: <BookMarked className="h-5 w-5" />, label: 'Cronogramas', href: '/cronogramas' },
    { icon: <MessageCircle className="h-5 w-5" />, label: 'Fórum', href: '/forum' },
    { icon: <Gamepad2 className="h-5 w-5" />, label: 'Games', href: '/games', badge: 'Novo' },
  ]

  const secondaryNavItems: NavItem[] = [
    { icon: <UserIcon className="h-5 w-5" />, label: 'Meu Perfil', href: '/profile' },
    { icon: <ShoppingCart className="h-5 w-5" />, label: 'Upgrade', href: '/buy', variant: 'gradient' },
  ]

  if (isAdmin) {
    secondaryNavItems.push({ icon: <Settings className="h-5 w-5" />, label: 'Painel Admin', href: '/admin' })
  }

  const logoutIndex = mainNavItems.length + secondaryNavItems.length

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) item.onClick()
    else if (item.href) router.push(item.href)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose()
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  // ─── Mouse handlers (desktop) ───
  const handleNavMouseEnter = useCallback(() => setIsInNav(true), [])
  const handleNavMouseLeave = useCallback(() => {
    setIsInNav(false)
    setHoveredIndex(null)
  }, [])

  // ─── Touch handlers (mobile) ───
  const findItemIndexAtY = useCallback((clientY: number) => {
    if (!navRef.current) return null
    const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) return i
    }
    return null
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsTouching(true)
    const touch = e.touches[0]
    const idx = findItemIndexAtY(touch.clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const idx = findItemIndexAtY(touch.clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Navigate to the last hovered item
    if (hoveredIndex !== null && navRef.current) {
      const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
      const item = items[hoveredIndex]
      if (item) item.click()
    }
    setIsTouching(false)
    setHoveredIndex(null)
  }, [hoveredIndex])

  const bubbleVisible = isInNav || isTouching

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-background border-r flex flex-col',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          'w-[280px]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
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

          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8">
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse?.(!collapsed)}
            className="hidden lg:flex h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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

          {!collapsed && examsRemaining !== null && examsLimit !== null && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {examsRemaining} / {examsLimit} provas restantes hoje
            </p>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav
          ref={navRef}
          className="flex-1 px-3 py-2 overflow-y-auto relative"
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Glass Bubble */}
          <FluidGlassBubble
            navRef={navRef}
            hoveredIndex={hoveredIndex}
            isVisible={bubbleVisible}
            collapsed={!!collapsed}
          />

          {/* Main items */}
          <div className="space-y-0.5">
            {mainNavItems.map((item, index) => (
              <button
                key={item.label}
                data-nav-item
                onMouseEnter={() => setHoveredIndex(index)}
                className={cn(
                  'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                  'text-muted-foreground transition-colors duration-150',
                  collapsed && 'justify-center px-0',
                  hoveredIndex === index && 'text-foreground',
                  isActive(item.href) && 'sidebar-fluid-item-active text-primary font-semibold'
                )}
                onClick={() => handleNavClick(item)}
              >
                <span className={cn('transition-transform duration-150', hoveredIndex === index && 'scale-110')}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="my-3 border-t mx-1" />

          {/* Secondary items */}
          <div className="space-y-0.5">
            {secondaryNavItems.map((item, index) => {
              const globalIndex = mainNavItems.length + index
              return (
                <button
                  key={item.label}
                  data-nav-item
                  onMouseEnter={() => setHoveredIndex(globalIndex)}
                  className={cn(
                    'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                    'transition-colors duration-150',
                    collapsed && 'justify-center px-0',
                    item.variant === 'gradient'
                      ? cn('text-amber-600 dark:text-amber-400', hoveredIndex === globalIndex && 'text-amber-500 dark:text-amber-300')
                      : cn('text-muted-foreground', hoveredIndex === globalIndex && 'text-foreground'),
                    isActive(item.href) && item.variant !== 'gradient' && 'sidebar-fluid-item-active text-primary font-semibold'
                  )}
                  onClick={() => handleNavClick(item)}
                >
                  <span className={cn('transition-transform duration-150', hoveredIndex === globalIndex && 'scale-110')}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.variant === 'gradient' && (
                    <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
                      PRO
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Logout */}
          <div className="mt-3 pt-3 border-t mx-1">
            <button
              data-nav-item
              onMouseEnter={() => setHoveredIndex(logoutIndex)}
              className={cn(
                'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                'text-muted-foreground transition-colors duration-150',
                collapsed && 'justify-center px-0',
                hoveredIndex === logoutIndex && 'text-red-500 dark:text-red-400'
              )}
              onClick={onLogout}
            >
              <span className={cn('transition-transform duration-150', hoveredIndex === logoutIndex && 'scale-110')}>
                <LogOut className="h-5 w-5" />
              </span>
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  )
}
