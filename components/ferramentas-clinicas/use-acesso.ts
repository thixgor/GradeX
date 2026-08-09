'use client'

import { useEffect, useState } from 'react'
import type { ResumoFerramentas } from '@/app/api/manual-clinico/ferramentas/route'

export interface PlanoResumo {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

export interface AcessoFerramentas {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    isActive: boolean
    currentPrice: number
    price: number
    plans?: PlanoResumo[]
    pricingEventId?: string | null
  }
  resumo?: ResumoFerramentas
}

/**
 * Estado de acesso às Ferramentas Clínicas.
 *
 * Quem decide é o servidor — a rota consulta compra ativa, plano Plus+ e admin.
 * Aqui chega só o veredito, e as duas páginas da seção compartilham este hook
 * para que a regra não se duplique em dois lugares que podem discordar.
 */
export function useAcessoFerramentas() {
  const [dados, setDados] = useState<AcessoFerramentas | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/manual-clinico/ferramentas')
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        setDados(d)
        setCarregado(true)
      })
      .catch(() => {
        if (vivo) setCarregado(true)
      })
    return () => {
      vivo = false
    }
  }, [])

  return { dados, carregado }
}
