/**
 * Simple in-memory cache for job data.
 * Eliminates repeated DB round-trips for the same data.
 * TTL-based expiration ensures data freshness.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 30_000; // 30 seconds

/**
 * Get cached data or fetch fresh data using the provided function.
 * @param key - Cache key (e.g., "jobs:companyId:1")
 * @param fetchFn - Async function to fetch data if cache is stale/empty
 * @param ttl - Time-to-live in milliseconds (default: 30s)
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && now - entry.timestamp < ttl) {
    return entry.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
}

/**
 * Invalidate all cache entries matching a prefix.
 * Call this on POST/PUT/DELETE to ensure fresh data on next GET.
 */
export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  cache.clear();
}


