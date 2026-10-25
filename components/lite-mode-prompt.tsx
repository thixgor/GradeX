'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Zap, X } from 'lucide-react'
import { useLiteMode } from '@/hooks/use-lite-mode'

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
        title="Modo Lite ligado"
        description={reason ? `Por causa de ${reason}. Melhora o desempenho.` : 'Melhora o desempenho neste aparelho.'}
        primary={{
          label: 'Ok',
          onClick: () => {
            markAutoNoticeSeen()
            setClosed(true)
          },
        }}
        secondary={{
          label: 'Desligar',
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
      title="Travando?"
      description="O Modo Lite melhora o desempenho."
      primary={{
        label: 'Ativar Lite',
        onClick: () => {
          setPreference('on')
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

/**
 * A cápsula do aviso: uma linha só, de vidro, com a ação primeiro (à
 * esquerda, onde o olho começa) e o fechar no fim. No celular fica logo
 * abaixo do cabeçalho — o rodapé já é do aviso de visitante e das barras de
 * compra —; no desktop, no canto de baixo à esquerda (ver `.aviso-lite` no
 * globals.css).
 */
function Banner({
  title,
  description,
  primary,
  secondary,
  onClose,
}: {
  title: string
  description: string
  primary: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
  onClose: () => void
}) {
  return (
    <div role="status" aria-live="polite" className="aviso-lite">
      <button
        type="button"
        onClick={primary.onClick}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-[#f4c66d] to-[#e2a43e] pl-3 pr-3.5 text-[14px] font-semibold text-[#1d1406] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-8px_rgba(226,164,62,0.9)] transition active:scale-95"
      >
        <Zap className="h-4 w-4 fill-current" />
        {primary.label}
      </button>
      <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug sm:truncate sm:text-[14px] sm:leading-tight">
        <span className="hidden font-semibold sm:inline">{title} </span>
        <span className="text-[#101814]/60 dark:text-white/60">{description}</span>
      </p>
      {secondary && (
        <button
          type="button"
          onClick={secondary.onClick}
          className="h-9 shrink-0 rounded-full px-2.5 text-[14px] font-semibold text-[#2a7342] transition hover:bg-[#2f7d48]/10 dark:text-[#7fd093] dark:hover:bg-white/10"
        >
          {secondary.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#101814]/50 transition hover:text-[#101814] active:scale-90 dark:bg-white/10 dark:text-white/60 dark:hover:text-white"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
