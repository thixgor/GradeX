import { useEffect, useRef, useState, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const apiCache = new Map<string, CacheEntry<any>>()

export function useApiCache<T>(
  url: string,
  options: {
    ttl?: number // Time to live em milissegundos (padrão: 30s)
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const { ttl = 30000, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    const now = Date.now()
    const cached = apiCache.get(url)

    // Se há cache válido, usar
    if (cached && now - cached.timestamp < cached.ttl) {
      if (isMountedRef.current) {
        setData(cached.data)
        setLoading(false)
        setError(null)
        onSuccess?.(cached.data)
      }
      return
    }

    // Caso contrário, fazer fetch
    try {
      setLoading(true)
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const result = await res.json()

      // Cachear resultado
      apiCache.set(url, {
        data: result,
        timestamp: now,
        ttl,
      })

      if (isMountedRef.current) {
        setData(result)
        setLoading(false)
        setError(null)
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      if (isMountedRef.current) {
        setError(error)
        setLoading(false)
        onError?.(error)
      }
    }
  }, [url, ttl, onSuccess, onError])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    // Limpar cache para forçar novo fetch
    apiCache.delete(url)
    fetchData()
  }, [url, fetchData])

  return { data, loading, error, refetch }
}

// Função para limpar cache manualmente
export function clearApiCache(url?: string) {
  if (url) {
    apiCache.delete(url)
  } else {
    apiCache.clear()
  }
}
