'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Zap, X, Gauge } from 'lucide-react'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { cn } from '@/lib/utils'

/**
 * Convite (e aviso) do Modo Lite.
 *
 * Dois papéis, nunca ao mesmo tempo:
 *
 *  1. CONVITE — quando a plataforma mede travamento real (FPS baixo) ou vê
 *     sinais de aparelho/conexão fracos e o Modo Lite está desligado. Aparece
 *     uma faixa discreta oferecendo ativar. É isso que resolve o "o usuário
 *     nem sabe que dá pra ativar".
 *
 *  2. AVISO — quando o modo `auto` ligou o Lite sozinho. A pessoa precisa
 *     saber por que a interface ficou mais simples e como voltar atrás; caso
 *     contrário, parece bug.
 */

// Telas onde interromper é pior do que ajudar.
const BLOCKED_PREFIXES = ['/auth', '/exam', '/forms', '/lead']

function isBlockedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.includes('/viewer')) return true
  return BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function LiteModePrompt() {
  const {
    liteMode,
    hydrated,
    device,
    autoEnabled,
    shouldSuggest,
    setPreference,
    dismissSuggestion,
    autoNoticeSeen,
    markAutoNoticeSeen,
  } = useLiteMode()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [closed, setClosed] = useState(false)

  // Nada aparece em cima do carregamento inicial — a faixa entra quando a tela
  // já assentou.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    setClosed(false)
  }, [pathname])

  if (!hydrated || !ready || closed) return null
  if (isBlockedRoute(pathname)) return null

  const showAutoNotice = liteMode && autoEnabled && !autoNoticeSeen
  const showSuggestion = !liteMode && shouldSuggest

  if (!showAutoNotice && !showSuggestion) return null

  const reason = device?.reasons?.[0]

  if (showAutoNotice) {
    return (
      <Banner
        tone="info"
        icon={<Zap className="h-4 w-4 fill-current" />}
        title="Ativei o Modo Lite pra você"
        description={
          reason
            ? `Detectei ${reason} — desliguei os efeitos pesados pra plataforma não travar.`
            : 'Seu aparelho pediu leveza, então desliguei os efeitos pesados.'
        }
        primary={{
          label: 'Entendi',
          onClick: () => {
            markAutoNoticeSeen()
            setClosed(true)
          },
        }}
        secondary={{
          label: 'Quero o visual completo',
          onClick: () => {
            setPreference('off')
            markAutoNoticeSeen()
            setClosed(true)
          },
        }}
        onClose={() => {
          markAutoNoticeSeen()
          setClosed(true)
        }}
      />
    )
  }

  return (
    <Banner
      tone="suggest"
      icon={<Gauge className="h-4 w-4" />}
      title="A plataforma está travando aí?"
      description={
        reason
          ? `Vi ${reason}. O Modo Lite corta animações, sombras e efeitos — a tela responde na hora.`
          : 'O Modo Lite corta animações, sombras e efeitos pesados — a tela responde na hora.'
      }
      primary={{
        label: 'Ativar Modo Lite',
        onClick: () => {
          setPreference('on')
          setClosed(true)
        },
      }}
      secondary={{
        label: 'Agora não',
        onClick: () => {
          dismissSuggestion()
          setClosed(true)
        },
      }}
      onClose={() => {
        dismissSuggestion()
        setClosed(true)
      }}
    />
  )
}

function Banner({
  tone,
  icon,
  title,
  description,
  primary,
  secondary,
  onClose,
}: {
  tone: 'info' | 'suggest'
  icon: React.ReactNode
  title: string
  description: string
  primary: { label: string; onClick: () => void }
  secondary: { label: string; onClick: () => void }
  onClose: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pwa-safe-bottom fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-md rounded-lg border border-border bg-card p-3.5 shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
            tone === 'info'
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'border-primary/30 bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={secondary.onClick}
          className="h-8 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {secondary.label}
        </button>
        <button
          type="button"
          onClick={primary.onClick}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold',
            tone === 'info'
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-amber-500 text-white hover:bg-amber-600',
          )}
        >
          {tone === 'suggest' && <Zap className="h-3.5 w-3.5 fill-current" />}
          {primary.label}
        </button>
      </div>
    </div>
  )
}
