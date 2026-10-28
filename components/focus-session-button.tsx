'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Timer } from 'lucide-react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { useAnchoredPanel } from '@/hooks/use-anchored-panel'
import { AnelDeFoco, PainelDeFoco } from '@/components/foco/painel-de-foco'
import { formatarRelogio } from '@/lib/foco/ritmo-de-foco'
import { getFullscreenElement } from '@/lib/fullscreen'
import { cn } from '@/lib/utils'

/**
 * O gatilho da sessão de foco no cabeçalho.
 *
 * Antes era só um ícone, e o nome aparecia no hover — no celular, nunca. Quase
 * ninguém sabia que havia um cronômetro ali. Agora o rótulo "Foco" fica à
 * vista a partir do tablet, e com a sessão rodando o botão vira o próprio
 * relógio, com o anel da meta enchendo: é o lembrete de que vale encerrar
 * para o tempo contar.
 */
export function FocusSessionButton() {
  const { currentSession, elapsedMs, isModalOpen, closeModal } = useFocusSession()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const closePanel = useCallback(() => setOpen(false), [])
  // O painel vive num portal ancorado ao botão: dentro do cabeçalho ele nascia
  // com a borda esquerda fora da tela no celular.
  const { triggerRef, panelRef, style } = useAnchoredPanel<HTMLButtonElement>(open, closePanel, { width: 360 })

  useEffect(() => setMounted(true), [])

  // Outras telas (o cartão do painel inicial) pedem o painel aberto por aqui.
  useEffect(() => {
    if (!isModalOpen) return
    setOpen(true)
    closeModal()
  }, [isModalOpen, closeModal])

  if (!mounted) return null

  const ativa = currentSession?.status === 'active'
  const pausada = currentSession?.status === 'paused'
  const emAndamento = ativa || pausada
  const alvoMs = (currentSession?.targetMinutes || 0) * 60_000
  const fracao = alvoMs > 0 ? elapsedMs / alvoMs : null
  const bateuMeta = alvoMs > 0 && elapsedMs >= alvoMs

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          emAndamento
            ? `Sessão de foco ${pausada ? 'pausada' : 'em andamento'}: ${formatarRelogio(elapsedMs)}`
            : 'Abrir sessão de foco'
        }
        data-estado={pausada ? 'pausado' : bateuMeta ? 'meta' : ativa ? 'ativo' : 'parado'}
        className={cn('foco-gatilho', open && 'foco-gatilho-aberto')}
      >
        {emAndamento ? (
          <>
            <AnelDeFoco fracao={fracao} tamanho={20} espessura={3} estado={pausada ? 'pausado' : bateuMeta ? 'meta' : 'ativo'} />
            <span className="foco-gatilho-relogio">{formatarRelogio(elapsedMs)}</span>
          </>
        ) : (
          <>
            <Timer className="h-[18px] w-[18px]" strokeWidth={2.1} />
            <span className="hidden sm:inline">Foco</span>
          </>
        )}
      </button>

      {open &&
        style &&
        createPortal(
          <div
            ref={panelRef}
            style={style}
            role="dialog"
            aria-label="Sessão de foco"
            className="app-anchored-panel foco-painel overflow-y-auto overscroll-contain"
          >
            <PainelDeFoco onFechar={closePanel} />
          </div>,
          // Em tela cheia (o leitor de PDF no computador) só o elemento em
          // tela cheia aparece: um portal no <body> abriria o painel invisível.
          (getFullscreenElement() as HTMLElement | null) ?? document.body,
        )}
    </div>
  )
}
