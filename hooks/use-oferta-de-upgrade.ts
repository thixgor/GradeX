'use client'

import { useEffect, useState } from 'react'
import type { ItemDaOferta, PerfilDoComprador } from '@/lib/plus-oferta'

/** Um plano Plus+ da oferta, como `/api/upgrade` devolve. */
export interface PlanoDaOfertaDeUpgrade {
  tipo: string
  nome: string
  periodo: string
  preco: number
  precoOriginal: number | null
  precoUpgrade: number
  /** 0 = vitalício. */
  durationMonths: number
  badge: string
  inclusos: ItemDaOferta[]
}

export interface OfertaDeUpgrade {
  perfil: PerfilDoComprador
  logado: boolean
  ativo: boolean
  elegivel: boolean
  previa?: boolean
  primeiroNome?: string
  descontoPercentual?: number
  /** Quanto falta para a janela fechar quando a resposta saiu; `null` sem contagem. */
  restanteMs?: number | null
  janelaHoras?: number
  planoPadrao?: string
  planos?: PlanoDaOfertaDeUpgrade[]
  quest?: { expiraEm: string | null; vitalicio: boolean; recorrente: boolean }
  /** `Date.now()` do navegador quando a resposta chegou — base do contador. */
  recebidaEm?: number
}

/**
 * A oferta de upgrade Quest+ → Plus+ desta conta, lida uma vez.
 *
 * `undefined` enquanto carrega; `null` se a busca falhar (as telas tratam
 * como "sem oferta" e seguem iguais — a chamada é enfeite de conversão, não
 * pode derrubar /buy nem o perfil). `ativo: false` não busca nada.
 */
export function useOfertaDeUpgrade(opcoes: { ativo?: boolean; previa?: boolean } = {}) {
  const { ativo = true, previa = false } = opcoes
  const [oferta, setOferta] = useState<OfertaDeUpgrade | null | undefined>(undefined)

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    fetch(`/api/upgrade${previa ? '?previa=1' : ''}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados: OfertaDeUpgrade | null) => {
        if (vivo) setOferta(dados ? { ...dados, recebidaEm: Date.now() } : null)
      })
      .catch(() => {
        if (vivo) setOferta(null)
      })
    return () => {
      vivo = false
    }
  }, [ativo, previa])

  return oferta
}
