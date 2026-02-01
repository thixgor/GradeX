import { useState, useCallback, useRef } from 'react'

interface UseLoadingButtonOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useLoadingButton(options: UseLoadingButtonOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)

  const execute = useCallback(async (asyncFn: () => Promise<void>) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      await asyncFn()

      if (isMounted.current) {
        setIsLoading(false)
        options.onSuccess?.()
      }
    } catch (err) {
      if (isMounted.current) {
        setIsLoading(false)
        const error = err instanceof Error ? err : new Error('An error occurred')
        setError(error)
        options.onError?.(error)
      }
    }
  }, [isLoading, options])

  return { isLoading, error, execute }
}
