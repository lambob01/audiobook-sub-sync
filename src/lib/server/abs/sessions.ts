const sessionCache = new Map<string, { itemId: string; tracks: Array<{ contentUrl: string; ino: string }> }>();

export function setCachedSession(key: string, session: { itemId: string; tracks: Array<{ contentUrl: string; ino: string }> }) {
  sessionCache.set(key, session);
}

export function getCachedSession(key: string) {
  return sessionCache.get(key);
}

export function clearSession(key: string) {
  sessionCache.delete(key);
}
