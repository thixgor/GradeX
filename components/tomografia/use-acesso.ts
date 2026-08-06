'use client'

import { useEffect, useState } from 'react'
import type { PlanoResumo, ResumoAtlas } from './paywall'

export interface AcessoTomografia {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    isActive: boolean
    currentPrice: number
    price: number
    plans?: PlanoResumo[]
    pricingEventId?: string | null
  }
  resumo?: ResumoAtlas
}

/**
 * Estado de acesso ao Manual de Tomografia.
 *
 * A checagem é feita no servidor (a rota consulta compra ativa, plano Plus+ e
 * admin) e nunca no cliente — o que chega aqui é só o veredito. As duas páginas
 * do atlas compartilham este hook para que a regra viva num lugar só.
 */
export function useAcessoTomografia() {
  const [dados, setDados] = useState<AcessoTomografia | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/manual-clinico/tomografia')
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
