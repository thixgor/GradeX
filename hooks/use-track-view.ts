'use client'

import { useEffect } from 'react'
import { trackView, type TrackViewInput } from '@/lib/tracking/track-client'

/**
 * Registra a abertura de um conteúdo assim que ele termina de carregar.
 *
 * `enabled` existe porque quase toda página busca os dados antes de saber o
 * título do recurso — sem ele, o painel receberia "Abriu patologia" sem nome.
 */
export function useTrackView(input: TrackViewInput | null, enabled = true): void {
  const kind = input?.kind
  const resourceId = input?.resourceId
  const resourceTitle = input?.resourceTitle
  const metaKey = input?.meta ? JSON.stringify(input.meta) : ''

  useEffect(() => {
    if (!enabled || !kind) return
    trackView({
      kind,
      resourceId,
      resourceTitle,
      meta: metaKey ? JSON.parse(metaKey) : undefined,
    })
  }, [enabled, kind, resourceId, resourceTitle, metaKey])
}
