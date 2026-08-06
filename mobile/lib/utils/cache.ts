import { storage } from "@/lib/utils/storage";

export type CachedItem<T> = {
  value: T;
  savedAt: number;
  ttl: number;
};

// In-memory map for fast synchronous reads after preloading
const memoryCache = new Map<string, { value: unknown; savedAt: number; ttl: number }>();

export async function preloadCache(keys: string[]) {
  try {
    const entries = await storage.multiGet(keys);
    for (const [key, raw] of entries) {
      if (!raw) continue;
      try {
        const item: CachedItem<unknown> = JSON.parse(raw);
        if (!item || typeof item !== "object") continue;
        // skip expired
        if (Date.now() - item.savedAt > item.ttl) {
          await storage.removeItem(key);
          continue;
        }
        memoryCache.set(key, { value: item.value, savedAt: item.savedAt, ttl: item.ttl });
      } catch {}
    }
  } catch (err) {
    // ignore preload errors
  }
}

export function getCacheSync<T>(key: string): T | null {
  const persisted = storage.getItemSync(key);
  if (persisted) {
    try {
      const item: CachedItem<T> = JSON.parse(persisted);
      if (!item || typeof item !== "object") return null;
      if (Date.now() - item.savedAt > item.ttl) {
        storage.removeItem(key).catch(() => {});
        memoryCache.delete(key);
        return null;
      }
      memoryCache.set(key, { value: item.value, savedAt: item.savedAt, ttl: item.ttl });
      return item.value;
    } catch {
      storage.removeItem(key).catch(() => {});
      return null;
    }
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCache<T>(key: string, value: T, ttlMs: number) {
  const item: CachedItem<T> = { value, savedAt: Date.now(), ttl: ttlMs };
  memoryCache.set(key, { value, savedAt: item.savedAt, ttl: ttlMs });
  await storage.setItem(key, JSON.stringify(item));
}

export async function getCache<T>(key: string): Promise<T | null> {
  // prefer memory
  const mem = getCacheSync<T>(key);
  if (mem !== null) return mem;
  const raw = await storage.getItem(key);
  if (!raw) return null;
  try {
    const item: CachedItem<T> = JSON.parse(raw);
    if (!item || typeof item !== "object") return null;
    if (Date.now() - item.savedAt > item.ttl) {
      // expired
      await storage.removeItem(key);
      return null;
    }
    // populate memory
    memoryCache.set(key, { value: item.value, savedAt: item.savedAt, ttl: item.ttl });
    return item.value;
  } catch (err) {
    await storage.removeItem(key);
    return null;
  }
}

export async function clearCache(key: string) {
  memoryCache.delete(key);
  await storage.removeItem(key);
}

export async function clearCaches(keys: string[]) {
  for (const key of keys) {
    memoryCache.delete(key);
  }
  await storage.multiRemove(keys);
}

export async function clearCachePrefix(prefix: string) {
  const keys = (await storage.getAllKeys()).filter((key) => key.startsWith(prefix));
  if (keys.length === 0) return;
  for (const key of keys) {
    memoryCache.delete(key);
  }
  await storage.multiRemove(keys);
}
