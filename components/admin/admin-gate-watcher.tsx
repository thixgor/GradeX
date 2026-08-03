'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ADMIN_GATE_ERROR_CODE, ADMIN_GATE_PAGE } from '@/lib/admin-gate'

/**
 * O middleware já manda quem navega no painel para a tela do código quando a
 * trava expira. Requests em segundo plano (fetch das telas) não navegam — eles
 * só recebem 403 e a tela ficaria quebrada, sem explicação.
 *
 * Este observador escuta as respostas do próprio painel e, ao ver o código
 * ADMIN_CODE_REQUIRED, leva o admin para a tela de desbloqueio guardando a
 * página em que ele estava.
 */
export function AdminGateWatcher() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname?.startsWith(ADMIN_GATE_PAGE)) return

    const originalFetch = window.fetch
    let redirecting = false

    window.fetch = async function patchedFetch(...args) {
      const response = await originalFetch.apply(this, args)

      // Só o 403 interessa; qualquer outra resposta passa intacta.
      if (response.status === 403 && !redirecting) {
        try {
          const data = await response.clone().json()
          if (data?.code === ADMIN_GATE_ERROR_CODE) {
            redirecting = true
            const redirectTo = window.location.pathname + window.location.search
            router.replace(`${ADMIN_GATE_PAGE}?redirect=${encodeURIComponent(redirectTo)}`)
          }
        } catch {
          // 403 sem corpo JSON: não é da trava, segue o fluxo normal.
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [pathname, router])

  return null
}
