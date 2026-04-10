import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number) {
    this.cache = new NodeCache({ 
      stdTTL: ttlSeconds, 
      checkperiod: ttlSeconds * 0.2,
      useClones: false 
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (ttl) {
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  del(keys: string | string[]): void {
    this.cache.del(keys);
  }

  flush(): void {
    this.cache.flushAll();
  }

  // Helper to clear pattern
  delPattern(pattern: string): void {
    const keys = this.cache.keys();
    const filteredKeys = keys.filter(key => key.startsWith(pattern));
    this.cache.del(filteredKeys);
  }
}

// Export pre-configured instances or a default one
export const dashboardCache = new CacheService(60); // 1 min
export const settingsCache = new CacheService(600); // 10 mins
export const structureCache = new CacheService(300); // 5 mins

export default new CacheService(60);
