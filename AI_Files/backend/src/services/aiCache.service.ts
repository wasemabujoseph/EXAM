
import { CacheEntry } from '../types/ai.types';

/**
 * AI Cache Service
 * Handles TTL-based in-memory caching for AI summaries and analyses.
 * Designed to be easily replaced with Redis if needed.
 */
export class AICacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static defaultTTL = (Number(process.env.AI_INSIGHTS_TTL_HOURS) || 24) * 60 * 60 * 1000;

  /**
   * Generates a unique cache key based on params.
   */
  static generateKey(type: string, entityId: string, model: string = 'default'): string {
    return `${type}:${entityId}:${model}`;
  }

  /**
   * Retrieves data from cache if it exists and is not expired.
   * @param key - The cache key
   * @param freshnessSignature - Optional signature to check for stale-while-revalidate 
   */
  static get<T>(key: string, freshnessSignature?: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check expiry
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Check freshness signature (e.g. hash of student results count)
    if (freshnessSignature && entry.freshnessSignature !== freshnessSignature) {
      // Mark as stale - for now we just return null to force re-generation
      // In a more complex system we could return the stale data and trigger background refresh
      return null; 
    }

    return entry.data as T;
  }

  /**
   * Stores data in the cache.
   */
  static set<T>(key: string, data: T, freshnessSignature: string = ''): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.defaultTTL,
      freshnessSignature
    });
  }

  /**
   * Invalidates a specific key or entity.
   */
  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidates all keys for a specific entity ID (across different types/models).
   */
  static invalidateEntity(entityId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`:${entityId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  static clear(): void {
    this.cache.clear();
  }
}
