'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Music, Plus } from 'lucide-react'
import { useFloatingDock, type DockPanel } from '@/context/FloatingDockContext'
import { cn } from '@/lib/utils'

/**
 * FAB expansível que consolida os botões flutuantes (Música e Suporte)
 * num único controle no mobile — reduzindo a poluição visual sobre o conteúdo.
 * Some no desktop (`lg:hidden`), onde cada botão volta a ter seu próprio gatilho.
 *
 * Só aparece quando há ao menos uma ação registrada e nenhum painel aberto
 * (quando um painel abre, ele já traz seu próprio botão de fechar).
 */

const ICONS: Record<DockPanel, typeof Music> = {
  music: Music,
  support: MessageCircle,
}

// Cor de destaque por ação — sutil, funciona em light e dark.
const ACCENTS: Record<DockPanel, string> = {
  music: 'text-violet-500 dark:text-violet-300',
  support: 'text-primary',
}

export function MobileFloatingDock() {
  const dock = useFloatingDock()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activePanel = dock?.activePanel ?? null
  const actions = dock?.actions ?? []

  // Fecha o menu ao abrir um painel ou trocar de rota.
  useEffect(() => {
    setExpanded(false)
  }, [activePanel, pathname])

  // Fecha ao tocar fora.
  useEffect(() => {
    if (!expanded) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [expanded])

  if (!dock) return null
  // Um painel aberto já ocupa a tela; não empilhamos o FAB por cima.
  if (activePanel) return null
  if (actions.length === 0) return null

  // Rota do resolvedor de provas usa o canto esquerdo pra não cobrir a paleta.
  const isExamResolver = /^\/exams?\/[^/]+$/.test(pathname || '')
  // A tela de estudo de flashcards usa a barra inferior inteira (avaliação
  // Suave/No ponto/Porrete + navegação) — o FAB por cima cobria o canto
  // direito dessa barra e bloqueava o toque no botão "Porrete".
  const isFlashcardDeck = /^\/flashcards\/d\/[^/]+$/.test(pathname || '')
  if (isFlashcardDeck) return null
  // O leitor de PDF tem barra de controles fixa no rodapé (voltar/avançar
  // página, zoom, ferramentas); o FAB por cima cobria o canto direito dela.
  // Mesmo tratamento que o Footer e o PlatformAds já dão a estas rotas.
  const isPdfViewer = (pathname || '').includes('/viewer')
  if (isPdfViewer) return null

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed z-40 flex flex-col items-end gap-2.5 lg:hidden',
        isExamResolver
          // A prova (modo paginado) tem uma barra fixa de navegação no rodapé;
          // sem esta folga o "+" nascia embaixo dela, ilegível e sem toque.
          ? 'left-4 items-start bottom-[calc(5.75rem+env(safe-area-inset-bottom))]'
          : 'pwa-safe-bottom right-4 items-end bottom-5',
      )}
    >
      {/* Ações reveladas */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-200',
          isExamResolver ? 'items-start' : 'items-end',
          expanded
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        {actions.map((action, i) => {
          const Icon = ICONS[action.id]
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                dock.open(action.id)
                setExpanded(false)
              }}
              style={{ transitionDelay: expanded ? `${i * 40}ms` : '0ms' }}
              className={cn(
                'group flex items-center gap-2.5 rounded-full border border-border bg-card/95 py-2 pl-3.5 pr-4 text-sm font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-xl transition-transform active:scale-95 dark:shadow-black/40',
                isExamResolver && 'flex-row-reverse pl-4 pr-3.5',
              )}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <Icon className={cn('h-[18px] w-[18px]', ACCENTS[action.id])} />
                {action.active && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70" />
                  </span>
                )}
              </span>
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Botão principal */}
      <button
        type="button"
        aria-label={expanded ? 'Fechar menu' : 'Abrir menu de ações'}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-transform active:scale-95',
        )}
      >
        {/* Indicador quando alguma ação está "ativa" (ex.: música tocando) */}
        {!expanded && actions.some((a) => a.active) && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
          </span>
        )}
        <Plus
          className={cn(
            'h-6 w-6 transition-transform duration-300',
            expanded && 'rotate-[135deg]',
          )}
        />
      </button>
    </div>
  )
}
