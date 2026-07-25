'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Gamepad2,
  HeartPulse,
  MessageCircle,
  Network,
  Ticket,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { useAppShell } from '@/components/app-shell'
import { SIDEBAR_SECTION_DEFINITIONS, type SidebarSectionKey } from '@/lib/sidebar-sections'
import { cn } from '@/lib/utils'

/**
 * Carrossel das experiências do site.
 *
 * Usa scroll-snap nativo em vez de arrasto em JS: no celular a inércia é a do
 * próprio sistema, sem um único handler de scroll na thread principal. Os
 * slides são `<Link>` de verdade, então ganham href, nova aba, prefetch e o
 * retorno tátil global de `components/tactile-feedback.tsx` de graça.
 *
 * A lista vem de `SIDEBAR_SECTION_DEFINITIONS` e é filtrada pelo mesmo critério
 * do menu lateral — o que impede a dashboard de continuar oferecendo áreas que
 * o admin desligou (elas mandavam o usuário de volta para cá).
 */

/** Só o metadado visual mora aqui. Label, href e descrição vêm das definições
 *  compartilhadas — que são importadas por código de servidor e por isso não
 *  podem carregar ícones do lucide. */
const VISUALS: Record<SidebarSectionKey, { icon: LucideIcon; color: string; badge?: string }> = {
  provas: { icon: FileText, color: '#468152' },
  bancoQuestoes: { icon: Database, color: '#0ea5e9' },
  aulas: { icon: Video, color: '#3b82f6' },
  flashcards: { icon: Brain, color: '#8b5cf6' },
  mapaMental: { icon: Network, color: '#14b8a6', badge: 'Novo' },
  cronogramas: { icon: BookMarked, color: '#E2A43E' },
  forum: { icon: MessageCircle, color: '#ec4899' },
  games: { icon: Gamepad2, color: '#f97316', badge: 'Novo' },
  manualClinico: { icon: HeartPulse, color: '#ef4444' },
  materiais: { icon: BookOpen, color: '#6366f1', badge: 'Novo' },
  rifas: { icon: Ticket, color: '#d946ef', badge: 'Novo' },
}

export interface ExperienceStats {
  examsCompleted?: number
  questionsAnswered?: number
  cronogramasCreated?: number
  materialsOwned?: number
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

/** Número real por área — e só quando existe. Nunca renderizar "0 decks": lê
 *  como fracasso e a maioria das áreas não tem API de progresso por usuário. */
function statFor(key: SidebarSectionKey, stats?: ExperienceStats): string | null {
  if (!stats) return null
  switch (key) {
    case 'provas':
      return stats.examsCompleted ? `${fmt(stats.examsCompleted)} realizadas` : null
    case 'bancoQuestoes':
      return stats.questionsAnswered ? `${fmt(stats.questionsAnswered)} respondidas` : null
    case 'cronogramas':
      return stats.cronogramasCreated ? `${fmt(stats.cronogramasCreated)} criados` : null
    case 'materiais':
      return stats.materialsOwned ? `${fmt(stats.materialsOwned)} seus` : null
    default:
      return null
  }
}

export function ExperienceCarousel({ stats }: { stats?: ExperienceStats }) {
  const { sidebarSections, isAdmin } = useAppShell()
  const railRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [active, setActive] = useState(0)

  const sections = useMemo(
    () =>
      SIDEBAR_SECTION_DEFINITIONS.filter(
        section => isAdmin || sidebarSections?.[section.key] !== false,
      ),
    [isAdmin, sidebarSections],
  )

  // Slide ativo por IntersectionObserver, não por listener de scroll: durante a
  // rolagem por inércia no iOS um listener dispara dezenas de vezes por segundo
  // e roda na thread principal. Aqui o próprio navegador avisa, e só quando um
  // slide de fato cruza o limiar.
  useEffect(() => {
    const rail = railRef.current
    if (!rail || sections.length === 0) return

    // No desktop cabem vários slides ao mesmo tempo, então o observer reporta
    // um punhado de visíveis por vez. O ativo tem de ser o PRIMEIRO deles —
    // usar o último que chegou fazia o marcador nascer no meio da régua.
    const visible = new Set<number>()

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isNaN(index)) continue
          if (entry.isIntersecting) visible.add(index)
          else visible.delete(index)
        }
        if (visible.size > 0) setActive(Math.min(...visible))
      },
      { root: rail, threshold: 0.6 },
    )

    slideRefs.current.forEach(node => node && observer.observe(node))
    return () => observer.disconnect()
  }, [sections.length])

  const goTo = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }, [])

  const nudge = useCallback((direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: 'smooth' })
  }, [])

  if (sections.length === 0) return null

  return (
    <section aria-labelledby="experiencias-titulo">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="experiencias-titulo" className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
            Explore a plataforma
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Deslize para conhecer cada área de estudo.
          </p>
        </div>
        {/* Setas só em ponteiro: no toque o gesto é a própria navegação. */}
        <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Ver experiências anteriores"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Ver próximas experiências"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className={cn(
          'scrollbar-hide fade-scroll-x flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain',
          'scroll-px-3 pb-1 -mx-3 px-3 sm:mx-0 sm:scroll-px-0 sm:px-0',
        )}
      >
        {sections.map((section, index) => {
          const visual = VISUALS[section.key]
          const Icon = visual.icon
          const stat = statFor(section.key, stats)
          return (
            <Link
              key={section.key}
              href={section.href}
              ref={node => { slideRefs.current[index] = node }}
              data-index={index}
              style={{ animationDelay: `${Math.min(index, 6) * 45}ms`, touchAction: 'manipulation' }}
              className={cn(
                'deck-card-rise group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm',
                'basis-[80%] sm:basis-[46%] lg:basis-[31%] xl:basis-[23%]',
                'transition duration-200 active:scale-[0.985] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
              )}
            >
              {/* Lavagem de cor da área, bem sutil */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.13]"
                style={{ background: `radial-gradient(ellipse at 100% 0%, ${visual.color}, transparent 62%)` }}
              />

              <div className="relative flex items-start justify-between gap-2">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${visual.color}1a`, color: visual.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {visual.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {visual.badge}
                  </span>
                )}
              </div>

              <h3 className="relative mt-3 text-[15px] font-semibold leading-tight text-foreground">
                {section.label}
              </h3>
              <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {section.description}
              </p>

              <div className="relative mt-auto flex items-center justify-between gap-2 pt-3">
                {stat ? (
                  <span
                    className="truncate rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: `${visual.color}1a`, color: visual.color }}
                  >
                    {stat}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">Abrir</span>
                )}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Pontinhos: botões reais, então herdam o retorno tátil global. */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {sections.map((section, index) => (
          <button
            key={section.key}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Ir para ${section.label}`}
            aria-current={index === active ? 'true' : undefined}
            style={{ touchAction: 'manipulation' }}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === active ? 'w-5 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40',
            )}
          />
        ))}
      </div>
    </section>
  )
}
