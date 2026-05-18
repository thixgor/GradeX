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
