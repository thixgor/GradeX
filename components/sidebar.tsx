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
  BookOpen,
  Network,
  Ticket,
} from 'lucide-react'
import type { SidebarSectionKey, SidebarSectionSettings } from '@/lib/sidebar-sections'

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
  sidebarSections?: SidebarSectionSettings | null
}

interface NavItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: string
  variant?: 'default' | 'primary' | 'gradient'
  sectionKey?: SidebarSectionKey
}

// Shared easing & duration for all sidebar collapse animations
const SB_DUR = '400ms'
const SB_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

// ─── Fluid Glass Bubble ─────────────────────────────────────
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

    bubbleY.set(itemRect.top - navRect.top + scrollTop)
    bubbleH.set(itemRect.height)

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

// ─── Nav Item ────────────────────────────────────────────────
// Labels/badges collapse via pure CSS transitions synced with the sidebar width.
// No AnimatePresence on text — avoids layout-shift bugs (e.g. Games icon jump).
function NavItemButton({
  item,
  index,
  hoveredIndex,
  pressedIndex,
  collapsed,
  isItemActive,
  onHover,
  onPress,
  onRelease,
  onClick,
  staggerDelay,
  skipEntrance,
}: {
  item: NavItem
  index: number
  hoveredIndex: number | null
  pressedIndex: number | null
  collapsed: boolean
  isItemActive: boolean
  onHover: (index: number) => void
  onPress: (index: number) => void
  onRelease: () => void
  onClick: () => void
  staggerDelay: number
  // On remount after a route change the whole sidebar re-renders; replaying the
  // staggered slide-in every navigation is what reads as "flickering". After the
  // first mount of the session we skip the entrance and the item is simply there.
  skipEntrance: boolean
}) {
  const isHovered = hoveredIndex === index
  const isPressed = pressedIndex === index
  const isGradient = item.variant === 'gradient'
  const isLogout = item.label === 'Sair'

  // Stagger: each item's label fades slightly after the previous
  const staggerMs = index * 25

  return (
    <motion.button
      data-nav-item
      initial={skipEntrance ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0, scale: isPressed ? 0.97 : 1 }}
      transition={
        skipEntrance
          ? { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
          : { duration: 0.35, delay: staggerDelay, ease: [0.16, 1, 0.3, 1] }
      }
      onMouseEnter={() => onHover(index)}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch' || event.pointerType === 'pen') onPress(index)
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
      className={cn(
        'sidebar-fluid-item w-full flex items-center h-11 rounded-[14px] cursor-pointer relative z-[1]',
        'select-none overflow-hidden transition-[background-color,box-shadow] duration-150',
        isLogout
          ? cn('text-muted-foreground', (isHovered || isPressed) && 'text-red-500 dark:text-red-400', isPressed && 'bg-red-500/10 shadow-inner')
          : isGradient
            ? cn('text-amber-600 dark:text-amber-400', (isHovered || isPressed) && 'text-amber-500 dark:text-amber-300', isPressed && 'bg-amber-500/[0.12] shadow-inner')
            : cn('text-muted-foreground', (isHovered || isPressed) && 'text-foreground', isPressed && 'bg-primary/10 shadow-inner ring-1 ring-primary/15'),
        isItemActive && !isGradient && !isLogout && 'sidebar-fluid-item-active text-primary font-semibold'
      )}
      style={{
        paddingLeft: collapsed ? 0 : 12,
        paddingRight: collapsed ? 0 : 12,
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: `padding ${SB_DUR} ${SB_EASE}, gap ${SB_DUR} ${SB_EASE}, color 150ms ease`,
      }}
      onClick={onClick}
    >
      {/* Icon with spring bounce */}
      <motion.span
        animate={{
          scale: isPressed ? 0.9 : isHovered ? 1.15 : 1,
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

      {/* Label — always rendered, collapsed via CSS max-width + opacity */}
      <span
        className="truncate text-sm font-medium whitespace-nowrap"
        style={{
          maxWidth: collapsed ? 0 : 200,
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transition: collapsed
            ? `opacity 150ms ${SB_EASE} ${staggerMs}ms, max-width ${SB_DUR} ${SB_EASE}`
            : `opacity 250ms ${SB_EASE} ${180 + staggerMs}ms, max-width ${SB_DUR} ${SB_EASE}`,
        }}
      >
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && (
        <span
          className="text-[10px] bg-primary/10 text-primary rounded-full whitespace-nowrap"
          style={{
            maxWidth: collapsed ? 0 : 100,
            opacity: collapsed ? 0 : 1,
            paddingLeft: collapsed ? 0 : 8,
            paddingRight: collapsed ? 0 : 8,
            paddingTop: collapsed ? 0 : 2,
            paddingBottom: collapsed ? 0 : 2,
            overflow: 'hidden',
            transition: `opacity 150ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}, padding ${SB_DUR} ${SB_EASE}`,
          }}
        >
          {item.badge}
        </span>
      )}

      {/* Gradient PRO badge */}
      {isGradient && (
        <span
          className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text whitespace-nowrap"
          style={{
            maxWidth: collapsed ? 0 : 40,
            opacity: collapsed ? 0 : (isHovered ? 1 : 0.8),
            overflow: 'hidden',
            transition: `opacity 200ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        >
          PRO
        </span>
      )}
    </motion.button>
  )
}

// ─── Module-level state (survives component remount across navigations) ───
let _mouseInsideSidebar = false
let _lastClickedIndex: number | null = null
// True once the sidebar has mounted at least once this session. Because AppShell
// (and the sidebar with it) is mounted per-page, every navigation remounts this
// component; without this flag the entrance stagger replays on each route change
// and reads as flickering. First mount animates in; every later mount is instant.
let _hasMountedOnce = false

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
  sidebarSections,
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(_lastClickedIndex)
  const [isInNav, setIsInNav] = useState(_mouseInsideSidebar)
  const [pressedIndex, setPressedIndex] = useState<number | null>(null)
  const [canCollapse, setCanCollapse] = useState(false)

  // Snapshot the "already mounted" flag before flipping it, so the first mount
  // still animates in while every subsequent navigation renders the nav instantly.
  const skipEntranceRef = useRef(_hasMountedOnce)
  useEffect(() => {
    _hasMountedOnce = true
  }, [])

  const isAdmin = user?.role === 'admin'
  const isCollapsed = !!collapsed && canCollapse

  const sectionIsVisible = (sectionKey?: SidebarSectionKey) => {
    if (!sectionKey || isAdmin) return true
    return sidebarSections?.[sectionKey] !== false
  }

  const configuredMainNavItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: 'Início', href: '/dashboard' },
    { icon: <FileText className="h-5 w-5" />, label: 'Provas', href: '/provas', sectionKey: 'provas' },
    {
      icon: <Database className="h-5 w-5" />,
      label: 'Banco de Questões',
      href: '/banco-questoes',
      badge: user?.accountType !== 'premium' && !isAdmin ? '5 Questões' : undefined,
      sectionKey: 'bancoQuestoes',
    },
    { icon: <Video className="h-5 w-5" />, label: 'Aulas', href: '/aulas', sectionKey: 'aulas' },
    { icon: <Brain className="h-5 w-5" />, label: 'Flashcards', href: '/flashcards', sectionKey: 'flashcards' },
    { icon: <Network className="h-5 w-5" />, label: 'Mapas Mentais', href: '/mapa-mental', badge: 'Novo', sectionKey: 'mapaMental' },
    { icon: <BookMarked className="h-5 w-5" />, label: 'Cronogramas', href: '/cronogramas', sectionKey: 'cronogramas' },
    { icon: <MessageCircle className="h-5 w-5" />, label: 'Fórum', href: '/forum', sectionKey: 'forum' },
    { icon: <Gamepad2 className="h-5 w-5" />, label: 'Games', href: '/games', badge: 'Novo', sectionKey: 'games' },
    { icon: <HeartPulse className="h-5 w-5" />, label: 'Manual Clínico', href: '/manual-clinico', sectionKey: 'manualClinico' },
    { icon: <BookOpen className="h-5 w-5" />, label: 'Materiais', href: '/materiais', badge: 'Novo', sectionKey: 'materiais' },
    { icon: <Ticket className="h-5 w-5" />, label: 'Rifas & Sorteios', href: '/rifas', badge: 'Novo', sectionKey: 'rifas' },
  ]

  const mainNavItems = configuredMainNavItems.filter(item => sectionIsVisible(item.sectionKey))

  const secondaryNavItems: NavItem[] = [
    { icon: <UserIcon className="h-5 w-5" />, label: 'Meu Perfil', href: '/profile' },
    { icon: <ShoppingCart className="h-5 w-5" />, label: 'Upgrade', href: '/buy', variant: 'gradient' },
  ]

  if (isAdmin) {
    secondaryNavItems.push({ icon: <Settings className="h-5 w-5" />, label: 'Painel Admin', href: '/admin' })
  }

  const logoutIndex = mainNavItems.length + secondaryNavItems.length

  const handleNavClick = (item: NavItem, index: number) => {
    _lastClickedIndex = index
    setPressedIndex(null)
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

  const handleNavPress = useCallback((index: number) => {
    setPressedIndex(index)
    setHoveredIndex(index)
  }, [])

  const handleNavRelease = useCallback(() => {
    setPressedIndex(null)
  }, [])

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setCanCollapse(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const bubbleVisible = isInNav || pressedIndex !== null

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
          'pwa-safe-top pwa-safe-bottom sidebar-glass fixed inset-y-0 left-0 z-50 h-screen min-h-[100svh] max-h-[100dvh] flex flex-col overflow-hidden',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          'w-[min(280px,88vw)]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
        style={{
          transition: `width ${SB_DUR} ${SB_EASE}, transform ${SB_DUR} ${SB_EASE}`,
        }}
      >
        {/* Header */}
        <div
          className="border-b flex items-center shrink-0"
          style={{
            padding: isCollapsed ? '12px 8px' : '16px',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            flexDirection: isCollapsed ? 'column' : 'row',
            gap: isCollapsed ? 8 : 0,
            transition: `padding ${SB_DUR} ${SB_EASE}`,
          }}
        >
          <motion.div
            className="cursor-pointer flex-shrink-0"
            onClick={() => router.push('/?landing=true')}
            whileHover={{ scale: 1.02, opacity: 0.85 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCollapsed ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Logo variant="icon" size="lg" />
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Logo variant="full" size="md" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8">
            <X className="h-5 w-5" />
          </Button>

          {/* Collapse toggle — chevron rotates smoothly instead of swapping icons */}
          <div className="hidden lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapse?.(!collapsed)}
              className="h-7 w-7"
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        </div>

        {/* User Info */}
        <AnimatePresence initial={false}>
          {user && !isCollapsed && (
            <motion.div
              className="p-4 border-b overflow-hidden shrink-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0"
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
        <div className="p-3 border-b shrink-0 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={onCreateExam}
              disabled={tierLimitExceeded}
              className="w-full rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold overflow-hidden shadow-sm"
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : 12,
                paddingLeft: isCollapsed ? 0 : undefined,
                paddingRight: isCollapsed ? 0 : undefined,
                transition: `gap ${SB_DUR} ${SB_EASE}, padding ${SB_DUR} ${SB_EASE}`,
              }}
            >
              <motion.span
                animate={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="flex-shrink-0"
              >
                <Plus className="h-5 w-5" />
              </motion.span>
              <span
                className="whitespace-nowrap overflow-hidden"
                style={{
                  maxWidth: isCollapsed ? 0 : 150,
                  opacity: isCollapsed ? 0 : 1,
                  transition: `opacity 200ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
                }}
              >
                Nova Prova
              </span>
            </Button>
          </motion.div>

          {/* Exams remaining counter */}
          <div
            className="overflow-hidden"
            style={{
              maxHeight: isCollapsed ? 0 : 30,
              opacity: isCollapsed ? 0 : 1,
              marginTop: isCollapsed ? 0 : 8,
              transition: `max-height ${SB_DUR} ${SB_EASE}, opacity 200ms ${SB_EASE}, margin ${SB_DUR} ${SB_EASE}`,
            }}
          >
            {examsRemaining !== null && examsLimit !== null && (
              <p className="text-xs text-muted-foreground text-center whitespace-nowrap">
                {examsRemaining} / {examsLimit} provas restantes hoje
              </p>
            )}
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <nav
          ref={navRef}
          className="flex-1 min-h-0 px-3 py-2 overflow-y-auto overscroll-contain relative select-none [-webkit-overflow-scrolling:touch]"
          style={{ touchAction: 'pan-y' }}
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
        >
          <FluidGlassBubble
            navRef={navRef}
            hoveredIndex={hoveredIndex}
            isVisible={bubbleVisible}
            collapsed={isCollapsed}
          />

          <div className="space-y-0.5">
            {mainNavItems.map((item, index) => (
              <NavItemButton
                key={item.label}
                item={item}
                index={index}
                hoveredIndex={hoveredIndex}
                pressedIndex={pressedIndex}
                collapsed={isCollapsed}
                isItemActive={isActive(item.href)}
                onHover={setHoveredIndex}
                onPress={handleNavPress}
                onRelease={handleNavRelease}
                onClick={() => handleNavClick(item, index)}
                staggerDelay={index * 0.03}
                skipEntrance={skipEntranceRef.current}
              />
            ))}
          </div>

          <div className="my-3 border-t mx-1" />

          <div className="space-y-0.5">
            {secondaryNavItems.map((item, index) => {
              const globalIndex = mainNavItems.length + index
              return (
                <NavItemButton
                  key={item.label}
                  item={item}
                  index={globalIndex}
                  hoveredIndex={hoveredIndex}
                  pressedIndex={pressedIndex}
                  collapsed={isCollapsed}
                  isItemActive={isActive(item.href)}
                  onHover={setHoveredIndex}
                  onPress={handleNavPress}
                  onRelease={handleNavRelease}
                  onClick={() => handleNavClick(item, globalIndex)}
                  staggerDelay={(mainNavItems.length + index) * 0.03}
                  skipEntrance={skipEntranceRef.current}
                />
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t mx-1">
            <NavItemButton
              item={{ icon: <LogOut className="h-5 w-5" />, label: 'Sair' }}
              index={logoutIndex}
              hoveredIndex={hoveredIndex}
              pressedIndex={pressedIndex}
              collapsed={isCollapsed}
              isItemActive={false}
              onHover={setHoveredIndex}
              onPress={handleNavPress}
              onRelease={handleNavRelease}
              onClick={() => {
                handleNavRelease()
                onLogout()
              }}
              staggerDelay={(logoutIndex) * 0.03}
              skipEntrance={skipEntranceRef.current}
            />
          </div>
        </nav>
      </aside>
    </>
  )
}
