/**
 * Custom hook for API data fetching with built-in caching and deduplication
 * Replaces multiple useEffect + fetch patterns with a cleaner interface
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchAPI, invalidateCache, CACHE_DURATIONS } from '@/lib/api-client'

interface UseApiOptions {
  skip?: boolean // Skip fetching (e.g., when not authenticated)
  refetchInterval?: number // Auto-refetch interval in milliseconds
  cacheDuration?: number // Cache duration in milliseconds
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  skipCache?: boolean // Force fresh fetch
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook for fetching API data with caching and deduplication
 * @param endpoint - API endpoint (e.g., '/api/auth/me')
 * @param options - Configuration options
 * @returns { data, loading, error, refetch }
 */
export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiState<T> {
  const {
    skip = false,
    refetchInterval,
    cacheDuration = CACHE_DURATIONS.USER,
    onSuccess,
    onError,
    skipCache = false,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState<Error | null>(null)

  const mountedRef = useRef(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  const fetchData = useCallback(async () => {
    if (skip || !endpoint) return

    try {
      setLoading(true)
      setError(null)

      const result = await fetchAPI<T>(endpoint, {
        method: 'GET',
        cacheDuration,
        skipCache,
      })

      if (mountedRef.current) {
        setData(result)
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      if (mountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [endpoint, skip, cacheDuration, skipCache, onSuccess, onError])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Setup auto-refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0 && !skip) {
      intervalRef.current = setInterval(fetchData, refetchInterval)
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refetchInterval, skip, fetchData])

  // Cleanup on unmount.
  // O `mountedRef.current = true` na entrada é obrigatório, não redundante: em
  // StrictMode (dev) o React monta, desmonta e remonta: o cleanup zera a flag e,
  // sem restaurá-la aqui, ela fica false para sempre. A partir daí todo
  // setData/setLoading é descartado e o componente congela em "carregando" —
  // só no dev, porque em produção o efeito roda uma vez só.
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refetch = useCallback(async () => {
    invalidateCache(endpoint)
    await fetchData()
  }, [endpoint, fetchData])

  return { data, loading, error, refetch }
}

/**
 * Hook for POST/PUT/PATCH/DELETE mutations
 */
interface UseMutationOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  invalidateEndpoints?: string[] // Endpoints to invalidate on success
}

interface UseMutationState<T> {
  mutate: (body: any) => Promise<T>
  loading: boolean
  error: Error | null
  data: T | null
}

export function useMutation<T = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions = {}
): UseMutationState<T> {
  const { onSuccess, onError, invalidateEndpoints = [] } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const mutate = useCallback(
    async (body: any): Promise<T> => {
      try {
        setLoading(true)
        setError(null)

        const result = await fetchAPI<T>(endpoint, {
          method,
          body,
        })

        setData(result)

        // Invalidate related endpoints after successful mutation
        invalidateEndpoints.forEach(ep => invalidateCache(ep))

        onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [endpoint, method, onSuccess, onError, invalidateEndpoints]
  )

  return { mutate, loading, error, data }
}
