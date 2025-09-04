/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis for distributed caching
 */

import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

/**
 * Generic in-memory cache implementation
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly ttl: number;
  private readonly maxSize: number;
  private cleanupTimer?: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
    this.maxSize = options.maxSize || 100; // Default 100 items

    // Start cleanup timer if TTL is set
    if (this.ttl > 0 && options.cleanupInterval !== 0) {
      const interval = options.cleanupInterval || 60 * 1000; // Default 1 minute
      this.cleanupTimer = setInterval(() => this.cleanup(), interval);
      this.cleanupTimer.unref(); // Don't keep process alive
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return undefined;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      logger.debug('Cache entry expired', { key });
      return undefined;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;
    logger.debug('Cache hit', { key, hits: entry.hits });

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, customTtl?: number): void {
    // Check size limit and evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const ttl = customTtl !== undefined ? customTtl : this.ttl;
    const expiresAt = ttl > 0 ? Date.now() + ttl : Number.MAX_SAFE_INTEGER;

    this.cache.set(key, {
      value,
      expiresAt,
      hits: 0,
    });

    this.stats.sets++;
    logger.debug('Cache set', { key, ttl });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entries: size });
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (this.ttl > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set value with factory function
   */
  async getOrSet(
    key: string,
    factory: () => T | Promise<T>,
    customTtl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Generate new value
    const value = await factory();

    // Store in cache
    this.set(key, value, customTtl);

    return value;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    if (this.ttl <= 0) return;

    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', { removed: cleaned });
    }
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Number.MAX_SAFE_INTEGER;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    // Find LRU item
    for (const [key, entry] of this.cache.entries()) {
      if (
        entry.hits < minHits ||
        (entry.hits === minHits && entry.expiresAt < oldestTime)
      ) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.expiresAt;
      }
    }

    // Evict LRU item
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      logger.debug('Cache LRU eviction', { key: lruKey });
    }
  }

  /**
   * Destroy cache and clear timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

// Create singleton caches for different purposes
export const userInfoCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
});

export const tokenValidationCache = new MemoryCache<boolean>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
});

export const channelCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 200,
});

// Export for testing
export default MemoryCache;
