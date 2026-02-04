/**
 * Optimized API Client with Request Deduplication and Caching
 * Reduces redundant API calls and implements client-side caching
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface RequestCache {
  [key: string]: Promise<any>
}

// In-memory cache for API responses
const responseCache = new Map<string, CacheEntry<any>>()

// Track pending requests to prevent duplicates
const pendingRequests: RequestCache = {}

// Default cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  // Auth data - longer cache since it rarely changes during session
  USER: 5 * 60 * 1000, // 5 minutes
  AUTH: 5 * 60 * 1000, // 5 minutes

  // User data - moderate cache
  TIER_LIMITS: 5 * 60 * 1000, // 5 minutes
  SETTINGS: 10 * 60 * 1000, // 10 minutes

  // Notification data - shorter cache for real-time feel
  NOTIFICATIONS: 30 * 1000, // 30 seconds (polling happens anyway)

  // Content data - longer cache
  EXAMS: 10 * 60 * 1000, // 10 minutes
  QUESTIONS: 10 * 60 * 1000, // 10 minutes
  CRONOGRAMAS: 10 * 60 * 1000, // 10 minutes
  AULAS: 15 * 60 * 1000, // 15 minutes
  BANCO: 15 * 60 * 1000, // 15 minutes

  // Admin data - longer cache
  ADMIN_STATS: 10 * 60 * 1000, // 10 minutes
  ADMIN_SETTINGS: 30 * 60 * 1000, // 30 minutes

  // Ban status - shorter for security
  BAN_STATUS: 60 * 1000, // 60 seconds
} as const

/**
 * Deduplicates concurrent requests to the same endpoint
 * If a request is already in flight, returns the same promise
 */
function getDedupedRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests[key]) {
    return pendingRequests[key]
  }

  const promise = fetcher().finally(() => {
    delete pendingRequests[key]
  })

  pendingRequests[key] = promise
  return promise
}

/**
 * Gets or sets cached data with automatic expiration
 */
function getCachedData<T>(key: string): T | null {
  const entry = responseCache.get(key)

  if (!entry) {
    return null
  }

  // Check if cache has expired
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key)
    return null
  }

  return entry.data as T
}

function setCachedData<T>(key: string, data: T, duration: number): void {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + duration,
  })
}

/**
 * Core API fetch function with caching and deduplication
 */
export async function fetchAPI<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: any
    skipCache?: boolean
    cacheDuration?: number
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    skipCache = false,
    cacheDuration = CACHE_DURATIONS.USER,
    headers = {},
  } = options

  // Cache only GET requests
  const isCacheable = method === 'GET' && !skipCache
  const cacheKey = endpoint

  // Return cached data if available
  if (isCacheable) {
    const cached = getCachedData<T>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Deduplicate concurrent requests
  const fetcher = async () => {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Cache successful responses
    if (isCacheable) {
      setCachedData(cacheKey, data, cacheDuration)
    }

    return data as T
  }

  return getDedupedRequest(cacheKey, fetcher)
}

/**
 * Manually invalidate cache for an endpoint
 * Use this after mutations to refresh data
 */
export function invalidateCache(endpoint: string): void {
  responseCache.delete(endpoint)
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  responseCache.clear()
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  const entries = Array.from(responseCache.entries()).map(([key, entry]) => ({
    endpoint: key,
    age: Date.now() - entry.timestamp,
    expiresIn: entry.expiresAt - Date.now(),
  }))

  return {
    size: responseCache.size,
    entries,
  }
}
