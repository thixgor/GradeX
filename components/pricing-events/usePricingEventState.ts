'use client'

import { useEffect, useRef, useState } from 'react'
import type { PricingEventStatePayload } from './PricingEventCountdown'

const cache = new Map<string, { ts: number; state: PricingEventStatePayload | null }>()
const CACHE_TTL_MS = 30_000

export function usePricingEventState(eventId: string | null | undefined) {
  const [state, setState] = useState<PricingEventStatePayload | null>(null)
  const [loading, setLoading] = useState<boolean>(!!eventId)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!eventId) {
      setState(null)
      setLoading(false)
      return
    }

    const cached = cache.get(eventId)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setState(cached.state)
      setLoading(false)
      return
    }

    setLoading(true)
    let canceled = false
    fetch(`/api/pricing-events/${eventId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { state: PricingEventStatePayload | null }) => {
        if (canceled || !mountedRef.current) return
        cache.set(eventId, { ts: Date.now(), state: data.state })
        setState(data.state)
        setLoading(false)
      })
      .catch(() => {
        if (canceled || !mountedRef.current) return
        setState(null)
        setLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [eventId])

  return { state, loading }
}

/**
 * Busca o estado de vários eventos de uma vez (ex.: um por plano).
 * Retorna um Map id -> state. Reaproveita o mesmo cache do hook singular.
 */
export function usePricingEventStates(eventIds: (string | null | undefined)[]) {
  const key = Array.from(new Set(eventIds.filter((x): x is string => !!x))).sort().join(',')
  const [states, setStates] = useState<Map<string, PricingEventStatePayload | null>>(new Map())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const ids = key ? key.split(',') : []
    if (ids.length === 0) {
      setStates(new Map())
      return
    }

    let canceled = false
    Promise.all(
      ids.map(async (id) => {
        const cached = cache.get(id)
        if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
          return [id, cached.state] as const
        }
        try {
          const res = await fetch(`/api/pricing-events/${id}`, { cache: 'no-store' })
          const data = res.ok ? await res.json() : { state: null }
          cache.set(id, { ts: Date.now(), state: data.state })
          return [id, data.state] as const
        } catch {
          return [id, null] as const
        }
      })
    ).then((entries) => {
      if (canceled || !mountedRef.current) return
      setStates(new Map(entries))
    })

    return () => {
      canceled = true
    }
  }, [key])

  return states
}
