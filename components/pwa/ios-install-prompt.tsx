'use client'

import { useEffect, useRef, useState } from 'react'
import { Share, Plus, X } from 'lucide-react'

const DISMISS_KEY = 'ios-install-dismissed-at'
// Não reaparecer por 14 dias depois que o usuário fecha.
const DISMISS_DAYS = 14

// Publica a própria altura como variável CSS global, para que outros
// elementos flutuantes (ex.: o botão "Voltar") possam subir e não ficar
// tampados por este banner enquanto ele estiver na tela.
const HEIGHT_VAR = '--gx-install-prompt-h'

function isIosSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''

  // iPhone / iPod / iPad (iPad no iOS 13+ se identifica como "Mac" com toque).
  const isIphoneIpod = /iPhone|iPod/.test(ua)
  const isIpad =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  const isIos = isIphoneIpod || isIpad
  if (!isIos) return false

  // Só o Safari tem o fluxo "Adicionar à Tela de Início" que descrevemos.
  // Chrome/Firefox/Edge/Opera no iOS têm outra UI — não mostrar para eles.
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua)
  return !isOtherBrowser
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone
  return (
    iosStandalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true
  )
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const when = Number(raw)
    if (!Number.isFinite(when)) return false
    return Date.now() - when < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/**
 * Barra discreta que ensina usuários de iPhone (Safari) a instalar o site como
 * app: Compartilhar → "Adicionar à Tela de Início". Aparece só quando faz
 * sentido (iOS Safari, fora do modo standalone, não dispensado recentemente) e
 * é fechável com persistência — para nunca virar incômodo.
 */
export function IosInstallPrompt() {
  const [show, setShow] = useState(false)
  const [entered, setEntered] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isIosSafariBrowser()) return
    if (isRunningStandalone()) return
    if (wasRecentlyDismissed()) return

    // Pequeno atraso para não competir com a primeira renderização/scroll.
    const t = setTimeout(() => {
      setShow(true)
      requestAnimationFrame(() => setEntered(true))
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!show || !rootRef.current) return
    const el = rootRef.current
    const publish = () => {
      document.documentElement.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`)
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.setProperty(HEIGHT_VAR, '0px')
    }
  }, [show])

  if (!show) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setEntered(false)
    setTimeout(() => setShow(false), 250)
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Instalar o app na tela de início"
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className={
          'pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md ' +
          'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out ' +
          (entered
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100')
        }
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Instale o DomineAqui no seu iPhone
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Toque em{' '}
            <Share
              className="inline-block h-3.5 w-3.5 -translate-y-px align-middle text-primary"
              strokeWidth={2.2}
              aria-label="ícone Compartilhar"
            />{' '}
            <span className="font-medium text-foreground">Compartilhar</span> e
            depois em{' '}
            <span className="font-medium text-foreground">
              Adicionar à Tela de Início
            </span>
            . Rápido, sem app store.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
