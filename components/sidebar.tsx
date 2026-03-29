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
  HeartPulse,
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

// ─── Nav Item with animations ────────────────────────────────
// Staggered entrance + icon bounce on hover + smooth label slide
function NavItemButton({
  item,
  index,
  hoveredIndex,
  collapsed,
  isItemActive,
  onHover,
  onClick,
  staggerDelay,
}: {
  item: NavItem
  index: number
  hoveredIndex: number | null
  collapsed: boolean
  isItemActive: boolean
  onHover: (index: number) => void
  onClick: () => void
  staggerDelay: number
}) {
  const isHovered = hoveredIndex === index
  const isGradient = item.variant === 'gradient'
  const isLogout = item.label === 'Sair'

  return (
    <motion.button
      data-nav-item
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.35,
        delay: staggerDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => onHover(index)}
      className={cn(
        'sidebar-fluid-item w-full flex items-center gap-3 h-11 px-3 text-sm font-medium rounded-[14px] cursor-pointer relative z-[1]',
        'transition-colors duration-150 select-none',
        collapsed && 'justify-center px-0',
        isLogout
          ? cn('text-muted-foreground', isHovered && 'text-red-500 dark:text-red-400')
          : isGradient
            ? cn('text-amber-600 dark:text-amber-400', isHovered && 'text-amber-500 dark:text-amber-300')
            : cn('text-muted-foreground', isHovered && 'text-foreground'),
        isItemActive && !isGradient && !isLogout && 'sidebar-fluid-item-active text-primary font-semibold'
      )}
      onClick={onClick}
    >
      {/* Icon with spring bounce */}
      <motion.span
        animate={{
          scale: isHovered ? 1.15 : 1,
          rotate: isHovered ? [-6, 0] : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 17 },
          rotate: { type: 'spring', stiffness: 300, damping: 12 },
        }}
        className="flex-shrink-0"
      >
        {item.icon}
      </motion.span>

      {/* Label with slide-in */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            className="truncate"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto', x: isHovered ? 2 : 0 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      <AnimatePresence>
        {!collapsed && item.badge && (
          <motion.span
            className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: staggerDelay + 0.1 }}
          >
            {item.badge}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Gradient PRO badge */}
      <AnimatePresence>
        {!collapsed && isGradient && (
          <motion.span
            className="ml-auto text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            PRO
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Module-level state (survives component remount across navigations) ───
let _mouseInsideSidebar = false
let _lastClickedIndex: number | null = null

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
  // Initialize from module-level vars so bubble persists across page navigations
  // (each page mounts a new AppShell → new Sidebar instance)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(_lastClickedIndex)
  const [isInNav, setIsInNav] = useState(_mouseInsideSidebar)
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
    { icon: <HeartPulse className="h-5 w-5" />, label: 'Manual Clínico', href: '/manual-clinico' },
  ]

  const secondaryNavItems: NavItem[] = [
    { icon: <UserIcon className="h-5 w-5" />, label: 'Meu Perfil', href: '/profile' },
    { icon: <ShoppingCart className="h-5 w-5" />, label: 'Upgrade', href: '/buy', variant: 'gradient' },
  ]

  if (isAdmin) {
    secondaryNavItems.push({ icon: <Settings className="h-5 w-5" />, label: 'Painel Admin', href: '/admin' })
  }

  const logoutIndex = mainNavItems.length + secondaryNavItems.length

  const handleNavClick = (item: NavItem, index: number) => {
    // Remember clicked index at module level so it survives remount
    _lastClickedIndex = index
    setHoveredIndex(index)

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
  const handleNavMouseEnter = useCallback(() => {
    _mouseInsideSidebar = true
    setIsInNav(true)
  }, [])
  const handleNavMouseLeave = useCallback(() => {
    _mouseInsideSidebar = false
    _lastClickedIndex = null
    setIsInNav(false)
    setHoveredIndex(null)
  }, [])

  // ─── Touch handlers (mobile) ───
  // Prevents: page scroll, page refresh (pull-to-refresh), text selection
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
    e.preventDefault() // prevent text selection + scroll
    setIsTouching(true)
    const touch = e.touches[0]
    const idx = findItemIndexAtY(touch.clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // prevent page scroll + pull-to-refresh
    const touch = e.touches[0]
    const idx = findItemIndexAtY(touch.clientY)
    if (idx !== null) setHoveredIndex(idx)
  }, [findItemIndexAtY])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault() // prevent ghost click / page jump
    // Navigate to the last hovered item
    if (hoveredIndex !== null && navRef.current) {
      const items = navRef.current.querySelectorAll<HTMLElement>('[data-nav-item]')
      const item = items[hoveredIndex]
      if (item) item.click()
    }
    setIsTouching(false)
    setHoveredIndex(null)
  }, [hoveredIndex])

  // ─── Re-establish bubble after navigation ───
  // When pathname changes, a new Sidebar instance may mount. The module-level
  // vars (_mouseInsideSidebar, _lastClickedIndex) survive across mounts,
  // so initial state is already set. This effect handles subsequent pathname
  // changes within the same mount.
  useEffect(() => {
    if (_lastClickedIndex !== null) {
      setIsInNav(true)
      setHoveredIndex(_lastClickedIndex)
      return
    }
    if (!_mouseInsideSidebar) return
    setIsInNav(true)

    const allItems = [...mainNavItems, ...secondaryNavItems]
    const activeIdx = allItems.findIndex(item => isActive(item.href))
    if (activeIdx !== -1) {
      setHoveredIndex(activeIdx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const bubbleVisible = isInNav || isTouching

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-background border-r flex flex-col',
          'transition-[width,transform] duration-[350ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          'w-[280px]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={cn(
          'border-b transition-[padding] duration-[350ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          collapsed
            ? 'flex flex-col items-center gap-2 py-3 px-2'
            : 'flex items-center justify-between p-4'
        )}>
          <motion.div
            className="cursor-pointer"
            onClick={() => router.push('/?landing=true')}
            whileHover={{ scale: 1.02, opacity: 0.85 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Logo variant="icon" size="lg" />
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Logo variant="full" size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8">
            <X className="h-5 w-5" />
          </Button>

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: collapsed ? 180 : -180 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="hidden lg:flex"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapse?.(!collapsed)}
              className="h-7 w-7"
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </motion.div>
        </div>

        {/* User Info */}
        <AnimatePresence>
          {user && !collapsed && (
            <motion.div
              className="p-4 border-b"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold"
                  whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Exam Button */}
        <div className="p-3 border-b">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={onCreateExam}
              disabled={tierLimitExceeded}
              className={cn(
                'w-full justify-start gap-3 bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white font-semibold soul-light soul-light-brand',
                collapsed && 'justify-center px-0'
              )}
            >
              <motion.span
                animate={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Plus className="h-5 w-5" />
              </motion.span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Nova Prova
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          <AnimatePresence>
            {!collapsed && examsRemaining !== null && examsLimit !== null && (
              <motion.p
                className="text-xs text-muted-foreground mt-2 text-center overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {examsRemaining} / {examsLimit} provas restantes hoje
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Navigation ─── */}
        <nav
          ref={navRef}
          className="flex-1 px-3 py-2 overflow-y-auto relative select-none"
          style={{ touchAction: 'none' }}
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
              <NavItemButton
                key={item.label}
                item={item}
                index={index}
                hoveredIndex={hoveredIndex}
                collapsed={!!collapsed}
                isItemActive={isActive(item.href)}
                onHover={setHoveredIndex}
                onClick={() => handleNavClick(item, index)}
                staggerDelay={index * 0.03}
              />
            ))}
          </div>

          <div className="my-3 border-t mx-1" />

          {/* Secondary items */}
          <div className="space-y-0.5">
            {secondaryNavItems.map((item, index) => {
              const globalIndex = mainNavItems.length + index
              return (
                <NavItemButton
                  key={item.label}
                  item={item}
                  index={globalIndex}
                  hoveredIndex={hoveredIndex}
                  collapsed={!!collapsed}
                  isItemActive={isActive(item.href)}
                  onHover={setHoveredIndex}
                  onClick={() => handleNavClick(item, globalIndex)}
                  staggerDelay={(mainNavItems.length + index) * 0.03}
                />
              )
            })}
          </div>

          {/* Logout */}
          <div className="mt-3 pt-3 border-t mx-1">
            <NavItemButton
              item={{ icon: <LogOut className="h-5 w-5" />, label: 'Sair' }}
              index={logoutIndex}
              hoveredIndex={hoveredIndex}
              collapsed={!!collapsed}
              isItemActive={false}
              onHover={setHoveredIndex}
              onClick={onLogout}
              staggerDelay={(logoutIndex) * 0.03}
            />
          </div>
        </nav>
      </aside>
    </>
  )
}
