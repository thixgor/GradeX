'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Busca global da plataforma — a barra.
 *
 * Uma barra discreta na dashboard que abre um painel no estilo Spotlight: você
 * digita e a plataforma inteira responde — áreas, páginas, calculadoras,
 * patologias, fármacos, materiais, aulas, decks, mapas, cronogramas, provas,
 * listas, rifas, posts do fórum, ajustes de conta e o painel do admin.
 *
 * Aqui só moram a barra e o atalho de teclado. O painel (catálogo, motor de
 * ranqueamento, animações) é baixado por `next/dynamic` no primeiro uso: quem
 * nunca abre a busca não paga por ela na tela mais visitada do app.
 */

const PainelDeBusca = dynamic(
  () => import('./painel-busca').then(m => m.PainelDeBusca),
  { ssr: false },
)

interface BuscaGlobalProps {
  className?: string
  /** Sem isto, a ação "refazer o tour" não é oferecida — ela só existe na dashboard. */
  onAbrirTour?: () => void
}

export function BuscaGlobal({ className, onAbrirTour }: BuscaGlobalProps) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  // Atalho de teclado global: ⌘K / Ctrl+K em qualquer lugar, e "/" quando o
  // cursor não está dentro de um campo (senão a barra viraria atalho no meio de
  // uma resposta do fórum).
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null
      const digitando =
        !!alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)

      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault()
        setAberto(true)
        return
      }
      if (evento.key === '/' && !digitando && !evento.metaKey && !evento.ctrlKey && !evento.altKey) {
        evento.preventDefault()
        setAberto(true)
      }
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        data-tour="busca-global"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className={cn(
          'busca-vidro-barra group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left',
          'transition-all duration-200 active:scale-[0.995]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          className,
        )}
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          Buscar em toda a plataforma
        </span>
        <kbd className="busca-vidro-linha hidden items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-clinical text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <AtalhoDoSistema />
        </kbd>
      </button>

      {montado &&
        createPortal(
          <AnimatePresence>
            {aberto && <PainelDeBusca onFechar={() => setAberto(false)} onAbrirTour={onAbrirTour} />}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

/** ⌘K no Mac, Ctrl K no resto. Resolvido depois da montagem para não divergir na hidratação. */
function AtalhoDoSistema() {
  const [mac, setMac] = useState(false)
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent))
  }, [])
  return <>{mac ? '⌘' : 'Ctrl'} K</>
}
