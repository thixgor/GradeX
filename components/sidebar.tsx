'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
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

// Fluid glass bubble component - tracks cursor & snaps to items
function FluidGlassBubble({
  navRef,
  hoveredIndex,
  isInNav,
  mouseY,
  collapsed,
}: {
  navRef: React.RefObject<HTMLElement | null>
  hoveredIndex: number | null
  isInNav: boolean
  mouseY: number
  collapsed: boolean
}) {
  const [target, setTarget] = useState<{ top: number; height: number; width: number } | null>(null)

  // Spring physics for buttery smooth movement
  const springConfig = { stiffness: 400, damping: 35, mass: 0.8 }
  const y = useSpring(useMotionValue(0), springConfig)
  const height = useSpring(useMotionValue(0), { stiffness: 300, damping: 30, mass: 0.5 })
  const width = useSpring(useMotionValue(0), { stiffness: 300, damping: 30, mass: 0.5 })
  const scaleX = useSpring(useMotionValue(1), { stiffness: 500, damping: 30 })

  // Measure the hovered item and move bubble there
  useEffect(() => {
    if (hoveredIndex === null || !navRef.current) {
      return
    }

    const navEl = navRef.current
    const items = navEl.querySelectorAll<HTMLElement>('[data-nav-item]')
    const item = items[hoveredIndex]
    if (!item) return

    const navRect = navEl.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    const newTarget = {
      top: itemRect.top - navRect.top,
      height: itemRect.height,
      width: itemRect.width,
    }

    setTarget(newTarget)
    y.set(newTarget.top)
    height.set(newTarget.height)
    width.set(newTarget.width)
  }, [hoveredIndex, navRef, y, height, width, collapsed])

  // Subtle scale pulse on entry
  useEffect(() => {
    if (isInNav && hoveredIndex !== null) {
      scaleX.set(0.97)
      const timeout = setTimeout(() => scaleX.set(1), 80)
      return () => clearTimeout(timeout)
    }
  }, [hoveredIndex, isInNav, scaleX])

  // Light position follows cursor within the bubble
  const lightY = useSpring(useMotionValue(0.5), { stiffness: 200, damping: 25 })

  useEffect(() => {
    if (target && mouseY > 0) {
      const relativeY = (mouseY - target.top) / target.height
      lightY.set(Math.max(0, Math.min(1, relativeY)))
    }
  }, [mouseY, target, lightY])

  return (
    <AnimatePresence>
      {isInNav && hoveredIndex !== null && (
        <motion.div
          className="liquid-glass-bubble"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: collapsed ? 4 : 6,
            right: collapsed ? 4 : 6,
            y,
            height,
            scaleX,
            borderRadius: 14,
            zIndex: 0,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          {/* Main glass layer */}
          <div className="liquid-glass-surface" />
          {/* Top refraction streak */}
          <div className="liquid-glass-refraction-top" />
          {/* Bottom subtle edge */}
          <div className="liquid-glass-refraction-bottom" />
          {/* Cursor-reactive light spot */}
          <motion.div
            className="liquid-glass-light-spot"
            style={{
              top: lightY.get() ? `${lightY.get() * 100}%` : '50%',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
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
  const navRef = useRef<HTMLElement>(null)

  // Fluid bubble state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isInNav, setIsInNav] = useState(false)
  const [mouseY, setMouseY] = useState(0)

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
    {
      icon: <Gamepad2 className="h-5 w-5" />,
      label: 'Games',
      href: '/games',
      badge: 'Novo',
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

  const allNavItems = [...mainNavItems, ...secondaryNavItems]
  // Logout is a separate item at index = allNavItems.length
  const logoutIndex = allNavItems.length

  const handleNavClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick()
    } else if (item.href) {
      router.push(item.href)
    }
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  // Track mouse within nav area
  const handleNavMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return
    const navRect = navRef.current.getBoundingClientRect()
    const relY = e.clientY - navRect.top
    setMouseY(relY)
  }, [])

  const handleNavMouseEnter = useCallback(() => {
    setIsInNav(true)
  }, [])

  const handleNavMouseLeave = useCallback(() => {
    setIsInNav(false)
    setHoveredIndex(null)
  }, [])

  const handleItemHover = useCallback((index: number) => {
    setHoveredIndex(index)
  }, [])

  return (
    <>
      {/* Mobile Overlay */}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse?.(!collapsed)}
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

          {!collapsed && examsRemaining !== null && examsLimit !== null && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {examsRemaining} / {examsLimit} provas restantes hoje
            </p>
          )}
        </div>

        {/* Main Navigation with Fluid Glass Bubble */}
        <nav
          ref={navRef}
          className="flex-1 p-3 space-y-1 overflow-y-auto relative"
          onMouseMove={handleNavMouseMove}
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
        >
          {/* The floating glass bubble */}
          <FluidGlassBubble
            navRef={navRef}
            hoveredIndex={hoveredIndex}
            isInNav={isInNav}
            mouseY={mouseY}
            collapsed={!!collapsed}
          />

          {/* Main nav items */}
          {mainNavItems.map((item, index) => (
            <button
              key={index}
              data-nav-item
              onMouseEnter={() => handleItemHover(index)}
              className={cn(
                'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                'text-muted-foreground transition-colors duration-200',
                collapsed && 'justify-center px-0',
                hoveredIndex === index && 'text-foreground',
                isActive(item.href) && 'sidebar-fluid-item-active text-primary font-semibold'
              )}
              onClick={() => handleNavClick(item)}
            >
              <span className={cn(
                'transition-transform duration-200',
                hoveredIndex === index && 'scale-110'
              )}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="my-4 border-t" />

          {/* Secondary nav items */}
          {secondaryNavItems.map((item, index) => {
            const globalIndex = mainNavItems.length + index
            return (
              <button
                key={index}
                data-nav-item
                onMouseEnter={() => handleItemHover(globalIndex)}
                className={cn(
                  'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                  'transition-colors duration-200',
                  collapsed && 'justify-center px-0',
                  item.variant === 'gradient'
                    ? cn(
                        'text-amber-600 dark:text-amber-400',
                        hoveredIndex === globalIndex && 'text-amber-500 dark:text-amber-300'
                      )
                    : cn(
                        'text-muted-foreground',
                        hoveredIndex === globalIndex && 'text-foreground'
                      ),
                  isActive(item.href) && item.variant !== 'gradient' && 'sidebar-fluid-item-active text-primary font-semibold'
                )}
                onClick={() => handleNavClick(item)}
              >
                <span className={cn(
                  'transition-transform duration-200',
                  hoveredIndex === globalIndex && 'scale-110'
                )}>
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

          {/* Logout inside nav for bubble tracking */}
          <div className="mt-auto pt-4 border-t">
            <button
              data-nav-item
              onMouseEnter={() => handleItemHover(logoutIndex)}
              className={cn(
                'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
                'text-muted-foreground transition-colors duration-200',
                collapsed && 'justify-center px-0',
                hoveredIndex === logoutIndex && 'text-red-500 dark:text-red-400'
              )}
              onClick={onLogout}
            >
              <span className={cn(
                'transition-transform duration-200',
                hoveredIndex === logoutIndex && 'scale-110'
              )}>
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
