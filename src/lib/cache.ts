/**
 * Cache utilities for localStorage persistence
 * Handles serialization, expiration, and error handling
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires?: number; // TTL in milliseconds
}

class CacheManager {
  private prefix = 'claude_chat_';

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Set item in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): boolean {
    if (!this.isLocalStorageAvailable()) return false;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expires: ttlMs ? Date.now() + ttlMs : undefined,
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Get item from cache, returns null if expired or not found
   */
  get<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (cacheItem.expires && Date.now() > cacheItem.expires) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      this.remove(key); // Remove corrupted cache
      return null;
    }
  }

  /**
   * Check if cache item exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(key: string): number | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheItem: CacheItem<any> = JSON.parse(cached);
      return Date.now() - cacheItem.timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Check if cache is stale (older than threshold)
   */
  isStale(key: string, staleThresholdMs: number): boolean {
    const age = this.getAge(key);
    return age === null || age > staleThresholdMs;
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const cacheKey = `${this.prefix}${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache items with our prefix
   */
  clear(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; totalSize: number } {
    if (!this.isLocalStorageAvailable()) return { count: 0, totalSize: 0 };
    
    let count = 0;
    let totalSize = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          count++;
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return { count, totalSize };
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache keys constants
export const CACHE_KEYS = {
  PROJECTS: 'projects',
  PROJECT_PREFIX: 'project_',
  CHANNELS_PREFIX: 'channels_',
  USER_PROFILE: 'user_profile',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  PROJECTS: 15 * 60 * 1000,    // 15 minutes (very stable)
  PROJECT: 10 * 60 * 1000,     // 10 minutes (stable)
  CHANNELS: 10 * 60 * 1000,    // 10 minutes (channels rarely change)
  USER_PROFILE: 15 * 60 * 1000, // 15 minutes (very stable)
  MESSAGES: 30 * 1000,         // 30 seconds (real-time data)
} as const;

// Stale thresholds - when to trigger background refresh
export const STALE_THRESHOLD = {
  PROJECTS: 5 * 60 * 1000,     // 5 minutes (background refresh)
  PROJECT: 3 * 60 * 1000,      // 3 minutes (background refresh)
  CHANNELS: 5 * 60 * 1000,     // 5 minutes (channels are stable)
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  MESSAGES: 5 * 1000,          // 5 seconds (keep messages fresh)
} as const;