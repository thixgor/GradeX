'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CHAVE_GLOBAL_INSTALACAO,
  detectarPlataforma,
  esperaPromptNativo,
  estaEmModoApp,
  instrucoesDe,
  type EstadoGlobalInstalacao,
  type Instrucoes,
  type PlataformaInstalacao,
} from '@/lib/pwa/instalacao'

export type ResultadoInstalacao = 'instalado' | 'recusado' | 'indisponivel'

export interface EstadoInstalacao {
  /** `false` até o primeiro efeito rodar — não dá para detectar no servidor. */
  pronto: boolean
  plataforma: PlataformaInstalacao
  instrucoes: Instrucoes
  /** O diálogo nativo está disponível AGORA (evento em mãos). */
  podeInstalarAgora: boolean
  /** O navegador ainda pode disparar o evento; vale esperar antes de ensinar. */
  aguardandoPromptNativo: boolean
  /** Já está rodando como app instalado (ou acabou de instalar). */
  jaInstalado: boolean
  instalar: () => Promise<ResultadoInstalacao>
}

function lerGlobal(): EstadoGlobalInstalacao | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as Record<string, EstadoGlobalInstalacao | undefined>)[
      CHAVE_GLOBAL_INSTALACAO
    ] ?? null
  )
}

/**
 * Estado de instalação do app, pronto para a UI.
 *
 * O evento `beforeinstallprompt` é capturado por um script no <head>
 * (`SCRIPT_CAPTURA_INSTALACAO`), porque ele costuma disparar antes de o React
 * hidratar. Aqui a gente só se inscreve na caixinha global que aquele script
 * mantém — assim o botão "Instalar" aparece na primeira visita, e não só
 * depois de recarregar a página.
 */
export function useInstalarApp(): EstadoInstalacao {
  const [pronto, setPronto] = useState(false)
  const [plataforma, setPlataforma] = useState<PlataformaInstalacao>('desconhecida')
  const [userAgent, setUserAgent] = useState('')
  const [temEvento, setTemEvento] = useState(false)
  const [jaInstalado, setJaInstalado] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    setUserAgent(ua)
    setPlataforma(
      detectarPlataforma({
        userAgent: ua,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints,
      }),
    )
    setJaInstalado(estaEmModoApp())
    setPronto(true)

    const global = lerGlobal()
    if (!global) return

    const sincronizar = () => {
      setTemEvento(!!global.evento)
      if (global.instalado) setJaInstalado(true)
    }
    sincronizar()
    global.inscritos.push(sincronizar)
    return () => {
      const i = global.inscritos.indexOf(sincronizar)
      if (i >= 0) global.inscritos.splice(i, 1)
    }
  }, [])

  // Instalar pelo menu do navegador não recarrega a página nem dispara
  // `appinstalled` em toda skin de Android; observar o display-mode cobre isso
  // e faz o convite sumir sozinho.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(display-mode: standalone)')
    const aoMudar = () => {
      if (mq.matches) setJaInstalado(true)
    }
    mq.addEventListener?.('change', aoMudar)
    return () => mq.removeEventListener?.('change', aoMudar)
  }, [])

  const instalar = useCallback(async (): Promise<ResultadoInstalacao> => {
    const global = lerGlobal()
    const evento = global?.evento
    if (!evento) return 'indisponivel'
    try {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      // O evento é de uso único: depois do prompt, ele não serve mais.
      if (global) global.evento = null
      setTemEvento(false)
      if (outcome === 'accepted') {
        setJaInstalado(true)
        return 'instalado'
      }
      return 'recusado'
    } catch {
      return 'indisponivel'
    }
  }, [])

  return {
    pronto,
    plataforma,
    instrucoes: instrucoesDe(plataforma),
    podeInstalarAgora: temEvento && !jaInstalado,
    aguardandoPromptNativo:
      !temEvento && !jaInstalado && esperaPromptNativo(plataforma, userAgent),
    jaInstalado,
    instalar,
  }
}
