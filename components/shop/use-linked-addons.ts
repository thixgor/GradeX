'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PhysicalProduct } from '@/lib/types'

/**
 * Busca os produtos físicos add-on vinculados a um conjunto de materiais.
 * Aceita materialIds diretos e/ou packageIds (resolvidos para seus materiais).
 * Retorna apenas produtos com linkMode 'addon' e visíveis.
 */
export function useLinkedAddons(opts: { materialIds?: string[]; packageIds?: string[] }) {
  const materialsKey = (opts.materialIds || []).slice().sort().join(',')
  const packagesKey = (opts.packageIds || []).slice().sort().join(',')

  const [products, setProducts] = useState<PhysicalProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function run() {
      setLoading(true)
      try {
        const ids = new Set<string>((materialsKey ? materialsKey.split(',') : []).filter(Boolean))
        const pkgIds = (packagesKey ? packagesKey.split(',') : []).filter(Boolean)

        // Resolve materiais dos pacotes (add-ons vinculados a materiais internos).
        if (pkgIds.length > 0) {
          const results = await Promise.all(
            pkgIds.map((pid) =>
              fetch(`/api/materiais/packages/${pid}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            )
          )
          for (const res of results) {
            const matIds: string[] = res?.package?.materialIds || []
            matIds.forEach((m) => ids.add(String(m)))
          }
        }

        if (ids.size === 0 && pkgIds.length === 0) {
          if (alive) { setProducts([]); setLoading(false) }
          return
        }

        // Busca add-ons vinculados aos materiais E diretamente aos pacotes.
        const params = new URLSearchParams()
        if (ids.size > 0) params.set('linkedMaterialIds', Array.from(ids).join(','))
        if (pkgIds.length > 0) params.set('linkedPackageIds', pkgIds.join(','))
        const data = await fetch(`/api/loja/produtos?${params.toString()}`)
          .then((r) => r.json())
          .catch(() => ({ products: [] }))
        const list: PhysicalProduct[] = (Array.isArray(data.products) ? data.products : []).filter(
          (p: PhysicalProduct) => p.linkMode === 'addon'
        )
        if (alive) setProducts(list)
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [materialsKey, packagesKey])

  return useMemo(() => ({ products, loading }), [products, loading])
}
