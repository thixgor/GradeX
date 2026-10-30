'use client'

import { useEffect } from 'react'
import { reagirDom } from '@/lib/dom/reacoes'

/**
 * Avisa o Dom da nota de uma entrega — uma vez por entrega (a tela de
 * resultado re-renderiza muito e pode ser reaberta). Sem percentual (correção
 * pendente, TRI, prova avaliativa em andamento), não diz nada.
 */
export function ReacaoDoResultado({ chave, percentual }: { chave: string; percentual: number | null }) {
  useEffect(() => {
    if (percentual === null || !Number.isFinite(percentual)) return
    const marca = `dom:resultado:${chave}`
    try {
      if (sessionStorage.getItem(marca)) return
      sessionStorage.setItem(marca, '1')
    } catch {}
    // Depois da comemoração de XP da entrega, para os dois não se atropelarem.
    const t = setTimeout(() => reagirDom({ tipo: 'resultado', percentual }), 2600)
    return () => clearTimeout(t)
  }, [chave, percentual])
  return null
}
