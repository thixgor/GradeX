'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { estiloDoChip } from '@/components/sidebar-cores'
import { cn } from '@/lib/utils'
/*
 * Ícones do Phosphor, não do lucide.
 *
 * A coluna do menu é a moldura permanente da plataforma, e os ícones das
 * seções passaram para o Phosphor (ver components/sidebar-icon-map.ts). Estes
 * aqui — casa, carrinho, lupa, engrenagem — são os do próprio menu, e precisam
 * vir da MESMA família: dois traços diferentes empilhados na mesma coluna de
 * 72px se leem como defeito, não como variedade.
 */
import { CaretDown } from '@phosphor-icons/react/dist/ssr/CaretDown'
import { CaretLeft } from '@phosphor-icons/react/dist/ssr/CaretLeft'
import { CaretRight } from '@phosphor-icons/react/dist/ssr/CaretRight'
import { Gear as Settings } from '@phosphor-icons/react/dist/ssr/Gear'
import { House as Home } from '@phosphor-icons/react/dist/ssr/House'
import { Lightning as Zap } from '@phosphor-icons/react/dist/ssr/Lightning'
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus'
import { ShoppingCart } from '@phosphor-icons/react/dist/ssr/ShoppingCart'
import { SignOut as LogOut } from '@phosphor-icons/react/dist/ssr/SignOut'
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User'
import { X } from '@phosphor-icons/react/dist/ssr/X'
import {
  getVisibleSidebarSections,
  type SidebarSectionKey,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import {
  buildSidebarTree,
  normalizeSidebarGroups,
  normalizeSidebarSectionGroups,
  type SidebarGroupDefinition,
  type SidebarSectionGroups,
  type SidebarTreeNode,
} from '@/lib/sidebar-groups'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'
import { getSidebarIconComponent } from '@/components/sidebar-icon-map'
import { useCargos } from '@/hooks/use-cargos'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { ScrollRoller } from '@/components/ui/scroll-roller'
import { BuscaGlobal } from '@/components/busca/busca-global'
import { avatarPorId } from '@/lib/monitorias/avatares'
import { XpDoMenu } from '@/components/xp/xp-do-menu'
import { Trophy } from '@phosphor-icons/react/dist/ssr/Trophy'

interface SidebarProps {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    accountType?: 'gratuito' | 'trial' | 'plus' | 'premium' | 'essential'
    /** Retrato da galeria (id do catálogo). */
    avatar?: string
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
  sidebarSectionOrder?: SidebarSectionOrder | null
  sidebarSectionIcons?: SidebarSectionIcons | null
  sidebarGroups?: SidebarGroupDefinition[] | null
  sidebarSectionGroups?: SidebarSectionGroups | null
}

interface NavItem {
  /** Identidade estável do item. Substitui o índice numérico de antes: com os
   *  grupos abrindo e fechando, a posição na lista deixou de ser um endereço
   *  confiável (era o que fazia a bolha de vidro pousar no item errado). */
  id: string
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: string
  variant?: 'default' | 'primary' | 'gradient'
  sectionKey?: SidebarSectionKey
  /** Chave da cor do chip (ver `components/sidebar-cores.ts`). */
  cor?: string
}

/** Selo fixo ao lado do rótulo. `undefined` = sem selo. */
const SECTION_BADGES: Partial<Record<SidebarSectionKey, string>> = {
  mapaMental: 'Novo',
  games: 'Novo',
  materiais: 'Novo',
  rifas: 'Novo',
  monitorias: 'Novo',
  embaixadores: 'Novo',
}

/**
 * O peso dos ícones do menu.
 *
 * `fill`, branco, sobre o squircle colorido de cada área (ver
 * `sidebar-cores.ts`): é o desenho dos Ajustes do iPhone, e o que faz a coluna
 * se ler como um conjunto de apps, não como uma lista de links. O contorno
 * fino de antes some sobre fundo colorido — a 20 px, só a forma cheia
 * aguenta o contraste.
 *
 * "Onde eu estou" deixou de depender da troca de peso: a linha ativa ganha a
 * lente de vidro e o chip ganha um anel (ver `.sidebar-fluid-item-active`).
 */
const PESO_ICONE = 'fill' as const

// Shared easing & duration for all sidebar collapse animations
const SB_DUR = '400ms'
const SB_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const OPEN_GROUPS_STORAGE_KEY = 'gradex:sidebar-grupos-abertos'

/** `useLayoutEffect` no cliente, `useEffect` no servidor — evita o aviso do SSR. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// ─── Fluid Glass Bubble ─────────────────────────────────────
function FluidGlassBubble({
  navRef,
  hoveredId,
  isVisible,
  collapsed,
  /** Muda sempre que a lista muda de altura (grupo abriu/fechou), para a bolha
   *  remedir a posição do item em vez de ficar pousada onde ele estava. */
  layoutVersion,
}: {
  navRef: React.RefObject<HTMLElement | null>
  hoveredId: string | null
  isVisible: boolean
  collapsed: boolean
  layoutVersion: number
}) {
  const springY = { stiffness: 500, damping: 38, mass: 0.6 }
  const springSize = { stiffness: 400, damping: 32, mass: 0.4 }

  const bubbleY = useSpring(useMotionValue(0), springY)
  const bubbleH = useSpring(useMotionValue(44), springSize)
  const squeeze = useSpring(useMotionValue(1), { stiffness: 600, damping: 28 })

  useEffect(() => {
    if (!hoveredId || !navRef.current) return

    const item = navRef.current.querySelector<HTMLElement>(`[data-nav-item="${hoveredId}"]`)
    if (!item) return

    const navRect = navRef.current.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const scrollTop = navRef.current.scrollTop

    bubbleY.set(itemRect.top - navRect.top + scrollTop)
    bubbleH.set(itemRect.height)

    squeeze.set(0.97)
    const t = setTimeout(() => squeeze.set(1), 60)
    return () => clearTimeout(t)
  }, [hoveredId, navRef, bubbleY, bubbleH, squeeze, collapsed, layoutVersion])

  return (
    <AnimatePresence>
      {isVisible && hoveredId && (
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
  hoveredId,
  pressedId,
  collapsed,
  isItemActive,
  onHover,
  onPress,
  onRelease,
  onClick,
  staggerIndex,
  skipEntrance,
  lite,
  /** Item dentro de um grupo: recua e ganha o fio-guia à esquerda. */
  nested,
  /** Seta do acordeão, quando o item é o cabeçalho de um grupo. */
  trailing,
  ariaExpanded,
}: {
  item: NavItem
  hoveredId: string | null
  pressedId: string | null
  collapsed: boolean
  isItemActive: boolean
  onHover: (item: NavItem, event: React.MouseEvent<HTMLButtonElement>) => void
  onPress: (item: NavItem) => void
  onRelease: () => void
  onClick: () => void
  staggerIndex: number
  // On remount after a route change the whole sidebar re-renders; replaying the
  // staggered slide-in every navigation is what reads as "flickering". After the
  // first mount of the session we skip the entrance and the item is simply there.
  skipEntrance: boolean
  // Modo Lite: os springs por item (escala, rotação, entrada escalonada) somam
  // ~20 animações simultâneas na abertura do menu — em aparelho fraco é o
  // momento em que a sidebar mais engasga. Aqui elas simplesmente não rodam.
  lite: boolean
  nested?: boolean
  trailing?: React.ReactNode
  ariaExpanded?: boolean
}) {
  const isHovered = hoveredId === item.id
  const isPressed = pressedId === item.id
  const isGradient = item.variant === 'gradient'
  const isLogout = item.id === 'action:logout'

  // Stagger: each item's label fades slightly after the previous
  const staggerMs = staggerIndex * 25

  return (
    <motion.button
      data-nav-item={item.id}
      aria-expanded={ariaExpanded}
      initial={skipEntrance || lite ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0, scale: !lite && isPressed ? 0.97 : 1 }}
      transition={
        lite
          ? { duration: 0 }
          : skipEntrance
            ? { duration: 0.15, ease: [0.16, 1, 0.3, 1] }
            : { duration: 0.35, delay: staggerIndex * 0.03, ease: [0.16, 1, 0.3, 1] }
      }
      onMouseEnter={(event) => onHover(item, event)}
      onPointerDown={(event) => {
        if (event.pointerType === 'touch' || event.pointerType === 'pen') onPress(item)
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
      className={cn(
        // h-12 no celular: alvo de toque de verdade (44px+). No desktop segue
        // compacto, onde o ponteiro é preciso.
        'sidebar-fluid-item w-full flex items-center h-12 lg:h-11 rounded-[14px] cursor-pointer relative z-[1]',
        'select-none overflow-hidden transition-[background-color,box-shadow] duration-150',
        isLogout
          ? cn('text-foreground/70', (isHovered || isPressed) && 'text-red-500 dark:text-red-400', isPressed && 'bg-red-500/10 shadow-inner')
          : isGradient
            ? cn('text-amber-700 dark:text-amber-400 font-semibold', (isHovered || isPressed) && 'text-amber-600 dark:text-amber-300', isPressed && 'bg-amber-500/[0.12] shadow-inner')
            // Rótulo em `foreground/80` no lugar de `muted-foreground`: o menu
            // inteiro em cinza claro era o que fazia os itens sumirem.
            : cn('text-foreground/80', (isHovered || isPressed) && 'text-foreground', isPressed && 'bg-primary/10 shadow-inner ring-1 ring-primary/15'),
        isItemActive && !isGradient && !isLogout && 'sidebar-fluid-item-active text-foreground font-semibold'
      )}
      style={{
        paddingLeft: collapsed ? 0 : nested ? 26 : 12,
        paddingRight: collapsed ? 0 : 12,
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: `padding ${SB_DUR} ${SB_EASE}, gap ${SB_DUR} ${SB_EASE}, color 150ms ease`,
      }}
      onClick={onClick}
    >
      {/* Icon with spring bounce */}
      <motion.span
        animate={
          lite
            ? { scale: 1, rotate: 0 }
            : {
                scale: isPressed ? 0.9 : isHovered ? 1.08 : 1,
                rotate: isHovered ? [-5, 0] : 0,
              }
        }
        transition={
          lite
            ? { duration: 0 }
            : {
                scale: { type: 'spring', stiffness: 400, damping: 17 },
                rotate: { type: 'spring', stiffness: 300, damping: 12 },
              }
        }
        className={cn('flex-shrink-0 sidebar-nav-chip', nested && 'sidebar-nav-chip-nested')}
        style={estiloDoChip(item.cor ?? 'inicio')}
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
          className="sidebar-nav-badge ml-auto text-[10px] rounded-full whitespace-nowrap"
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

      {trailing && (
        <span
          className={cn('ml-auto flex items-center', !item.badge && 'ml-auto')}
          style={{
            maxWidth: collapsed ? 0 : 24,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: `opacity 150ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        >
          {trailing}
        </span>
      )}
    </motion.button>
  )
}

// ─── Module-level state (survives component remount across navigations) ───
let _mouseInsideSidebar = false
let _lastClickedId: string | null = null
// True once the sidebar has mounted at least once this session. Because AppShell
// (and the sidebar with it) is mounted per-page, every navigation remounts this
// component; without this flag the entrance stagger replays on each route change
// and reads as flickering. First mount animates in; every later mount is instant.
let _hasMountedOnce = false
// Rotas do menu já aquecidas nesta sessão. Vive no módulo porque a sidebar
// remonta a cada navegação — num ref o conjunto seria perdido e o prefetch
// rodaria de novo toda vez.
//
// São dois conjuntos porque são dois prefetches diferentes. O aquecimento
// ocioso pede o parcial (`auto`) de todas as rotas; o hover/toque pede a página
// inteira (`full`) só da que o usuário está prestes a abrir. Um conjunto único
// faria o aquecimento bloquear o `full` do hover.
const _warmedRoutes = new Set<string>()
const _prefetchedRoutes = new Set<string>()

// Parcial: numa rota dinâmica, o servidor renderiza só os layouts até o
// `loading.tsx` e para ali. Numa rota estática, é o payload inteiro do CDN. É o
// que um `<Link>` faz por padrão. Sem `kind`, o `router.prefetch` do Next 14
// usa `full`. O valor é o do enum `PrefetchKind` do Next, que não é exportado
// por um caminho público.
const PREFETCH_PARCIAL = { kind: 'auto' } as unknown as Parameters<ReturnType<typeof useRouter>['prefetch']>[1]
// Grupos abertos/fechados. Mesmo motivo: sem este cache de módulo, cada
// navegação remontaria a sidebar com tudo fechado e só depois o efeito leria o
// localStorage — o grupo aberto piscaria fechado a cada clique.
let _openGroups: Record<string, boolean> | null = null

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
  sidebarSectionOrder,
  sidebarSectionIcons,
  sidebarGroups,
  sidebarSectionGroups,
}: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const { liteMode, preference: litePreference, toggleLiteMode } = useLiteMode()
  // Quais seções o cargo desta conta abre — decide o selo "5 Questões".
  const { liberaArea } = useCargos()

  const [hoveredId, setHoveredId] = useState<string | null>(_lastClickedId)
  const [isInNav, setIsInNav] = useState(_mouseInsideSidebar)
  const [pressedId, setPressedId] = useState<string | null>(null)
  const [canCollapse, setCanCollapse] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => _openGroups ?? {})
  const [layoutVersion, setLayoutVersion] = useState(0)
  // Rótulo flutuante do rail. A 72px o item é só um ícone: sem isto o menu
  // recolhido vira uma coluna de quatorze desenhos sem nome nenhum — e a
  // única pista de destino era o hover não existir. Os grupos já tinham o
  // painel lateral; as seções soltas não tinham nada.
  const [railTooltip, setRailTooltip] = useState<{ label: string; top: number } | null>(null)
  // Só ponteiro fino. Num tablet deitado o toque também dispara `mouseenter`,
  // mas nunca dispara o `mouseleave` correspondente: o rótulo ficaria pendurado
  // na tela depois que o dedo saísse.
  const [pontoFino, setPontoFino] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setPontoFino(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // Snapshot the "already mounted" flag before flipping it, so the first mount
  // still animates in while every subsequent navigation renders the nav instantly.
  const skipEntranceRef = useRef(_hasMountedOnce)
  useEffect(() => {
    _hasMountedOnce = true
  }, [])

  const isAdmin = user?.role === 'admin'
  const isCollapsed = !!collapsed && canCollapse

  // Label, href e ordem vêm das definições compartilhadas (lib/sidebar-sections),
  // que também são lidas no servidor e por isso não podem importar lucide. Aqui
  // fica só o metadado visual de cada seção. Antes esta lista era fixa no
  // componente, o que travava a ordem do menu e obrigava a editar código para
  // acrescentar uma área.
  const resolvedIcons = normalizeSidebarIcons(sidebarSectionIcons)

  const groups = useMemo(() => normalizeSidebarGroups(sidebarGroups), [sidebarGroups])
  const assignments = useMemo(
    () => normalizeSidebarSectionGroups(sidebarSectionGroups, groups),
    [sidebarSectionGroups, groups]
  )

  const isActive = useCallback(
    (href?: string) => {
      if (!href) return false
      if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
      return pathname.startsWith(href)
    },
    [pathname]
  )

  /** Item de menu a partir de uma seção configurada pelo admin. */
  const sectionToNavItem = useCallback(
    (section: { key: SidebarSectionKey; label: string; href: string }): NavItem => {
      const Icon = getSidebarIconComponent(resolvedIcons[section.key])
      return {
        id: `section:${section.key}`,
        icon: <Icon className="h-5 w-5" weight={PESO_ICONE} />,
        label: section.label,
        href: section.href,
        cor: section.key,
        badge:
          // O selo "5 Questões" é o saldo de quem não tem o Banco. Quem tem um
          // cargo que abre a seção — Plus+, Quest ou qualquer um criado em
          // `/admin/cargos` — não deve vê-lo: para ele seria uma mentira.
          section.key === 'bancoQuestoes'
            ? !liberaArea(user?.accountType, 'bancoQuestoes') && !isAdmin
              ? '5 Questões'
              : undefined
            : SECTION_BADGES[section.key],
        sectionKey: section.key,
      }
    },
    [resolvedIcons, isAdmin, user?.accountType, liberaArea]
  )

  const homeItem: NavItem = {
    id: 'section:inicio',
    icon: <Home className="h-5 w-5" weight={PESO_ICONE} />,
    label: 'Início',
    href: '/dashboard',
    cor: 'inicio',
  }

  // O ranking de XP vale para todas as seções — fica fixo, logo abaixo do Início.
  const rankingItem: NavItem = {
    id: 'section:ranking',
    icon: <Trophy className="h-5 w-5" weight={PESO_ICONE} />,
    label: 'Ranking',
    href: '/ranking',
    cor: 'ranking',
  }


  const tree: SidebarTreeNode[] = useMemo(
    () =>
      buildSidebarTree(
        getVisibleSidebarSections(sidebarSections, sidebarSectionOrder, isAdmin),
        groups,
        assignments
      ),
    [sidebarSections, sidebarSectionOrder, isAdmin, groups, assignments]
  )

  /** Um grupo com a rota atual dentro fica aberto à força: esconder a página em
   *  que o usuário está seria o pior efeito colateral possível do acordeão. */
  const groupHasActiveSection = useCallback(
    (node: Extract<SidebarTreeNode, { type: 'group' }>) =>
      node.sections.some((section) => isActive(section.href)),
    [isActive]
  )

  const isGroupOpen = useCallback(
    (node: Extract<SidebarTreeNode, { type: 'group' }>) => {
      if (groupHasActiveSection(node)) return true
      const stored = openGroups[node.group.key]
      return stored === undefined ? node.group.defaultOpen : stored
    },
    [openGroups, groupHasActiveSection]
  )

  const toggleGroup = useCallback((groupKey: string, open: boolean) => {
    setOpenGroups((current) => {
      const next = { ...current, [groupKey]: open }
      _openGroups = next
      try {
        window.localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // modo privado / storage cheio — o menu segue funcionando na sessão
      }
      return next
    })
    setLayoutVersion((v) => v + 1)
  }, [])

  // Lê a preferência salva uma única vez por sessão. Em `useState` direto isso
  // divergiria da renderização do servidor (o HTML sai sem localStorage).
  useEffect(() => {
    if (_openGroups) return
    try {
      const raw = window.localStorage.getItem(OPEN_GROUPS_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        _openGroups = parsed as Record<string, boolean>
        setOpenGroups(parsed as Record<string, boolean>)
      } else {
        _openGroups = {}
      }
    } catch {
      _openGroups = {}
    }
  }, [])

  const secondaryNavItems: NavItem[] = [
    { id: 'nav:profile', icon: <UserIcon className="h-5 w-5" weight={PESO_ICONE} />, label: 'Meu Perfil', href: '/profile', cor: 'perfil' },
  ]

  if (isAdmin) {
    secondaryNavItems.push({
      id: 'nav:admin',
      icon: <Settings className="h-5 w-5" weight={PESO_ICONE} />,
      label: 'Painel Admin',
      href: '/admin',
      cor: 'admin',
    })
  }

  // Modo Lite junto do perfil, com o estado à vista (ON/OFF/AUTO). Ficava só
  // no fim do /profile — quem tem aparelho fraco nunca chegava lá.
  const liteNavItem: NavItem = {
    id: 'action:lite',
    icon: <Zap className={cn('h-5 w-5', liteMode && 'fill-current')} weight={PESO_ICONE} />,
    label: 'Modo Lite',
    badge: liteMode ? (litePreference === 'auto' ? 'Auto' : 'Ativo') : 'Off',
    onClick: toggleLiteMode,
    cor: 'lite',
  }

  const upgradeItem: NavItem = {
    id: 'nav:upgrade',
    icon: <ShoppingCart className="h-5 w-5" weight={PESO_ICONE} />,
    label: 'Upgrade',
    href: '/buy',
    variant: 'gradient',
    cor: 'upgrade',
  }

  // ── Aquecimento das rotas do menu ────────────────────────────────────
  // Os itens são <button> com router.push, não <Link>, então o Next nunca
  // aquecia nada: o chunk JS e o payload RSC do destino só começavam a baixar
  // DEPOIS do clique. Aqui pedimos o prefetch de todas as rotas visíveis do
  // menu assim que o browser fica ocioso — uma única vez por sessão.
  //
  // O aquecimento é PARCIAL. Ele pedia `full`, o padrão do `router.prefetch`
  // no Next 14, e numa rota dinâmica (`/provas`, `/banco-questoes`,
  // `/cronogramas`, `/aulas`, `/forum`, `/games`) isso é a página inteira
  // renderizada no servidor, com todas as consultas ao banco. Eram ~12 rotas a
  // cada carregamento do app, para um aluno que abre uma ou duas: funções,
  // CPU e transferência gastos em páginas que ninguém via. No parcial, a rota
  // dinâmica devolve só layout e esqueleto (todas essas têm `loading.tsx`), e
  // a estática vem inteira do CDN. O `full` fica para o hover/toque abaixo,
  // que é quando o clique está para acontecer.
  const navHrefsKey = useMemo(() => {
    const hrefs = [homeItem.href, rankingItem.href, ...secondaryNavItems.map((item) => item.href), upgradeItem.href]
    for (const node of tree) {
      if (node.type === 'section') hrefs.push(node.section.href)
      else hrefs.push(...node.sections.map((section) => section.href))
    }
    return hrefs.filter(Boolean).join(',')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, isAdmin])

  useEffect(() => {
    if (typeof window === 'undefined') return
    // No Modo Lite não aquecemos o menu inteiro: são ~12 rotas baixadas de uma
    // vez, o pior negócio possível num 3G ou num aparelho que já está no limite.
    // O prefetch sob demanda (hover/toque) continua valendo quando o Lite sai.
    if (liteMode) return
    const hrefs = navHrefsKey.split(',').filter(Boolean)
    if (hrefs.length === 0) return

    const run = () => {
      for (const href of hrefs) {
        if (_warmedRoutes.has(href) || _prefetchedRoutes.has(href)) continue
        _warmedRoutes.add(href)
        try {
          router.prefetch(href, PREFETCH_PARCIAL)
        } catch {
          // rota não prefetchável — ignora, o clique continua funcionando
        }
      }
    }

    const ric = (window as any).requestIdleCallback
    if (typeof ric === 'function') {
      const handle = ric(run, { timeout: 3000 })
      return () => (window as any).cancelIdleCallback?.(handle)
    }
    const timer = window.setTimeout(run, 1500)
    return () => window.clearTimeout(timer)
  }, [navHrefsKey, router, liteMode])

  // Prefetch completo no toque/hover: é o sinal de que o clique vem aí, então
  // vale trazer a página inteira. Também cobre o clique antes do aquecimento
  // ocioso acontecer.
  const handleNavPrefetch = useCallback(
    (item: NavItem) => {
      if (!item.href || _prefetchedRoutes.has(item.href)) return
      _prefetchedRoutes.add(item.href)
      try {
        router.prefetch(item.href)
      } catch {
        // ignora
      }
    },
    [router],
  )

  const handleNavClick = useCallback(
    (item: NavItem) => {
      _lastClickedId = item.id
      setPressedId(null)
      setHoveredId(item.id)
      setRailTooltip(null)

      if (item.onClick) item.onClick()
      else if (item.href) router.push(item.href)
      if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose()
    },
    [router, onClose]
  )

  const handleNavMouseEnter = useCallback(() => {
    _mouseInsideSidebar = true
    setIsInNav(true)
  }, [])
  const handleNavMouseLeave = useCallback(() => {
    _mouseInsideSidebar = false
    _lastClickedId = null
    setIsInNav(false)
    setHoveredId(null)
    setRailTooltip(null)
  }, [])

  const handleNavPress = useCallback((item: NavItem) => {
    setPressedId(item.id)
    setHoveredId(item.id)
    setRailTooltip(null)
  }, [])

  const handleNavRelease = useCallback(() => {
    setPressedId(null)
  }, [])

  useEffect(() => {
    if (_lastClickedId !== null) {
      setIsInNav(true)
      setHoveredId(_lastClickedId)
      return
    }
    if (!_mouseInsideSidebar) return
    setIsInNav(true)

    for (const node of tree) {
      if (node.type === 'section') {
        if (isActive(node.section.href)) {
          setHoveredId(`section:${node.section.key}`)
          return
        }
        continue
      }
      const activeChild = node.sections.find((section) => isActive(section.href))
      if (activeChild) {
        setHoveredId(`section:${activeChild.key}`)
        return
      }
    }
    if (isActive(homeItem.href)) setHoveredId(homeItem.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // `useLayoutEffect`, não `useEffect`: a largura do <aside> já muda para 72px
  // via CSS (`lg:w-[72px]`) assim que a tela atinge 1024px, sem esperar
  // JavaScript nenhum. Se `canCollapse` só chegasse depois do primeiro paint,
  // sobraria um quadro com o contêiner já estreito mas o conteúdo interno
  // (rótulos, chip colorido, centralização) ainda desenhado para o menu
  // aberto — o texto e o quadradinho do ícone vazando pela borda do rail. Como
  // a sidebar remonta a cada navegação (ver `_hasMountedOnce` acima), isso
  // piscava a cada clique no menu em PC e tablet deitado, não só na carga
  // inicial.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setCanCollapse(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const bubbleVisible = isInNav || pressedId !== null

  // ── Menu flutuante do grupo (só no modo recolhido) ────────────────────
  // A 72px não cabe acordeão: o grupo vira ícone e as seções aparecem num
  // painel ao lado. Posição `fixed` porque o <aside> é `overflow-hidden` —
  // dentro dele o painel seria cortado.
  const [flyout, setFlyout] = useState<{ groupKey: string; top: number } | null>(null)
  const flyoutTimer = useRef<number | null>(null)

  const cancelFlyoutClose = useCallback(() => {
    if (flyoutTimer.current !== null) {
      window.clearTimeout(flyoutTimer.current)
      flyoutTimer.current = null
    }
  }, [])

  const scheduleFlyoutClose = useCallback(() => {
    cancelFlyoutClose()
    // Folga generosa de propósito: entre a borda do menu recolhido e o painel
    // existem alguns pixels de vão, e fechar durante essa travessia faria o
    // painel piscar fora justamente quando o usuário vai clicar nele.
    flyoutTimer.current = window.setTimeout(() => setFlyout(null), 220)
  }, [cancelFlyoutClose])

  useEffect(() => {
    if (!isCollapsed) {
      setFlyout(null)
      setRailTooltip(null)
    }
  }, [isCollapsed])

  useEffect(() => () => cancelFlyoutClose(), [cancelFlyoutClose])

  const handleItemHover = useCallback(
    (item: NavItem, event: React.MouseEvent<HTMLButtonElement>) => {
      setHoveredId(item.id)
      handleNavPrefetch(item)

      if (!isCollapsed) {
        setRailTooltip(null)
        return
      }
      // No modo recolhido, passar por qualquer item fecha o painel do grupo
      // anterior; sobre o cabeçalho de um grupo, abre o dele.
      const rect = event.currentTarget.getBoundingClientRect()
      const groupKey = item.id.startsWith('group:') ? item.id.slice('group:'.length) : null
      if (!groupKey) {
        scheduleFlyoutClose()
        setRailTooltip(pontoFino ? { label: item.label, top: rect.top + rect.height / 2 } : null)
        return
      }
      // Sobre um grupo quem nomeia é o próprio painel — dois rótulos ao lado
      // do mesmo ícone se sobreporiam.
      setRailTooltip(null)
      cancelFlyoutClose()
      setFlyout({ groupKey, top: rect.top })
    },
    [handleNavPrefetch, isCollapsed, scheduleFlyoutClose, cancelFlyoutClose, pontoFino]
  )

  const flyoutNode = flyout
    ? tree.find(
        (node): node is Extract<SidebarTreeNode, { type: 'group' }> =>
          node.type === 'group' && node.group.key === flyout.groupKey
      )
    : undefined

  /** Renderiza um nó da árvore: seção solta ou grupo colapsável. */
  const renderNode = (node: SidebarTreeNode, staggerIndex: number) => {
    if (node.type === 'section') {
      const item = sectionToNavItem(node.section)
      return (
        <NavItemButton
          key={item.id}
          item={item}
          hoveredId={hoveredId}
          pressedId={pressedId}
          collapsed={isCollapsed}
          isItemActive={isActive(item.href)}
          onHover={handleItemHover}
          onPress={(navItem) => {
            handleNavPress(navItem)
            handleNavPrefetch(navItem)
          }}
          onRelease={handleNavRelease}
          onClick={() => handleNavClick(item)}
          staggerIndex={staggerIndex}
          skipEntrance={skipEntranceRef.current}
          lite={liteMode}
        />
      )
    }

    const GroupIcon = getSidebarIconComponent(node.group.icon)
    const open = isGroupOpen(node)
    const hasActive = groupHasActiveSection(node)
    const groupItem: NavItem = {
      id: node.id,
      icon: <GroupIcon className="h-5 w-5" weight={PESO_ICONE} />,
      label: node.group.label,
      cor: node.group.key,
    }

    return (
      <div key={node.id} className="sidebar-group">
        <NavItemButton
          item={groupItem}
          hoveredId={hoveredId}
          pressedId={pressedId}
          collapsed={isCollapsed}
          // O grupo fechado herda o destaque do filho ativo: sem isso, entrar
          // numa subárea apagaria qualquer sinal de onde você está.
          isItemActive={hasActive && !open}
          onHover={handleItemHover}
          onPress={handleNavPress}
          onRelease={handleNavRelease}
          onClick={() => {
            handleNavRelease()
            _lastClickedId = node.id
            setHoveredId(node.id)
            if (isCollapsed) {
              // Recolhido, o clique no ícone expande a sidebar e abre o grupo:
              // é o caminho de teclado/toque para o que o hover faz no ponteiro.
              onCollapse?.(false)
              toggleGroup(node.group.key, true)
              return
            }
            toggleGroup(node.group.key, !open)
          }}
          staggerIndex={staggerIndex}
          skipEntrance={skipEntranceRef.current}
          lite={liteMode}
          ariaExpanded={isCollapsed ? undefined : open}
          trailing={
            isCollapsed ? null : (
              <motion.span
                animate={{ rotate: open ? 0 : -90 }}
                transition={liteMode ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
                className="flex text-foreground/40"
              >
                <CaretDown className="h-4 w-4" />
              </motion.span>
            )
          }
        />

        <AnimatePresence initial={false}>
          {open && !isCollapsed && (
            <motion.div
              className="overflow-hidden"
              initial={liteMode ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={liteMode ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              transition={liteMode ? { duration: 0 } : { duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onAnimationComplete={() => setLayoutVersion((v) => v + 1)}
            >
              <div className="sidebar-group-children space-y-0.5 pt-0.5">
                {node.sections.map((section) => {
                  const item = sectionToNavItem(section)
                  return (
                    <NavItemButton
                      key={item.id}
                      item={item}
                      hoveredId={hoveredId}
                      pressedId={pressedId}
                      collapsed={isCollapsed}
                      isItemActive={isActive(item.href)}
                      onHover={handleItemHover}
                      onPress={(navItem) => {
                        handleNavPress(navItem)
                        handleNavPrefetch(navItem)
                      }}
                      onRelease={handleNavRelease}
                      onClick={() => handleNavClick(item)}
                      staggerIndex={staggerIndex}
                      skipEntrance
                      lite={liteMode}
                      nested
                    />
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar
          No computador ela FLUTUA: uma placa de vidro afastada 12 px das
          bordas, como a barra lateral do iPadOS e do macOS, em vez de uma
          coluna colada na borda da janela. No celular é a mesma placa, como
          gaveta. A largura total ocupada (placa + folgas) é a que o conteúdo
          reserva no AppShell: 288 px aberta, 88 px recolhida. */}
      <aside
        data-dom-obstaculo="lateral"
        className={cn(
          'pwa-safe-top pwa-safe-bottom sidebar-glass fixed z-50 flex flex-col overflow-hidden',
          'bottom-2 left-2 top-2 rounded-[24px] lg:bottom-3 lg:left-3 lg:top-3 lg:rounded-[26px]',
          // `sidebar-rail` só existe recolhido (≥1024px). É o gancho do CSS que
          // troca o chip-caixa de cada ícone pelo alvo liso do rail — a 72px a
          // coluna de quadradinhos contornados era o que se via como bug.
          isCollapsed && 'sidebar-rail',
          collapsed ? 'lg:w-[64px]' : 'lg:w-[264px]',
          'w-[min(300px,calc(100vw-48px))]',
          // A placa fica a 8 px da borda: fechada, ela precisa andar a própria
          // largura MAIS essa folga, senão sobra uma tira dela na tela.
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
          'lg:translate-x-0'
        )}
        style={{
          transition: `width ${SB_DUR} ${SB_EASE}, transform ${SB_DUR} ${SB_EASE}`,
        }}
      >
        {/* Cabeçalho: a logo 3D. A intro (moeda girando, balões subindo, nome
            surgindo) só roda na primeira montagem da sessão — a sidebar
            remonta a cada navegação, e repetir a montagem a cada clique seria
            piscar. Depois, a marca só inclina com o ponteiro em cima dela. */}
        <div
          className="sidebar-cabecalho flex shrink-0 items-center"
          style={{
            padding: isCollapsed ? '14px 0 8px' : '16px 12px 10px 16px',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            flexDirection: isCollapsed ? 'column' : 'row',
            gap: isCollapsed ? 10 : 0,
            transition: `padding ${SB_DUR} ${SB_EASE}`,
          }}
        >
          <button
            type="button"
            className="sidebar-marca"
            onClick={() => router.push('/?landing=true')}
            aria-label="DomineAqui — página inicial"
          >
            <LogoAnimada
              tamanho="menu"
              intro={!skipEntranceRef.current && !liteMode}
              flutua={false}
              inclinacao="local"
            />
          </button>

          <button type="button" onClick={onClose} className="sidebar-recolher lg:hidden" aria-label="Fechar menu">
            <X className="h-[18px] w-[18px]" weight="bold" />
          </button>

          {/* Recolher/expandir — a seta gira em vez de trocar de ícone. */}
          <button
            type="button"
            onClick={() => onCollapse?.(!collapsed)}
            className="sidebar-recolher hidden lg:grid"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <CaretLeft
              className="h-4 w-4"
              weight="bold"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: `transform ${SB_DUR} ${SB_EASE}` }}
            />
          </button>
        </div>

        {/* Ação principal, busca e o saldo de provas */}
        <div data-tour="sidebar-new-exam" className="shrink-0 space-y-2 overflow-hidden px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={onCreateExam}
            disabled={tierLimitExceeded}
            title={isCollapsed ? 'Nova Prova' : undefined}
            aria-label={isCollapsed ? 'Nova Prova' : undefined}
            className="sidebar-acao"
            style={{
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? 0 : 10,
              paddingLeft: isCollapsed ? 0 : 6,
              paddingRight: isCollapsed ? 0 : 14,
              transition: `gap ${SB_DUR} ${SB_EASE}, padding ${SB_DUR} ${SB_EASE}, transform 160ms ease, filter 200ms ease`,
            }}
          >
            <span className="sidebar-acao-icone">
              <Plus className="h-[18px] w-[18px]" weight="bold" />
            </span>
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
          </button>

          {/* Busca global — a saída de emergência do menu agrupado. Quem não
              sabe em que grupo mora "gasometria" digita e chega. O painel em si
              é carregado sob demanda; aqui só vive o botão. */}
          <BuscaGlobal variante="sidebar" colapsado={isCollapsed} />

          {/* Saldo de provas do mês, como medidor. O número sozinho ("296 /
              300") pedia conta de cabeça; a barra responde "falta muito?" de
              relance. O limite é MENSAL (`examsPerMonth` no bootstrap) — o
              texto dizia "hoje". */}
          <div
            className="sidebar-contador-provas overflow-hidden"
            style={{
              maxHeight: isCollapsed ? 0 : 40,
              opacity: isCollapsed ? 0 : 1,
              transition: `max-height ${SB_DUR} ${SB_EASE}, opacity 200ms ${SB_EASE}`,
            }}
          >
            {examsRemaining != null && examsLimit != null && examsLimit > 0 && (
              <div className="sidebar-medidor" role="img" aria-label={`${examsRemaining} de ${examsLimit} provas restantes neste mês`}>
                <div className="flex items-baseline justify-between gap-2 px-0.5 text-[11.5px]">
                  <span className="text-muted-foreground">Provas no mês</span>
                  <span className="font-semibold tabular-nums text-foreground/80">
                    {examsRemaining}
                    <span className="font-normal text-muted-foreground"> / {examsLimit}</span>
                  </span>
                </div>
                <span className="sidebar-medidor-trilho" aria-hidden>
                  <span
                    className="sidebar-medidor-barra"
                    style={{ transform: `scaleX(${Math.max(0, Math.min(1, examsRemaining / examsLimit))})` }}
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Navigation ───
            O <nav> rola, mas a barra é a nossa (ScrollRoller): a nativa é
            grossa e cinza no Windows, invisível no macOS e inexistente no
            celular — três aparências diferentes no meio de um menu com
            identidade própria. O wrapper existe só para ancorar o roller,
            que fica por cima do conteúdo sem rolar junto. */}
        <div
          className="relative flex-1 min-h-0"
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={() => {
            handleNavMouseLeave()
            scheduleFlyoutClose()
          }}
        >
          <nav
            ref={navRef}
            id="sidebar-nav-scroll"
            data-tour="sidebar-nav"
            className="h-full px-3 py-2 overflow-y-auto overscroll-contain relative select-none scrollbar-hide [-webkit-overflow-scrolling:touch]"
            style={{ touchAction: 'pan-y' }}
          >
            {/* A bolha de vidro é três camadas com blur seguindo o cursor por
                spring — bonita no desktop, cara demais em GPU fraca. */}
            {!liteMode && (
              <FluidGlassBubble
                navRef={navRef}
                hoveredId={hoveredId}
                isVisible={bubbleVisible}
                collapsed={isCollapsed}
                layoutVersion={layoutVersion}
              />
            )}

            <div className="space-y-0.5">
              <NavItemButton
                item={homeItem}
                hoveredId={hoveredId}
                pressedId={pressedId}
                collapsed={isCollapsed}
                isItemActive={isActive(homeItem.href)}
                onHover={handleItemHover}
                onPress={(navItem) => {
                  handleNavPress(navItem)
                  handleNavPrefetch(navItem)
                }}
                onRelease={handleNavRelease}
                onClick={() => handleNavClick(homeItem)}
                staggerIndex={0}
                skipEntrance={skipEntranceRef.current}
                lite={liteMode}
              />
              <NavItemButton
                item={rankingItem}
                hoveredId={hoveredId}
                pressedId={pressedId}
                collapsed={isCollapsed}
                isItemActive={isActive(rankingItem.href)}
                onHover={handleItemHover}
                onPress={(navItem) => {
                  handleNavPress(navItem)
                  handleNavPrefetch(navItem)
                }}
                onRelease={handleNavRelease}
                onClick={() => handleNavClick(rankingItem)}
                staggerIndex={1}
                skipEntrance={skipEntranceRef.current}
                lite={liteMode}
              />
              {tree.map((node, index) => renderNode(node, index + 2))}
            </div>
          </nav>

          <ScrollRoller
            targetRef={navRef}
            controlsId="sidebar-nav-scroll"
            lite={liteMode}
            label="Rolar menu lateral"
          />
        </div>

        {/* ─── Rodapé: conta ───
            Perfil, Upgrade, Painel Admin, Modo Lite e Sair viviam no fim da
            mesma lista rolável das áreas de estudo. Eram cinco linhas
            competindo com o conteúdo — e "Sair" ficava colado no "Modo Lite",
            a um deslize de encerrar a sessão sem querer. Agora são âncoras
            fixas no rodapé, fora do scroll. */}
        <SidebarAccountFooter
          user={user}
          collapsed={isCollapsed}
          items={[...secondaryNavItems, liteNavItem]}
          upgradeItem={upgradeItem}
          onNavigate={(item) => {
            // Só navegação fecha o menu no celular. O Modo Lite é uma chave que
            // se liga e desliga ali mesmo — fechar a sidebar a cada toque
            // obrigaria a reabrir tudo para conferir o resultado.
            if (item.href) handleNavClick(item)
            else item.onClick?.()
          }}
          onLogout={onLogout}
          lite={liteMode}
        />
      </aside>

      {/* Rótulo do item no modo recolhido */}
      {isCollapsed && railTooltip && <RailTooltip label={railTooltip.label} top={railTooltip.top} />}

      {/* Painel do grupo no modo recolhido */}
      {flyoutNode && flyout && (
        <GroupFlyout
          node={flyoutNode}
          top={flyout.top}
          isActive={isActive}
          iconFor={(key) => resolvedIcons[key]}
          onEnter={cancelFlyoutClose}
          onLeave={scheduleFlyoutClose}
          onSelect={(href) => {
            setFlyout(null)
            router.push(href)
          }}
        />
      )}
    </>
  )
}

// ─── Rótulo flutuante do rail (modo recolhido) ───────────────────────────────
// Portal e `fixed` pelo mesmo motivo do painel de grupo: o <aside> é
// `overflow-hidden`, então qualquer coisa desenhada para fora dos 72px seria
// cortada na borda.
function RailTooltip({ label, top }: { label: string; top: number }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  if (!montado) return null

  return createPortal(
    <div
      className="sidebar-rail-tooltip"
      role="presentation"
      style={{ left: 88, top: Math.max(24, Math.min(top, window.innerHeight - 24)) }}
    >
      {label}
    </div>,
    document.body
  )
}

// ─── Painel flutuante de um grupo (modo recolhido) ───────────────────────────
function GroupFlyout({
  node,
  top,
  isActive,
  iconFor,
  onEnter,
  onLeave,
  onSelect,
}: {
  node: Extract<SidebarTreeNode, { type: 'group' }>
  top: number
  isActive: (href?: string) => boolean
  iconFor: (key: SidebarSectionKey) => string
  onEnter: () => void
  onLeave: () => void
  onSelect: (href: string) => void
}) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  if (!montado) return null

  // Não deixa o painel vazar pela borda de baixo em telas curtas.
  const altura = 44 + node.sections.length * 40
  const topoAjustado = Math.max(8, Math.min(top, window.innerHeight - altura - 8))

  return createPortal(
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar-popover fixed z-[60] min-w-[232px] p-1.5"
      style={{ left: 84, top: topoAjustado }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="menu"
      aria-label={node.group.label}
    >
      <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {node.group.label}
      </p>
      {node.sections.map((section) => {
        const Icon = getSidebarIconComponent(iconFor(section.key))
        const ativo = isActive(section.href)
        return (
          <button
            key={section.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(section.href)}
            className={cn('sidebar-popover-item', ativo && 'sidebar-popover-item-ativo')}
          >
            <span className="sidebar-mini-chip" style={estiloDoChip(section.key)}>
              <Icon className="h-3.5 w-3.5" weight={PESO_ICONE} />
            </span>
            <span className="truncate">{section.label}</span>
          </button>
        )
      })}
    </motion.div>,
    document.body
  )
}

// ─── Rodapé da conta ─────────────────────────────────────────────────────────
function SidebarAccountFooter({
  user,
  collapsed,
  items,
  upgradeItem,
  onNavigate,
  onLogout,
  lite,
}: {
  user: SidebarProps['user']
  collapsed: boolean
  items: NavItem[]
  upgradeItem: NavItem
  onNavigate: (item: NavItem) => void
  onLogout: () => void
  lite: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [ancora, setAncora] = useState<{ left: number; bottom: number } | null>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  const abrir = useCallback(() => {
    const rect = gatilhoRef.current?.getBoundingClientRect()
    if (rect) {
      setAncora({ left: rect.left, bottom: window.innerHeight - rect.top + 8 })
    }
    setAberto(true)
  }, [])

  useEffect(() => {
    if (!aberto) return

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node
      if (painelRef.current?.contains(alvo) || gatilhoRef.current?.contains(alvo)) return
      setAberto(false)
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  if (!user) return null

  const larguraPainel = 232

  return (
    <div className="sidebar-rodape shrink-0 space-y-1.5 p-2.5">
      <XpDoMenu recolhido={collapsed} />
      {/* Upgrade fica à vista: é a única ação do rodapé que o usuário não sabe
          que procura. Escondê-la num popover seria economizar espaço no lugar
          errado. */}
      <button
        type="button"
        onClick={() => onNavigate(upgradeItem)}
        className="sidebar-upgrade"
        style={{
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 10,
          paddingLeft: collapsed ? 0 : 6,
          paddingRight: collapsed ? 0 : 12,
          transition: `gap ${SB_DUR} ${SB_EASE}, padding ${SB_DUR} ${SB_EASE}`,
        }}
        aria-label="Upgrade"
        title={collapsed ? 'Upgrade' : undefined}
      >
        <span className="sidebar-mini-chip sidebar-mini-chip-grande" style={estiloDoChip('upgrade')}>
          <ShoppingCart className="h-4 w-4" weight={PESO_ICONE} />
        </span>
        <span
          className="truncate whitespace-nowrap text-sm"
          style={{
            maxWidth: collapsed ? 0 : 160,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: `opacity 200ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        >
          Upgrade
        </span>
        <span
          className="sidebar-selo-pro ml-auto whitespace-nowrap"
          style={{
            maxWidth: collapsed ? 0 : 40,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: `opacity 200ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        >
          PRO
        </span>
      </button>

      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title={collapsed ? user.name : undefined}
        aria-label={collapsed ? `Conta de ${user.name}` : undefined}
        className="sidebar-conta"
        data-aberto={aberto || undefined}
        style={{
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 10,
          paddingLeft: collapsed ? 0 : 8,
          paddingRight: collapsed ? 0 : 8,
          transition: `gap ${SB_DUR} ${SB_EASE}, padding ${SB_DUR} ${SB_EASE}`,
        }}
      >
        <RetratoDoMenu nome={user.name} avatar={user.avatar} />
        <span
          className="min-w-0 flex-1 text-left"
          style={{
            maxWidth: collapsed ? 0 : 170,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: `opacity 200ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        >
          <span className="block truncate text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <CaretRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          style={{
            maxWidth: collapsed ? 0 : 16,
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            transition: `opacity 150ms ${SB_EASE}, max-width ${SB_DUR} ${SB_EASE}`,
          }}
        />
      </button>

      {montado &&
        ancora &&
        createPortal(
          <AnimatePresence>
            {aberto && (
              <motion.div
                ref={painelRef}
                initial={lite ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={lite ? { duration: 0 } : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="sidebar-popover fixed z-[60] p-1.5"
                style={{
                  left: Math.max(8, ancora.left),
                  bottom: ancora.bottom,
                  width: larguraPainel,
                }}
                role="menu"
                aria-label="Conta"
              >
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAberto(false)
                      onNavigate(item)
                    }}
                    className="sidebar-popover-item"
                  >
                    <span className="sidebar-mini-chip [&>svg]:h-3.5 [&>svg]:w-3.5" style={estiloDoChip(item.cor ?? 'perfil')}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge ml-auto rounded-full px-2 py-0.5 text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}

                <div className="sidebar-popover-divisor" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAberto(false)
                    onLogout()
                  }}
                  className="sidebar-popover-item sidebar-popover-item-sair"
                >
                  <span className="sidebar-mini-chip" style={estiloDoChip('sair')}>
                    <LogOut className="h-3.5 w-3.5" weight={PESO_ICONE} />
                  </span>
                  <span>Sair</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

/** Retrato da conta no rodapé do menu; sem retrato (ou se a imagem falhar), a inicial. */
function RetratoDoMenu({ nome, avatar }: { nome: string; avatar?: string }) {
  const [falhou, setFalhou] = useState(false)
  const url = avatarPorId(avatar)?.url
  return (
    <span className="sidebar-retrato">
      {url && !falhou ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFalhou(true)} className="h-full w-full object-cover object-[50%_22%]" />
      ) : (
        (nome || '?').charAt(0).toUpperCase()
      )}
    </span>
  )
}
