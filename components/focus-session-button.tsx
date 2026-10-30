'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Flame, Timer, X } from 'lucide-react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { AnelDeFoco } from '@/components/foco/painel-de-foco'
import { formatarRelogio, minutosPorDia, sequenciaDeFoco } from '@/lib/foco/ritmo-de-foco'
import { getFullscreenElement } from '@/lib/fullscreen'
import { cn } from '@/lib/utils'
import '@/components/checkout/checkout-vidro.css'

// O Modo Foco inteiro (jogos, respiração, sons) só baixa quando a folha abre.
const ModoFoco = dynamic(() => import('@/components/foco/modo-foco').then((m) => m.ModoFoco), {
  ssr: false,
  loading: () => <div className="foco-folha-carregando" aria-hidden />,
})

function metaDiaria(): number {
  try {
    const p = JSON.parse(window.localStorage.getItem('gradex:foco:prefs') || 'null') as { metaDiaria?: number } | null
    return p?.metaDiaria && p.metaDiaria > 0 ? p.metaDiaria : 60
  } catch {
    return 60
  }
}

/**
 * O Modo Foco no topo — integrado, não uma porta.
 *
 * O botão mostra o estado do dia sem precisar abrir nada: o anel dos minutos
 * de hoje contra a meta diária e a chama dos dias seguidos. Sem nenhum minuto
 * hoje, ele pulsa (é o convite mais barato que existe: está em toda página).
 * Com sessão rodando, vira o relógio, com o anel da meta da sessão.
 *
 * Tocar abre o Modo Foco completo numa folha — lateral no computador, tela
 * cheia no celular —, o mesmo componente da aba Foco do Perfil: métodos,
 * ciclos, pausa, jogos de atenção, respiração. Começa-se a sessão sem sair da
 * página em que se está estudando.
 */
export function FocusSessionButton() {
  const { currentSession, elapsedMs, isModalOpen, closeModal, history } = useFocusSession()
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [meta, setMeta] = useState(60)
  const calmo = useReducedMotion()

  useEffect(() => {
    setMontado(true)
    setMeta(metaDiaria())
  }, [])

  // Outras telas (o cartão do painel inicial) pedem a folha aberta por aqui.
  useEffect(() => {
    if (!isModalOpen) return
    setAberto(true)
    closeModal()
  }, [isModalOpen, closeModal])

  const fechar = useCallback(() => {
    setAberto(false)
    setMeta(metaDiaria())
  }, [])

  // Folha aberta: Esc fecha e o fundo não rola.
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto, fechar])

  const minutosHoje = useMemo(() => {
    const semana = minutosPorDia(history)
    return semana[semana.length - 1]?.minutos || 0
  }, [history])
  const sequencia = useMemo(() => sequenciaDeFoco(history), [history])

  if (!montado) return null

  const ativa = currentSession?.status === 'active'
  const pausada = currentSession?.status === 'paused'
  const emAndamento = ativa || pausada
  const alvoMs = (currentSession?.targetMinutes || 0) * 60_000
  const fracao = alvoMs > 0 ? elapsedMs / alvoMs : null
  const bateuMeta = alvoMs > 0 && elapsedMs >= alvoMs
  const fracaoDoDia = Math.min(1, minutosHoje / Math.max(1, meta))
  const convidando = !emAndamento && minutosHoje === 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={
          emAndamento
            ? `Sessão de foco ${pausada ? 'pausada' : 'em andamento'}: ${formatarRelogio(elapsedMs)}. Abrir o Modo Foco`
            : `Modo Foco: ${minutosHoje} de ${meta} minutos hoje${sequencia ? `, ${sequencia} dias seguidos` : ''}`
        }
        data-estado={pausada ? 'pausado' : bateuMeta ? 'meta' : ativa ? 'ativo' : 'parado'}
        data-convite={convidando ? '' : undefined}
        data-ferramenta="foco"
        data-dica={emAndamento ? 'Sessão de foco' : `Foco hoje: ${minutosHoje}/${meta} min`}
        className={cn('foco-gatilho', aberto && 'foco-gatilho-aberto')}
      >
        {emAndamento ? (
          <>
            <AnelDeFoco fracao={fracao} tamanho={20} espessura={3} estado={pausada ? 'pausado' : bateuMeta ? 'meta' : 'ativo'} />
            <span className="foco-gatilho-relogio">{formatarRelogio(elapsedMs)}</span>
          </>
        ) : (
          <>
            <span className="foco-gatilho-anel" aria-hidden>
              <AnelDeFoco fracao={fracaoDoDia} tamanho={26} espessura={3} estado={fracaoDoDia >= 1 ? 'meta' : 'ativo'}>
                <Timer className="h-[13px] w-[13px]" strokeWidth={2.4} />
              </AnelDeFoco>
            </span>
            <span className="hidden sm:inline">Foco</span>
            {sequencia > 0 && (
              <span className="foco-gatilho-chama" aria-hidden>
                <Flame className="h-3 w-3" />
                {sequencia}
              </span>
            )}
          </>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {aberto && (
            <motion.div
              className="foco-folha-palco"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fechar}
            >
              <motion.div
                className="foco-folha ck-escopo"
                role="dialog"
                aria-modal="true"
                aria-label="Modo Foco"
                onClick={(e) => e.stopPropagation()}
                initial={calmo ? { opacity: 0 } : { x: '100%' }}
                animate={{ x: 0, opacity: 1 }}
                exit={calmo ? { opacity: 0 } : { x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              >
                <header className="foco-folha-topo">
                  <span className="foco-folha-titulo">
                    <Timer className="h-5 w-5" /> Modo Foco
                  </span>
                  <button type="button" className="foco-folha-fechar" onClick={fechar} aria-label="Fechar o Modo Foco">
                    <X className="h-5 w-5" />
                  </button>
                </header>
                <div className="foco-folha-corpo">
                  <ModoFoco />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        // Em tela cheia (o leitor de PDF no computador) só o elemento em
        // tela cheia aparece: um portal no <body> abriria a folha invisível.
        (getFullscreenElement() as HTMLElement | null) ?? document.body,
      )}
    </div>
  )
}
