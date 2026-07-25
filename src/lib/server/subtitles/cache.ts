const cache = new Map<string, { data: unknown; ts: number }>();
const MAX_SIZE = 100;

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  if (cache.size >= MAX_SIZE) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, { data, ts: Date.now() });
}
