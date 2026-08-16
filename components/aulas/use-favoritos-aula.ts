'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Favoritos de aula, no servidor (§21).
 *
 * Guardados na conta e não no aparelho, ao contrário dos favoritos das
 * Ferramentas Clínicas: aula é conteúdo pago que a pessoa assiste no computador
 * e no celular, e um favorito que não atravessa aparelhos seria descoberto como
 * defeito na primeira troca.
 *
 * A troca é otimista. Salvar uma aula é um gesto de baixo custo e alta
 * frequência — esperar a rede para pintar a estrela faria a interface parecer
 * travada num toque que deveria ser instantâneo. Se o servidor recusar, o
 * estado volta.
 */
export function useFavoritosDeAula() {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/aulas/favoritos', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { aulaIds: [] }))
      .then((d) => vivo && setIds(new Set<string>(d.aulaIds || [])))
      .catch(() => {})
      .finally(() => vivo && setPronto(true))
    return () => {
      vivo = false
    }
  }, [])

  const ehFavorito = useCallback((aulaId: string) => ids.has(aulaId), [ids])

  const alternar = useCallback(
    async (aulaId: string) => {
      const eraFavorito = ids.has(aulaId)

      setIds((atual) => {
        const novo = new Set(atual)
        if (eraFavorito) novo.delete(aulaId)
        else novo.add(aulaId)
        return novo
      })

      try {
        const res = await fetch('/api/aulas/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // O estado desejado vai explícito: dois toques rápidos com "alterna"
          // implícito podem chegar fora de ordem e acabar no valor errado.
          body: JSON.stringify({ aulaId, favorito: !eraFavorito }),
        })
        if (!res.ok) throw new Error()
      } catch {
        setIds((atual) => {
          const novo = new Set(atual)
          if (eraFavorito) novo.add(aulaId)
          else novo.delete(aulaId)
          return novo
        })
      }
    },
    [ids],
  )

  return { ids, ehFavorito, alternar, pronto }
}
