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
  /**
   * `barra` é a faixa larga da dashboard. `sidebar` é a versão compacta que
   * mora no menu lateral, logo abaixo de "Nova Prova" — com os grupos
   * colapsáveis, ela é a saída para quem não sabe em que grupo mora o que
   * procura.
   */
  variante?: 'barra' | 'sidebar'
  /** Menu recolhido (72px): sobra o ícone. */
  colapsado?: boolean
  /**
   * Quem registra ⌘K / "/" nesta página. Duas instâncias montadas ao mesmo
   * tempo (a do menu e a da dashboard) abririam dois painéis empilhados com um
   * único atalho, então apenas uma delas escuta o teclado.
   */
  atalhoGlobal?: boolean
}

export function BuscaGlobal({
  className,
  onAbrirTour,
  variante = 'barra',
  colapsado = false,
  atalhoGlobal = true,
}: BuscaGlobalProps) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  // Atalho de teclado global: ⌘K / Ctrl+K em qualquer lugar, e "/" quando o
  // cursor não está dentro de um campo (senão a barra viraria atalho no meio de
  // uma resposta do fórum).
  useEffect(() => {
    if (!atalhoGlobal) return

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
  }, [atalhoGlobal])

  const naSidebar = variante === 'sidebar'

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        // A âncora do tour é só da barra da dashboard: com a busca também no
        // menu, dois elementos com o mesmo `data-tour` fariam o tour apontar
        // para o que estivesse primeiro no DOM.
        data-tour={naSidebar ? undefined : 'busca-global'}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={naSidebar ? 'Buscar na plataforma' : undefined}
        className={cn(
          'group flex w-full items-center text-left transition-all duration-200 active:scale-[0.995]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          naSidebar
            ? 'busca-vidro-linha h-10 rounded-[12px] border text-muted-foreground hover:text-foreground'
            : 'busca-vidro-barra gap-3 rounded-2xl px-4 py-3',
          className,
        )}
        style={
          naSidebar
            ? {
                justifyContent: colapsado ? 'center' : 'flex-start',
                gap: colapsado ? 0 : 10,
                paddingLeft: colapsado ? 0 : 11,
                paddingRight: colapsado ? 0 : 11,
                transition: 'gap 400ms cubic-bezier(0.4, 0, 0.2, 1), padding 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }
            : undefined
        }
      >
        <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        {naSidebar ? (
          <>
            <span
              className="truncate whitespace-nowrap text-sm"
              style={{
                maxWidth: colapsado ? 0 : 150,
                opacity: colapsado ? 0 : 1,
                overflow: 'hidden',
                transition:
                  'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), max-width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Buscar
            </span>
            <kbd
              className="ml-auto hidden items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-clinical text-[10px] font-medium text-muted-foreground lg:inline-flex"
              style={{
                maxWidth: colapsado ? 0 : 60,
                opacity: colapsado ? 0 : 1,
                overflow: 'hidden',
                borderWidth: colapsado ? 0 : undefined,
                paddingLeft: colapsado ? 0 : undefined,
                paddingRight: colapsado ? 0 : undefined,
                transition:
                  'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), max-width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <AtalhoDoSistema />
            </kbd>
          </>
        ) : (
          <>
            <span className="flex-1 truncate text-sm text-muted-foreground">
              Buscar em toda a plataforma
            </span>
            <kbd className="busca-vidro-linha hidden items-center gap-0.5 rounded-md border px-1.5 py-0.5 font-clinical text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <AtalhoDoSistema />
            </kbd>
          </>
        )}
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
